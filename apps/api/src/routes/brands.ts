import { FastifyPluginAsync } from 'fastify';
import { getDb } from '@cronus/db';
import { schema } from '@cronus/db';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Helper to create slug from name
function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const brandRoutes: FastifyPluginAsync = async (app) => {
  // POST /brands
  app.post('/brands', async (request, reply) => {
    const body = request.body as { name: string; description?: string; tone_description?: string; consistency_threshold?: number; agency_id?: string };
    const db = getDb();

    const [brand] = await db.insert(schema.brands).values({
      name: body.name,
      slug: slugify(body.name) + '-' + randomUUID().slice(0, 6),
      description: body.description ?? null,
      toneDescription: body.tone_description ?? null,
      consistencyThreshold: body.consistency_threshold ?? 0.75,
      agencyId: body.agency_id ?? null,
    }).returning();

    reply.status(201).send(brand);
  });

  // GET /brands
  app.get('/brands', async (request) => {
    const db = getDb();
    const { agency_id } = request.query as { agency_id?: string };

    if (agency_id) {
      return db.select().from(schema.brands).where(eq(schema.brands.agencyId, agency_id));
    }
    return db.select().from(schema.brands);
  });

  // GET /brands/:brandId
  app.get('/brands/:brandId', async (request, reply) => {
    const { brandId } = request.params as { brandId: string };
    const db = getDb();

    const [brand] = await db.select().from(schema.brands).where(eq(schema.brands.id, brandId));
    if (!brand) return reply.status(404).send({ error: 'Brand not found' });

    return brand;
  });
};
