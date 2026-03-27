import { FastifyPluginAsync } from 'fastify';
import { getDb, schema } from '@cronus/db';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

export const agencyRoutes: FastifyPluginAsync = async (app) => {
  // POST /agencies
  app.post('/agencies', async (request, reply) => {
    const body = request.body as { name: string; website_url?: string };
    const db = getDb();

    const [agency] = await db.insert(schema.agencies).values({
      id: randomUUID(),
      name: body.name,
      website_url: body.website_url,
    }).returning();

    return reply.status(201).send(agency);
  });

  // GET /agencies/:id
  app.get('/agencies/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    const [agency] = await db.select().from(schema.agencies).where(eq(schema.agencies.id, id));
    if (!agency) return reply.status(404).send({ error: 'Agency not found' });

    return agency;
  });

  // GET /agencies/:id/brands
  app.get('/agencies/:id/brands', async (request) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    return db.select().from(schema.brands).where(eq(schema.brands.agencyId, id));
  });
};
