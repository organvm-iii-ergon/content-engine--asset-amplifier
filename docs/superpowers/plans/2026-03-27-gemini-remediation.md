# Gemini Session Remediation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 6 critical bugs, 13 important issues, and 3 architectural problems introduced by the Gemini session (commits `4b66856` through `3f91a36`) while preserving the working file structure and 80%+ of implementation logic.

**Architecture:** The DB schema is 100% snake_case (correct). The domain types are 100% camelCase (correct). The bridge between them — a `mapRow` utility — does not exist. Most bugs stem from this gap. The fix adds a thin mapping layer in `packages/db/src/mappers.ts`, fixes specific broken queries, patches the 5 non-mapping critical bugs, and wires auth.

**Tech Stack:** TypeScript, Drizzle ORM (postgres-js), Fastify, BullMQ, Temporal, Sharp, FFmpeg

---

## Task 1: Add DB Row ↔ Domain Type Mappers

The systemic fix. Every Drizzle query returns snake_case rows. Every API response and service function should work with camelCase domain types. This task creates the bridge.

**Files:**
- Create: `packages/db/src/mappers.ts`
- Modify: `packages/db/src/index.ts`

- [ ] **Step 1: Create the mapper utility**

```typescript
// packages/db/src/mappers.ts

/**
 * Converts a snake_case DB row to a camelCase domain object.
 * Works generically — no per-entity mapping needed.
 */
export function toCamel<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

/**
 * Converts a camelCase domain object to snake_case for DB operations.
 */
export function toSnake<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
}

/**
 * Maps an array of DB rows to camelCase domain objects.
 */
export function mapRows<T extends Record<string, unknown>>(rows: T[]): Record<string, unknown>[] {
  return rows.map(toCamel);
}
```

- [ ] **Step 2: Export from barrel**

Add to `packages/db/src/index.ts`:
```typescript
export { toCamel, toSnake, mapRows } from './mappers.js';
```

- [ ] **Step 3: Verify mappers work**

```bash
cd packages/db && npx tsx -e "
  const { toCamel, toSnake } = require('./src/mappers.ts');
  console.log(toCamel({ brand_id: '123', tone_description: 'warm' }));
  // { brandId: '123', toneDescription: 'warm' }
  console.log(toSnake({ brandId: '123', toneDescription: 'warm' }));
  // { brand_id: '123', tone_description: 'warm' }
"
```

- [ ] **Step 4: Commit**

```bash
git add packages/db/src/mappers.ts packages/db/src/index.ts
git commit -m "feat: add snake_case ↔ camelCase DB row mappers"
```

---

## Task 2: Fix API Routes — Brand CRUD (C01 partial)

The brands route uses camelCase property names in `.values()` and `.where()` that don't match the snake_case schema.

**Files:**
- Modify: `apps/api/src/routes/brands.ts`

- [ ] **Step 1: Read current file and identify all snake_case violations**

The route has these problems:
- `.values({ toneDescription, consistencyThreshold, agencyId })` — should be `tone_description`, `consistency_threshold`, `agency_id`
- `eq(schema.brands.agencyId, ...)` — should be `eq(schema.brands.agency_id, ...)`
- Response should map rows to camelCase for API consumers

- [ ] **Step 2: Rewrite brands.ts with correct column names and response mapping**

```typescript
// apps/api/src/routes/brands.ts
import { FastifyPluginAsync } from 'fastify';
import { getDb, schema, toCamel, mapRows } from '@cronus/db';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const brandRoutes: FastifyPluginAsync = async (app) => {
  app.post('/brands', async (request, reply) => {
    const body = request.body as {
      name: string;
      description?: string;
      tone_description?: string;
      consistency_threshold?: number;
      agency_id?: string;
    };
    const db = getDb();

    const [brand] = await db.insert(schema.brands).values({
      name: body.name,
      slug: slugify(body.name) + '-' + randomUUID().slice(0, 6),
      description: body.description ?? null,
      tone_description: body.tone_description ?? null,
      consistency_threshold: body.consistency_threshold ?? 0.75,
      agency_id: body.agency_id ?? null,
    }).returning();

    reply.status(201).send(toCamel(brand));
  });

  app.get('/brands', async (request) => {
    const db = getDb();
    const { agency_id } = request.query as { agency_id?: string };

    const rows = agency_id
      ? await db.select().from(schema.brands).where(eq(schema.brands.agency_id, agency_id))
      : await db.select().from(schema.brands);

    return mapRows(rows);
  });

  app.get('/brands/:brandId', async (request, reply) => {
    const { brandId } = request.params as { brandId: string };
    const db = getDb();

    const [brand] = await db.select().from(schema.brands).where(eq(schema.brands.id, brandId));
    if (!brand) return reply.status(404).send({ error: 'Brand not found' });

    return toCamel(brand);
  });
};
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/routes/brands.ts
git commit -m "fix(C01): brands route — snake_case columns + camelCase responses"
```

---

## Task 3: Fix API Routes — Agencies (C01 partial)

**Files:**
- Modify: `apps/api/src/routes/agencies.ts`

- [ ] **Step 1: Fix agencies route**

The route references `website_url` (doesn't exist in schema) and uses `agencyId` (should be `agency_id`).

```typescript
// apps/api/src/routes/agencies.ts
import { FastifyPluginAsync } from 'fastify';
import { getDb, schema, toCamel, mapRows } from '@cronus/db';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const agencyRoutes: FastifyPluginAsync = async (app) => {
  app.post('/agencies', async (request, reply) => {
    const body = request.body as { name: string; contact_email: string; logo_url?: string; primary_color?: string };
    const db = getDb();

    const [agency] = await db.insert(schema.agencies).values({
      name: body.name,
      slug: slugify(body.name) + '-' + randomUUID().slice(0, 6),
      contact_email: body.contact_email,
      logo_url: body.logo_url ?? null,
      primary_color: body.primary_color ?? null,
    }).returning();

    reply.status(201).send(toCamel(agency));
  });

  app.get('/agencies/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    const [agency] = await db.select().from(schema.agencies).where(eq(schema.agencies.id, id));
    if (!agency) return reply.status(404).send({ error: 'Agency not found' });

    return toCamel(agency);
  });

  app.get('/agencies/:id/brands', async (request) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    return mapRows(await db.select().from(schema.brands).where(eq(schema.brands.agency_id, id)));
  });
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/routes/agencies.ts
git commit -m "fix(C01): agencies route — correct schema columns, remove nonexistent website_url"
```

---

## Task 4: Fix LinkedIn OAuth Callback (C01, C05)

**Files:**
- Modify: `apps/api/src/routes/platforms.ts`

- [ ] **Step 1: Fix platforms route**

Critical issues: camelCase column names (`brandId`, `accessToken`), missing NOT NULL fields (`platform_account_id`, `scopes`), and no `brandId` filter on listing.

```typescript
// apps/api/src/routes/platforms.ts
import { FastifyPluginAsync } from 'fastify';
import { getDb, schema, toCamel, mapRows } from '@cronus/db';
import { eq } from 'drizzle-orm';
import { Platform } from '@cronus/domain';
import { getConfig, encrypt } from '@cronus/config';
import axios from 'axios'; // allow-secret
import { randomUUID } from 'node:crypto';
import { createLogger } from '@cronus/logger';

const log = createLogger('api:platforms');

export const platformRoutes: FastifyPluginAsync = async (app) => {
  app.get('/brands/:brandId/platforms', async (request) => {
    const { brandId } = request.params as { brandId: string };
    const db = getDb();

    return mapRows(
      await db.select().from(schema.platformConnections).where(eq(schema.platformConnections.brand_id, brandId))
    );
  });

  app.get('/brands/:brandId/platforms/connect/:platform', async (request, reply) => {
    const { brandId, platform } = request.params as { brandId: string; platform: string };
    const config = getConfig();

    if (platform === 'linkedin') {
      const clientId = config.LINKEDIN_CLIENT_ID;
      if (!clientId) return reply.status(400).send({ error: 'LinkedIn OAuth not configured' });

      const redirectUri = `${process.env.API_URL || 'http://localhost:3000'}/api/v1/platforms/callback/linkedin`;
      const scope = encodeURIComponent('w_member_social r_liteprofile');
      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${brandId}`;

      return reply.redirect(authUrl);
    }

    return reply.status(400).send({ error: `OAuth not implemented for ${platform}` });
  });

  app.get('/platforms/callback/linkedin', async (request, reply) => {
    const { code, state: brandId } = request.query as { code: string; state: string };
    const config = getConfig();
    const db = getDb();

    try {
      const redirectUri = `${process.env.API_URL || 'http://localhost:3000'}/api/v1/platforms/callback/linkedin`;
      const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, { // allow-secret
        params: {
          grant_type: 'authorization_code',
          code,
          client_id: config.LINKEDIN_CLIENT_ID,
          client_secret: config.LINKEDIN_CLIENT_SECRET, // allow-secret
          redirect_uri: redirectUri,
        },
      });

      const { access_token } = response.data; // allow-secret
      const encryptedToken = encrypt(access_token); // allow-secret

      await db.insert(schema.platformConnections).values({
        id: randomUUID(),
        brand_id: brandId,
        platform: 'linkedin',
        platform_account_id: 'linkedin-user', // TODO: fetch from /v2/me endpoint
        platform_account_name: null,
        access_token: encryptedToken, // allow-secret
        scopes: ['w_member_social', 'r_liteprofile'],
        status: 'active',
      });

      const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:5173';
      return reply.redirect(`${dashboardUrl}/platforms?status=success`);
    } catch (err: any) {
      log.error({ err }, 'LinkedIn OAuth callback failed');
      const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:5173';
      return reply.redirect(`${dashboardUrl}/platforms?status=error`);
    }
  });
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/routes/platforms.ts
git commit -m "fix(C01,C05): platforms route — snake_case columns, add required NOT NULL fields"
```

---

## Task 5: Fix Crypto Key Length (C03)

**Files:**
- Modify: `packages/config/src/crypto.ts`

- [ ] **Step 1: Fix AES-256 key to exactly 32 bytes**

```typescript
// packages/config/src/crypto.ts
import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY; // allow-secret
  if (raw) {
    // Hash to exactly 32 bytes regardless of input length
    return crypto.createHash('sha256').update(raw).digest();
  }
  // Development fallback — NOT for production
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ENCRYPTION_KEY must be set in production');
  }
  return crypto.createHash('sha256').update('cronus-dev-key').digest(); // allow-secret
}

export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  const key = getEncryptionKey();
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/config/src/crypto.ts
git commit -m "fix(C03): AES-256 key — hash to 32 bytes, fail in production without env var"
```

---

## Task 6: Fix Analytics — Missing `engagement` Column (C04)

The `performance_observations` table has individual metric columns (`likes`, `comments`, `shares`, `saves`) but no aggregate `engagement` column. Three files reference it.

**Files:**
- Modify: `services/analytics/src/collector.ts`
- Modify: `services/analytics/src/attribution.ts`
- Modify: `services/analytics/src/report.ts`

- [ ] **Step 1: Fix collector to use individual columns**

In `collector.ts`, replace `engagement: metrics.engagement` with individual metric fields:

```typescript
// In the insert, replace:
//   engagement: metrics.engagement,
// With:
likes: metrics.raw?.likes ?? 0,
comments: metrics.raw?.comments ?? 0,
shares: metrics.raw?.shares ?? 0,
saves: metrics.raw?.saves ?? 0,
clicks: metrics.raw?.clicks ?? 0,
```

- [ ] **Step 2: Fix attribution to compute engagement from sum of columns**

In `attribution.ts`, replace:
```typescript
total_engagement: sql<number>`sum(${schema.performanceObservations.engagement})`,
```
With:
```typescript
total_engagement: sql<number>`sum(${schema.performanceObservations.likes} + ${schema.performanceObservations.comments} + ${schema.performanceObservations.shares} + ${schema.performanceObservations.saves})`,
```

- [ ] **Step 3: Fix report.ts with same pattern**

Same replacement in `report.ts`.

- [ ] **Step 4: Commit**

```bash
git add services/analytics/src/collector.ts services/analytics/src/attribution.ts services/analytics/src/report.ts
git commit -m "fix(C04): analytics — compute engagement from individual metric columns"
```

---

## Task 7: Fix Calendar Brand Filter (C06)

**Files:**
- Modify: `apps/api/src/routes/schedule.ts`

- [ ] **Step 1: Add brandId filter to calendar query**

The calendar endpoint must join through content_units to filter by brand. Replace the current query with:

```typescript
app.get('/brands/:brandId/calendar', async (request) => {
  const { brandId } = request.params as { brandId: string };
  const { start_date, end_date } = request.query as { start_date?: string; end_date?: string };
  const db = getDb();

  const conditions: SQL[] = [eq(schema.contentUnits.brand_id, brandId)];
  if (start_date) conditions.push(gte(schema.publishEvents.scheduled_at, new Date(start_date)));
  if (end_date) conditions.push(lte(schema.publishEvents.scheduled_at, new Date(end_date)));

  const rows = await db
    .select()
    .from(schema.publishEvents)
    .innerJoin(schema.contentUnits, eq(schema.publishEvents.content_unit_id, schema.contentUnits.id))
    .where(and(...conditions));

  return mapRows(rows.map(r => r.publish_events));
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/routes/schedule.ts
git commit -m "fix(C06): calendar endpoint — filter by brandId via content_units join"
```

---

## Task 8: Fix Content Activities Query (C02)

**Files:**
- Modify: `infra/temporal/activities/content-activities.ts`

- [ ] **Step 1: Fix the query that uses fragment_id = assetId**

Replace the broken query with one that fetches content units by brand_id for the asset's fragments:

```typescript
export async function generateContent(params: {
  brandId: string;
  assetId: string;
  platforms: Platform[];
}): Promise<string[]> {
  await generateAssetContent(params);

  const db = getDb();

  // Get all content units generated from this asset's fragments
  const units = await db
    .select({ id: schema.contentUnits.id })
    .from(schema.contentUnits)
    .innerJoin(schema.fragments, eq(schema.contentUnits.fragment_id, schema.fragments.id))
    .where(eq(schema.fragments.asset_id, params.assetId));

  return units.map(u => u.id);
}
```

- [ ] **Step 2: Commit**

```bash
git add infra/temporal/activities/content-activities.ts
git commit -m "fix(C02): content activities — query units by asset's fragments, not fragment_id=assetId"
```

---

## Task 9: Fix Remaining Service Files (C01 remainder, I03, I05, I07, I10, I13)

Batch fix for the remaining snake_case/camelCase issues and important bugs across services.

**Files:**
- Modify: `services/scoring/src/index.ts` — fix `brandId`→`brand_id`, `consistencyThreshold`→`consistency_threshold`
- Modify: `services/content-generation/src/index.ts` — fix NC property access (`systemPrompt`→`system_prompt`), add JSON parse error handling (I05)
- Modify: `services/natural-center/src/derive.ts` — add JSON parse error handling (I05)
- Modify: `services/natural-center/src/inquiry.ts` — add JSON parse error handling (I05)
- Modify: `services/scheduler/src/index.ts` — add `brand_id` filter to platform connection lookup (I03)
- Modify: `services/analytics/src/collector.ts` — add `brand_id` filter (I13)

- [ ] **Step 1: Fix scoring service**

In `scoring/src/index.ts`:
- Line 41: `eq(schema.naturalCenters.brandId, brandId)` → `eq(schema.naturalCenters.brand_id, brandId)`
- Line 66: `brand.consistencyThreshold` → `brand.consistency_threshold`

- [ ] **Step 2: Fix content generation NC access**

In `content-generation/src/index.ts`:
- Line 36: `eq(schema.naturalCenters.brandId, brandId)` → `eq(schema.naturalCenters.brand_id, brandId)`
- Lines 53-55: `brand.description` → correct (already snake_case), but `brand.toneDescription` → `brand.tone_description`, `nc?.systemPrompt` → `nc?.system_prompt`
- Line 73: Wrap `JSON.parse` in try/catch:
```typescript
let aiOutput;
try {
  const responseText = (message.content[0] as { type: string; text: string }).text;
  aiOutput = JSON.parse(responseText);
} catch {
  log.warn({ fragmentId: fragment.id, platform }, 'Failed to parse AI response, skipping');
  continue;
}
```

- [ ] **Step 3: Fix NC derive JSON parsing**

In `natural-center/src/derive.ts` line 82, wrap in try/catch with fallback.

- [ ] **Step 4: Fix NC inquiry JSON parsing**

In `natural-center/src/inquiry.ts` line 44, wrap in try/catch.

- [ ] **Step 5: Fix scheduler brand filter**

In `scheduler/src/index.ts` line 57, add `brand_id` filter:
```typescript
.where(and(
  eq(schema.platformConnections.platform, unit.platform),
  eq(schema.platformConnections.brand_id, brandId)
))
```

- [ ] **Step 6: Fix analytics collector brand filter**

In `collector.ts`, join through content_units to filter by brandId.

- [ ] **Step 7: Commit**

```bash
git add services/scoring services/content-generation services/natural-center services/scheduler services/analytics
git commit -m "fix(C01,I03,I05,I13): service files — snake_case, brand filters, JSON parse safety"
```

---

## Task 10: Fix Remaining API Routes (I09, I10, I11)

Fix API response shapes to match the OpenAPI contract.

**Files:**
- Modify: `apps/api/src/routes/content.ts` — return `job_id` from generate endpoint (I09)
- Modify: `apps/api/src/routes/natural-center.ts` — return `job_id` from derive endpoint (I10), fix `brand_id` column names
- Modify: `apps/api/src/routes/analytics.ts` — add `toCamel`/`mapRows` to responses
- Modify: `apps/api/src/routes/resize.ts` — return `job_id` per contract (I11)
- Modify: `apps/api/src/routes/fragments.ts` — add `mapRows` to response

- [ ] **Step 1: Fix each route file with correct column names and response shapes**

For content.ts generate endpoint, return `{ job_id: randomUUID(), estimated_count: fragmentCount * platforms.length }` and dispatch via BullMQ queue.

For natural-center.ts, use `schema.naturalCenters.brand_id` (not `brandId`).

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/routes/
git commit -m "fix(I09,I10,I11): API routes — correct response shapes per OpenAPI contract"
```

---

## Task 11: Wire Auth Plugin (S04)

**Files:**
- Modify: `apps/api/src/server.ts`

- [ ] **Step 1: Register the auth plugin that already exists**

The auth plugin exists at `apps/api/src/plugins/auth.ts` but is never registered. Add:

```typescript
import { authPlugin } from './plugins/auth.js';
// ... after CORS registration:
await app.register(authPlugin);
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/server.ts
git commit -m "fix(S04): wire auth plugin — API key validation on all routes"
```

---

## Task 12: Fix Instagram Adapter Registration (I01)

**Files:**
- Modify: `services/platform-adapter/src/adapters/instagram.ts`
- Modify: `services/platform-adapter/src/index.ts`

- [ ] **Step 1: Register Instagram adapter for all three sub-platforms**

Create three instances or one adapter that handles all three Instagram types:

```typescript
// In instagram.ts, change to accept platform in constructor:
export class InstagramAdapter implements PlatformAdapter {
  constructor(public platform: Platform) {}
  // ... rest stays the same
}

// In index.ts, register three:
registerAdapter(new InstagramAdapter(Platform.instagram_feed));
registerAdapter(new InstagramAdapter(Platform.instagram_story));
registerAdapter(new InstagramAdapter(Platform.instagram_reels));
```

- [ ] **Step 2: Commit**

```bash
git add services/platform-adapter/
git commit -m "fix(I01): register Instagram adapter for feed, story, and reels"
```

---

## Task 13: Cleanup Artifacts and Update Domain Types (I07, I08)

**Files:**
- Delete: `update_irf.py` (repo root)
- Delete: `update_concordance.py` (repo root)
- Modify: `packages/domain/src/index.ts` — fix NaturalCenter type fields to match jsonb reality, add missing PlatformConnection fields

- [ ] **Step 1: Delete Gemini cleanup scripts**

```bash
rm -f update_irf.py update_concordance.py
```

- [ ] **Step 2: Fix domain types**

In `packages/domain/src/index.ts`:
- Change `aestheticSignature: string` → `aestheticSignature: Record<string, unknown> | string` (it's jsonb)
- Change `tonalVector: string` → `tonalVector: Record<string, unknown> | string`
- Same for `narrativeBias`, `symbolicMarkers`, `negativeSpace`
- Add `accessToken`, `refreshToken`, `tokenExpiresAt` to PlatformConnection

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "fix(I07,I08): domain types — match DB jsonb reality, add PlatformConnection token fields, remove cleanup scripts"
```

---

## Task 14: Add .env.example ENCRYPTION_KEY and DASHBOARD_URL

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Add missing env vars**

Add after the AI section:
```
# Security
ENCRYPTION_KEY=your-encryption-key-here

# Dashboard
DASHBOARD_URL=http://localhost:5173
API_URL=http://localhost:3000
```

- [ ] **Step 2: Add to config schema**

In `packages/config/src/index.ts`, add:
```typescript
ENCRYPTION_KEY: z.string().optional(),
DASHBOARD_URL: z.string().url().default('http://localhost:5173'),
API_URL: z.string().url().default('http://localhost:3000'),
```

- [ ] **Step 3: Commit**

```bash
git add .env.example packages/config/src/index.ts
git commit -m "fix: add ENCRYPTION_KEY, DASHBOARD_URL, API_URL to env config"
```

---

## Task 15: Final Verification and Push

- [ ] **Step 1: Verify no camelCase column access remains**

```bash
grep -rn 'schema\.\w\+\.\(brandId\|agencyId\|toneDescription\|consistencyThreshold\|systemPrompt\|brandEmbedding\)' services/ apps/ infra/ --include='*.ts'
```

Expected: zero matches.

- [ ] **Step 2: Verify no references to nonexistent columns**

```bash
grep -rn '\.engagement[^_]' services/ apps/ --include='*.ts' | grep -v 'engagement_rate'
```

Expected: zero matches for raw `engagement` column access.

- [ ] **Step 3: Check for remaining cleanup artifacts**

```bash
ls *.py 2>/dev/null
```

Expected: no Python files in repo root.

- [ ] **Step 4: Push all fixes**

```bash
git push origin main
```

---

## Issue Coverage Matrix

| Issue | Task | Status |
|-------|------|--------|
| C01: camelCase/snake_case mismatch | Tasks 2-4, 9-10 | Fixed across all files |
| C02: fragment_id = assetId | Task 8 | Fixed |
| C03: AES-256 key length | Task 5 | Fixed |
| C04: nonexistent `engagement` column | Task 6 | Fixed |
| C05: LinkedIn OAuth missing NOT NULL fields | Task 4 | Fixed |
| C06: Calendar no brand filter | Task 7 | Fixed |
| I01: Instagram adapter reels-only | Task 12 | Fixed |
| I03: Scheduler no brand filter | Task 9 | Fixed |
| I05: JSON parse no error handling | Task 9 | Fixed |
| I07: NC domain type mismatch | Task 13 | Fixed |
| I08: PlatformConnection missing fields | Task 13 | Fixed |
| I09: Generate endpoint wrong response | Task 10 | Fixed |
| I10: NC derive wrong response | Task 10 | Fixed |
| I11: Resize sync vs async | Task 10 | Fixed |
| I13: Collector no brand filter | Task 9 | Fixed |
| S04: Auth not wired | Task 11 | Fixed |
| A02: No mapping layer | Task 1 | Fixed |
| Cleanup artifacts | Task 13 | Fixed |

## Deferred (not in this plan)

| Issue | Why Deferred |
|-------|-------------|
| A01: BullMQ vs Temporal integration | Requires architectural decision — separate plan |
| A03: brand_embedding as text vs vector(1536) | Requires migration + pgvector integration — separate plan |
| I02: Platform type string validation | Low risk, cosmetic |
| I04: generateAssetContent return type | Partially fixed by C02 fix |
| I06: ProcessingStatus string literal | Works at runtime, TypeScript-only |
| I12: Dedup uses prefix matching | Requires semantic hashing — future feature |
| S02-S03: Hardcoded timestamps, missing media types | Future feature work |
| S05: Queue connection leak in jobs route | Low frequency, fix in optimization pass |
| S06: ReviewQueue snake_case response | Fixed by Task 1 (mappers) |
| S12: CORS wide open | Fix in production hardening |
| S13: Buffer-based upload for 2GB files | Fix in streaming upload pass |
