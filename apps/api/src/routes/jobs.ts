import { FastifyPluginAsync } from 'fastify';
import { Queue, getRedisConnection } from '@cronus/queue';

export const jobRoutes: FastifyPluginAsync = async (app) => {
  // GET /jobs/:jobId
  app.get('/jobs/:jobId', async (request, reply) => {
    const { jobId } = request.params as { jobId: string };

    // Search across all queues for the job
    const queueNames = ['asset.process', 'nc.derive', 'content.generate', 'publish.execute', 'analytics.collect', 'design.resize'];

    for (const name of queueNames) {
      const queue = new Queue(name, { connection: getRedisConnection() });
      const job = await queue.getJob(jobId);
      if (job) {
        const state = await job.getState();
        return {
          id: job.id,
          type: name,
          status: state === 'completed' ? 'completed' : state === 'failed' ? 'failed' : state === 'active' ? 'processing' : 'queued',
          progress: typeof job.progress === 'number' ? job.progress : 0,
          result: job.returnvalue ?? null,
          error: job.failedReason ?? null,
          created_at: new Date(job.timestamp).toISOString(),
        };
      }
      await queue.close();
    }

    reply.status(404).send({ error: 'Job not found' });
  });
};
