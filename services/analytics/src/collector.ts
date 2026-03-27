import { getDb, schema } from '@cronus/db';
import { eq, and, inArray } from 'drizzle-orm';
import { PublishStatus } from '@cronus/domain';
import { getAdapter } from '@cronus/platform-adapter';
import { createLogger } from '@cronus/logger';
import { randomUUID } from 'node:crypto';

const log = createLogger('analytics:collector');

/**
 * Collects metrics for all published posts of a brand.
 */
export async function collectMetrics(brandId: string) {
  const db = getDb();

  log.info({ brandId }, 'Collecting metrics for brand');

  // 1. Find all published events for this brand
  // Note: We'd ideally join with brand_id through content units
  const events = await db
    .select()
    .from(schema.publishEvents)
    .where(eq(schema.publishEvents.status, PublishStatus.published));

  if (events.length === 0) return;

  for (const event of events) {
    try {
      if (!event.platform_post_id) continue;

      // 2. Get connection and adapter
      const [connection] = await db
        .select()
        .from(schema.platformConnections)
        .where(eq(schema.platformConnections.id, event.platform_connection_id));

      if (!connection) continue;

      const adapter = getAdapter(connection.platform);
      
      // 3. Fetch metrics from platform
      const metrics = await adapter.fetchMetrics(event.platform_post_id, connection as any);

      // 4. Record observation
      await db.insert(schema.performanceObservations).values({
        id: randomUUID(),
        publish_event_id: event.id,
        observed_at: new Date(),
        views: metrics.views,
        engagement: metrics.engagement,
        reach: metrics.reach || 0,
        raw_metrics: metrics.raw,
      });

      log.debug({ eventId: event.id }, 'Recorded metrics observation');

    } catch (err) {
      log.error({ err, eventId: event.id }, 'Failed to collect metrics for event');
    }
  }

  log.info({ brandId }, 'Metrics collection complete');
}
