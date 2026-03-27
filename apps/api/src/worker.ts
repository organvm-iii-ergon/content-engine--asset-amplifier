/**
 * Cloudflare Worker — Cronus Metabolus API
 * Hono + Neon PostgreSQL + Cloudflare R2 storage
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getDb, schema, toCamel, mapRows, eq, desc } from '@cronus/db';
import { resolveProviders } from '@cronus/config';

type Bindings = {
  ASSETS_BUCKET: R2Bucket;
  [key: string]: unknown;
};

const app = new Hono<{ Bindings: Bindings }>();

// Inject env vars on every request
app.use('*', async (c, next) => {
  for (const [key, value] of Object.entries(c.env)) {
    if (typeof value === 'string') process.env[key] = value;
  }
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

// ── Asset Upload (R2) ─────────────────────────────────────────
app.post('/api/v1/brands/:brandId/assets', async (c) => {
  const brandId = c.req.param('brandId');
  const db = getDb();

  // Verify brand exists
  const [brand] = await db.select().from(schema.brands).where(eq(schema.brands.id, brandId));
  if (!brand) return c.json({ error: 'Brand not found' }, 404);

  // Parse multipart form data
  const formData = await c.req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return c.json({ error: 'No file uploaded' }, 400);

  const assetId = crypto.randomUUID();
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';

  // Validate file type
  const allowedExts = ['mp4', 'mov', 'png', 'jpg', 'jpeg', 'tiff', 'tif'];
  if (!allowedExts.includes(ext)) {
    return c.json({ error: `Unsupported file type: .${ext}` }, 400);
  }

  const mediaType = ['mp4', 'mov'].includes(ext) ? 'video' : 'image';
  const storageKey = `brands/${brandId}/assets/${assetId}.${ext}`;

  // Upload to R2
  const bucket = c.env.ASSETS_BUCKET;
  await bucket.put(storageKey, file.stream(), {
    httpMetadata: { contentType: file.type },
    customMetadata: { brandId, assetId, originalFilename: file.name },
  });

  // Create asset record in DB
  const [asset] = await db.insert(schema.assets).values({
    id: assetId,
    brand_id: brandId,
    media_type: mediaType,
    original_filename: file.name,
    storage_key: storageKey,
    file_size_bytes: file.size,
    processing_status: 'uploaded',
  }).returning();

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

// ── Providers Status ──────────────────────────────────────────
app.get('/api/v1/settings/providers', async (c) => {
  const providers = await resolveProviders();
  return c.json({
    llm: providers.llm ? { name: providers.llm.name, status: 'active' } : { name: 'none', status: 'not configured' },
    embedding: providers.embedding ? { name: providers.embedding.name, status: 'active' } : { name: 'none', status: 'not configured' },
    transcription: providers.transcription ? { name: providers.transcription.name, status: 'active' } : { name: 'none', status: 'not configured' },
  });
});

export default app;
