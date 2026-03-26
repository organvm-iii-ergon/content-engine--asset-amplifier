import { FastifyPluginAsync } from 'fastify';

export const authPlugin: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', async (request, reply) => {
    // Skip auth for health check
    if (request.url === '/health') return;

    const apiKey = request.headers['x-api-key'] ?? request.headers.authorization?.replace('Bearer ', ''); // allow-secret
    const expectedKey = process.env.API_KEY;

    if (!expectedKey || apiKey !== expectedKey) {
      reply.status(401).send({ error: 'Unauthorized', statusCode: 401 });
    }
  });
};
