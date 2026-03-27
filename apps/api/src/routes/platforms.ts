import { FastifyPluginAsync } from 'fastify';
import { getDb, schema } from '@cronus/db';
import { eq } from 'drizzle-orm';
import { Platform } from '@cronus/domain';

export const platformRoutes: FastifyPluginAsync = async (app) => {
  // GET /brands/:brandId/platforms
  app.get('/brands/:brandId/platforms', async (request) => {
    const { brandId } = request.params as { brandId: string };
    const db = getDb();

    return db
      .select()
      .from(schema.platformConnections)
      .where(eq(schema.platformConnections.brandId, brandId));
  });

  // GET /brands/:brandId/platforms/connect/:platform
  // Stub for initiating OAuth flow
  app.get('/brands/:brandId/platforms/connect/:platform', async (request, reply) => {
    const { platform } = request.params as { platform: string };
    
    // In a real app, this would redirect to the platform's OAuth page
    // For MVP, we'll just return a mock success
    return {
      message: `OAuth flow for ${platform} initiated. Redirecting...`,
      auth_url: `https://mock-auth.cronus.ai/${platform}?callback=...`
    };
  });
};
