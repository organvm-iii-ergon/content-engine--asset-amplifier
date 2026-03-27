/**
 * Cloudflare Worker — Cronus Metabolus API
 * Uses Hono (Worker-native) instead of Fastify for edge deployment.
 * Same database, same services, same logic — different HTTP layer.
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getDb, schema, toCamel, mapRows, eq } from '@cronus/db';
import { resolveProviders } from '@cronus/config';

type Env = { Bindings: Record<string, string> };
const app = new Hono<Env>();

// Inject env vars on every request
app.use('*', async (c, next) => {
  for (const [key, value] of Object.entries(c.env)) {
    if (typeof value === 'string') process.env[key] = value;
  }
  await next();
});

app.use('*', cors());

// Health
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Brands CRUD
app.get('/api/v1/brands', async (c) => {
  const db = getDb();
  const rows = await db.select().from(schema.brands);
  return c.json(mapRows(rows));
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

// Content (read-only for now — generation happens locally)
app.get('/api/v1/brands/:brandId/content', async (c) => {
  const db = getDb();
  const rows = await db.select().from(schema.contentUnits).where(eq(schema.contentUnits.brand_id, c.req.param('brandId')));
  return c.json(mapRows(rows));
});

// Natural Center
app.get('/api/v1/brands/:brandId/natural-center', async (c) => {
  const db = getDb();
  const [nc] = await db.select().from(schema.naturalCenters).where(eq(schema.naturalCenters.brand_id, c.req.param('brandId')));
  if (!nc) return c.json({ error: 'No identity profile derived yet' }, 404);
  return c.json(toCamel(nc));
});

// Providers status
app.get('/api/v1/settings/providers', async (c) => {
  const providers = await resolveProviders();
  return c.json({
    llm: providers.llm ? { name: providers.llm.name, status: 'active' } : { name: 'none', status: 'not configured' },
    embedding: providers.embedding ? { name: providers.embedding.name, status: 'active' } : { name: 'none', status: 'not configured' },
    transcription: providers.transcription ? { name: providers.transcription.name, status: 'active' } : { name: 'none', status: 'not configured' },
  });
});

// Fragments
app.get('/api/v1/brands/:brandId/assets/:assetId/fragments', async (c) => {
  const db = getDb();
  const rows = await db.select().from(schema.fragments).where(eq(schema.fragments.asset_id, c.req.param('assetId')));
  return c.json(mapRows(rows));
});

// Assets
app.get('/api/v1/brands/:brandId/assets', async (c) => {
  const db = getDb();
  const rows = await db.select().from(schema.assets).where(eq(schema.assets.brand_id, c.req.param('brandId')));
  return c.json(mapRows(rows));
});

export default app;
