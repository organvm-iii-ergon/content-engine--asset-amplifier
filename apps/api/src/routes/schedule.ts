import { FastifyPluginAsync } from 'fastify';
import { getDb, schema } from '@cronus/db';
import { eq, and, gte, lte } from 'drizzle-orm';
import { scheduleContent } from '@cronus/scheduler';
import { ScheduleStrategy } from '@cronus/domain';

export const scheduleRoutes: FastifyPluginAsync = async (app) => {
  // POST /brands/:brandId/schedule
  app.post('/brands/:brandId/schedule', async (request, reply) => {
    const { brandId } = request.params as { brandId: string };
    const { content_unit_ids, strategy, start_date, end_date } = request.body as {
      content_unit_ids: string[];
      strategy?: ScheduleStrategy;
      start_date?: string;
      end_date?: string;
    };

    try {
      const publishEvents = await scheduleContent({
        brandId,
        contentUnitIds: content_unit_ids,
        strategy: strategy || ScheduleStrategy.optimal,
        startDate: start_date ? new Date(start_date) : new Date(),
        endDate: end_date ? new Date(end_date) : undefined,
      });

      return reply.status(201).send({
        scheduled_count: publishEvents.length,
        publish_events: publishEvents,
      });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // GET /brands/:brandId/calendar
  app.get('/brands/:brandId/calendar', async (request) => {
    const { brandId } = request.params as { brandId: string };
    const { start_date, end_date } = request.query as { start_date?: string; end_date?: string };
    const db = getDb();

    // Joining publishEvents with contentUnits to show what's scheduled
    const conditions = []; // We need a better way to filter by brandId via relationship
    
    // Simplification for MVP: filter by dates if provided
    let query = db.select().from(schema.publishEvents);
    
    if (start_date) {
      // @ts-ignore
      conditions.push(gte(schema.publishEvents.scheduled_at, new Date(start_date)));
    }
    if (end_date) {
      // @ts-ignore
      conditions.push(lte(schema.publishEvents.scheduled_at, new Date(end_date)));
    }

    return conditions.length > 0 
      ? db.select().from(schema.publishEvents).where(and(...conditions))
      : db.select().from(schema.publishEvents);
  });
};
