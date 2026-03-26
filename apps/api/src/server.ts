import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { createLogger } from '@cronus/logger';
import { brandRoutes } from './routes/brands.js';
import { jobRoutes } from './routes/jobs.js';

const log = createLogger('api');

export async function buildApp() {
  const app = Fastify({ logger: false }); // we use our own logger

  await app.register(cors, { origin: true });
  await app.register(multipart, { limits: { fileSize: 2 * 1024 * 1024 * 1024 } });

  // Error handler
  app.setErrorHandler((error, request, reply) => {
    log.error({ err: error, url: request.url }, 'Request error');
    reply.status(error.statusCode ?? 500).send({
      error: error.message,
      statusCode: error.statusCode ?? 500,
    });
  });

  // Request logging
  app.addHook('onResponse', (request, reply, done) => {
    log.info({ method: request.method, url: request.url, status: reply.statusCode, ms: reply.elapsedTime?.toFixed(1) }, 'request');
    done();
  });

  // Routes
  await app.register(brandRoutes, { prefix: '/api/v1' });
  await app.register(jobRoutes, { prefix: '/api/v1' });

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  return app;
}

async function start() {
  const app = await buildApp();
  const port = Number(process.env.API_PORT ?? 3000);
  const host = process.env.API_HOST ?? '0.0.0.0';

  await app.listen({ port, host });
  log.info(`API listening on ${host}:${port}`);

  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.on(signal, async () => {
      log.info(`${signal} received, shutting down`);
      await app.close();
      process.exit(0);
    });
  }
}

start().catch((err) => {
  console.error('Failed to start API:', err);
  process.exit(1);
});
