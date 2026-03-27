import { FastifyPluginAsync } from 'fastify';
import { getDb, schema } from '@cronus/db';
import { eq, and } from 'drizzle-orm';

export const fragmentRoutes: FastifyPluginAsync = async (app) => {
  // GET /brands/:brandId/assets/:assetId/fragments
  app.get('/brands/:brandId/assets/:assetId/fragments', async (request, reply) => {
    const { brandId, assetId } = request.params as { brandId: string; assetId: string };
    const db = getDb();

    // 1. Verify asset belongs to brand
    const [asset] = await db
      .select()
      .from(schema.assets)
      .where(and(eq(schema.assets.id, assetId), eq(schema.assets.brand_id, brandId)));

    if (!asset) {
      return reply.status(404).send({ error: 'Asset not found for this brand' });
    }

    // 2. Fetch fragments
    return db
      .select()
      .from(schema.fragments)
      .where(eq(schema.fragments.asset_id, assetId));
  });
};
