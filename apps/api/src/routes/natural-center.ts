import { FastifyPluginAsync } from 'fastify';
import { getDb, schema } from '@cronus/db';
import { eq } from 'drizzle-orm';
import { deriveNaturalCenter, refineNaturalCenter } from '@cronus/natural-center';
import { createLogger } from '@cronus/logger';

const log = createLogger('api:natural-center');

export const naturalCenterRoutes: FastifyPluginAsync = async (app) => {
  // GET /brands/:brandId/natural-center
  app.get('/brands/:brandId/natural-center', async (request, reply) => {
    const { brandId } = request.params as { brandId: string };
    const db = getDb();

    const [nc] = await db
      .select()
      .from(schema.naturalCenters)
      .where(eq(schema.naturalCenters.brand_id, brandId));

    if (!nc) {
      return reply.status(404).send({ error: 'No identity profile derived for this brand yet' });
    }

    return nc;
  });

  // POST /brands/:brandId/natural-center
  // Triggers (re)derivation of brand identity
  app.post('/brands/:brandId/natural-center', async (request, reply) => {
    const { brandId } = request.params as { brandId: string };
    const { asset_ids, tone_description } = request.body as { 
      asset_ids?: string[]; 
      tone_description?: string 
    };

    log.info({ brandId }, 'Triggering NC derivation');

    // For MVP, we run synchronously or in background without full workflow yet
    deriveNaturalCenter({
      brandId,
      assetIds: asset_ids || [],
      toneDescription: tone_description,
    }).catch(err => log.error({ err, brandId }, 'NC derivation background failed'));

    return reply.status(202).send({ 
      status: 'processing',
      message: 'Brand identity derivation started'
    });
  });

  // PATCH /brands/:brandId/natural-center
  // Refines specific dimensions of the profile
  app.patch('/brands/:brandId/natural-center', async (request, reply) => {
    const { brandId } = request.params as { brandId: string };
    const { adjustments } = request.body as { adjustments: Record<string, string> };

    await refineNaturalCenter({ brandId, adjustments });

    return { status: 'refined' };
  });
};
