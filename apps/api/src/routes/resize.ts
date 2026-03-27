import { FastifyPluginAsync } from 'fastify';
import { resizeDesignBatch } from '@cronus/design-resizer';
import { createLogger } from '@cronus/logger';

const log = createLogger('api:resize');

export const resizeRoutes: FastifyPluginAsync = async (app) => {
  // POST /brands/:brandId/resize
  app.post('/brands/:brandId/resize', async (request, reply) => {
    const { brandId } = request.params as { brandId: string };
    
    // 1. Parse multipart
    const parts = await request.parts();
    let buffer: Buffer | undefined;
    let targetFormatIds: string[] = [];
    let filename = 'design.png';

    for await (const part of parts) {
      if (part.type === 'file') {
        buffer = await part.toBuffer();
        filename = part.filename;
      } else {
        if (part.fieldname === 'target_formats') {
          // If it's a comma-separated string or multiple fields
          const val = (part as any).value;
          targetFormatIds = Array.isArray(val) ? val : val.split(',');
        }
      }
    }

    if (!buffer) {
      return reply.status(400).send({ error: 'No design file uploaded' });
    }

    log.info({ brandId, formats: targetFormatIds }, 'Received resize request');

    // 2. Start batch processing
    // For MVP we do it synchronously to return the result, 
    // but in production this should be a background job.
    const results = await resizeDesignBatch({
      brandId,
      buffer,
      originalFilename: filename,
      targetFormatIds,
    });

    return reply.status(202).send({
      message: 'Resizing complete',
      results,
    });
  });
};
