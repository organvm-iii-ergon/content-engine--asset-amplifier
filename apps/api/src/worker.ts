/**
 * Cloudflare Worker — Cronus Metabolus API
 * Hono + Neon PostgreSQL + Cloudflare R2 + Multi-provider AI
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getDb, schema, toCamel, mapRows, eq, desc } from '@cronus/db';
import { resolveProviders } from '@cronus/config';

type Bindings = {
  ASSETS_BUCKET: R2Bucket;
  DATABASE_URL: string;
  API_KEY: string; // allow-secret
  ENCRYPTION_KEY: string; // allow-secret
  GROQ_API_KEY?: string; // allow-secret
  GEMINI_API_KEY?: string; // allow-secret
  CEREBRAS_API_KEY?: string; // allow-secret
  ANTHROPIC_API_KEY?: string; // allow-secret
  OPENAI_API_KEY?: string; // allow-secret
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_API_TOKEN?: string; // allow-secret
  [key: string]: unknown;
};

const app = new Hono<{ Bindings: Bindings }>();

// Inject env vars from Worker bindings into process.env
app.use('*', async (c, next) => {
  for (const [key, value] of Object.entries(c.env)) {
    if (typeof value === 'string') process.env[key] = value;
  }
  // Ensure production mode (skips Ollama localhost check)
  process.env.NODE_ENV = 'production';
  await next();
});

app.use('*', cors());

// ── Health ────────────────────────────────────────────────────
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Brands CRUD ───────────────────────────────────────────────
app.get('/api/v1/brands', async (c) => {
  const db = getDb();
  return c.json(mapRows(await db.select().from(schema.brands)));
});

app.get('/api/v1/brands/:id', async (c) => {
  const db = getDb();
  const [brand] = await db.select().from(schema.brands).where(eq(schema.brands.id, c.req.param('id')));
  if (!brand) return c.json({ error: 'Brand not found' }, 404);
  return c.json(toCamel(brand));
});

app.post('/api/v1/brands', async (c) => {
  const body = await c.req.json();
  const db = getDb();
  const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + crypto.randomUUID().slice(0, 6);
  const [brand] = await db.insert(schema.brands).values({
    name: body.name,
    slug,
    description: body.description ?? null,
    tone_description: body.tone_description ?? null,
    consistency_threshold: body.consistency_threshold ?? 0.75,
    agency_id: body.agency_id ?? null,
  }).returning();
  return c.json(toCamel(brand), 201);
});

// ── Asset Upload (R2) + Auto-Generation ───────────────────────
app.post('/api/v1/brands/:brandId/assets', async (c) => {
  const brandId = c.req.param('brandId');
  const db = getDb();

  const [brand] = await db.select().from(schema.brands).where(eq(schema.brands.id, brandId));
  if (!brand) return c.json({ error: 'Brand not found' }, 404);

  const formData = await c.req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return c.json({ error: 'No file uploaded' }, 400);

  const assetId = crypto.randomUUID();
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
  const allowedExts = ['mp4', 'mov', 'png', 'jpg', 'jpeg', 'tiff', 'tif'];
  if (!allowedExts.includes(ext)) return c.json({ error: `Unsupported file type: .${ext}` }, 400);

  const mediaType = ['mp4', 'mov'].includes(ext) ? 'video' : 'image';
  const storageKey = `brands/${brandId}/assets/${assetId}.${ext}`;

  // Upload to R2
  const bucket = c.env.ASSETS_BUCKET;
  await bucket.put(storageKey, file.stream(), {
    httpMetadata: { contentType: file.type },
    customMetadata: { brandId, assetId, originalFilename: file.name },
  });

  // Create asset record
  const [asset] = await db.insert(schema.assets).values({
    id: assetId,
    brand_id: brandId,
    media_type: mediaType,
    original_filename: file.name,
    storage_key: storageKey,
    file_size_bytes: file.size,
    processing_status: 'uploaded',
  }).returning();

  // Auto-generate content if an LLM provider is available
  const { llm } = await resolveProviders();
  if (llm) {
    try {
      // Create a synthetic fragment (edge can't run FFmpeg, so the whole asset is one "fragment")
      const fragmentId = crypto.randomUUID();
      await db.insert(schema.fragments).values({
        id: fragmentId,
        asset_id: assetId,
        type: mediaType === 'video' ? 'clip' : 'crop',
        storage_key: storageKey,
        quality_score: 1.0,
        extraction_metadata: { source: 'edge-upload', synthetic: true },
      });

      await db.update(schema.assets)
        .set({ processing_status: 'extracted', fragment_count: 1 })
        .where(eq(schema.assets.id, assetId));

      const platforms = ['instagram_feed', 'linkedin', 'x'];
      const toneDesc = brand.tone_description || 'Professional and engaging';

      for (const platform of platforms) {
        const prompt = `Create a social media post for the brand "${brand.name}" on ${platform}.
Brand tone: ${toneDesc}. Asset: "${file.name}".
Return ONLY valid JSON, no markdown: {"caption": "your caption", "hashtags": ["tag1", "tag2"]}`;

        const response = await llm.generate(prompt, { maxTokens: 256 });
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) continue;

        let parsed;
        try { parsed = JSON.parse(jsonMatch[0]); } catch { continue; }

        await db.insert(schema.contentUnits).values({
          id: crypto.randomUUID(),
          fragment_id: fragmentId,
          brand_id: brandId,
          platform,
          caption: parsed.caption || '',
          media_key: storageKey,
          media_type: mediaType,
          hashtags: parsed.hashtags || [],
          nc_score: 0,
          nc_score_breakdown: {},
          approval_status: 'pending',
          similarity_hash: crypto.randomUUID(),
        });
      }
    } catch (err) {
      console.error('Auto-generation failed:', err);
    }
  }

  return c.json(toCamel(asset), 201);
});

// ── Asset List & Get ──────────────────────────────────────────
app.get('/api/v1/brands/:brandId/assets', async (c) => {
  const db = getDb();
  const rows = await db.select().from(schema.assets)
    .where(eq(schema.assets.brand_id, c.req.param('brandId')))
    .orderBy(desc(schema.assets.created_at));
  return c.json(mapRows(rows));
});

app.get('/api/v1/brands/:brandId/assets/:assetId', async (c) => {
  const db = getDb();
  const [asset] = await db.select().from(schema.assets).where(eq(schema.assets.id, c.req.param('assetId')));
  if (!asset) return c.json({ error: 'Asset not found' }, 404);
  return c.json(toCamel(asset));
});

// ── File Serving (R2) ─────────────────────────────────────────
app.get('/files/:key{.+}', async (c) => {
  const key = c.req.param('key');
  const bucket = c.env.ASSETS_BUCKET;
  const object = await bucket.get(key);
  if (!object) return c.json({ error: 'File not found' }, 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000');

  return new Response(object.body, { headers });
});

// ── Content ───────────────────────────────────────────────────
app.get('/api/v1/brands/:brandId/content', async (c) => {
  const db = getDb();
  const rows = await db.select().from(schema.contentUnits)
    .where(eq(schema.contentUnits.brand_id, c.req.param('brandId')))
    .orderBy(desc(schema.contentUnits.created_at));
  return c.json(mapRows(rows));
});

app.post('/api/v1/brands/:brandId/content/:unitId/approve', async (c) => {
  const db = getDb();
  await db.update(schema.contentUnits)
    .set({ approval_status: 'approved' })
    .where(eq(schema.contentUnits.id, c.req.param('unitId')));
  return c.json({ status: 'approved' });
});

app.post('/api/v1/brands/:brandId/content/:unitId/reject', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const db = getDb();
  await db.update(schema.contentUnits)
    .set({ approval_status: 'rejected', flagged_reason: (body as any).reason ?? 'Manual rejection' })
    .where(eq(schema.contentUnits.id, c.req.param('unitId')));
  return c.json({ status: 'rejected' });
});

// ── Natural Center ────────────────────────────────────────────
app.get('/api/v1/brands/:brandId/natural-center', async (c) => {
  const db = getDb();
  const [nc] = await db.select().from(schema.naturalCenters)
    .where(eq(schema.naturalCenters.brand_id, c.req.param('brandId')));
  if (!nc) return c.json({ error: 'No identity profile derived yet' }, 404);
  return c.json(toCamel(nc));
});

// ── Fragments ─────────────────────────────────────────────────
app.get('/api/v1/brands/:brandId/assets/:assetId/fragments', async (c) => {
  const db = getDb();
  const rows = await db.select().from(schema.fragments)
    .where(eq(schema.fragments.asset_id, c.req.param('assetId')));
  return c.json(mapRows(rows));
});

// ── Settings & Providers ──────────────────────────────────────
app.get('/api/v1/settings/providers', async (c) => {
  const providers = await resolveProviders();
  return c.json({
    llm: providers.llm
      ? { name: providers.llm.name, tier: providers.llm.tier, status: 'active' }
      : { name: 'none', status: 'not configured' },
    embedding: providers.embedding
      ? { name: providers.embedding.name, tier: providers.embedding.tier, status: 'active' }
      : { name: 'none', status: 'not configured' },
    transcription: providers.transcription
      ? { name: providers.transcription.name, tier: providers.transcription.tier, status: 'active' }
      : { name: 'none', status: 'not configured' },
    all: {
      llm: providers.allLLMs.map(p => ({ name: p.name, tier: p.tier })),
      embedding: providers.allEmbeddings.map(p => ({ name: p.name, tier: p.tier })),
      transcription: providers.allTranscriptions.map(p => ({ name: p.name, tier: p.tier })),
    },
  });
});

app.get('/api/v1/settings/keys', async (c) => {
  // In production, keys come from Worker secrets (process.env), not filesystem
  const env = process.env;
  return c.json({
    groq_api_key: env.GROQ_API_KEY ? `${env.GROQ_API_KEY.slice(0, 8)}...` : null, // allow-secret
    gemini_api_key: env.GEMINI_API_KEY ? `${env.GEMINI_API_KEY.slice(0, 8)}...` : null, // allow-secret
    cerebras_api_key: env.CEREBRAS_API_KEY ? `${env.CEREBRAS_API_KEY.slice(0, 8)}...` : null, // allow-secret
    anthropic_api_key: env.ANTHROPIC_API_KEY ? `${env.ANTHROPIC_API_KEY.slice(0, 10)}...` : null, // allow-secret
    openai_api_key: env.OPENAI_API_KEY ? `${env.OPENAI_API_KEY.slice(0, 7)}...` : null, // allow-secret
    cloudflare_account_id: env.CLOUDFLARE_ACCOUNT_ID ? `${env.CLOUDFLARE_ACCOUNT_ID.slice(0, 8)}...` : null,
    ollama_host: 'N/A (production — use cloud providers)',
  });
});

app.put('/api/v1/settings/keys', async (c) => {
  // In production, keys must be set as Worker secrets via wrangler CLI:
  // echo "key" | npx wrangler secret put GROQ_API_KEY -c apps/api/wrangler.toml
  return c.json({
    status: 'info',
    message: 'In production, API keys are set as Cloudflare Worker secrets. Use: echo "your-key" | npx wrangler secret put KEY_NAME -c apps/api/wrangler.toml',
    available_keys: ['GROQ_API_KEY', 'GEMINI_API_KEY', 'CEREBRAS_API_KEY', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY'],
  });
});

export default app;
