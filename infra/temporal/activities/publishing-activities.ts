import { getDb, schema } from '@cronus/db';
import { eq } from 'drizzle-orm';
import { PublishStatus } from '@cronus/domain';
import { getAdapter } from '@cronus/platform-adapter';
import { createLogger } from '@cronus/logger';

const log = createLogger('publishing-activities');

export async function publishToPlatform(publishEventId: string): Promise<void> {
  const db = getDb();

  // 1. Fetch event and context
  const [event] = await db
    .select()
    .from(schema.publishEvents)
    .where(eq(schema.publishEvents.id, publishEventId));

  if (!event) throw new Error(`Publish event not found: ${publishEventId}`);

  const [unit] = await db
    .select()
    .from(schema.contentUnits)
    .where(eq(schema.contentUnits.id, event.content_unit_id));

  const [connection] = await db
    .select()
    .from(schema.platformConnections)
    .where(eq(schema.platformConnections.id, event.platform_connection_id));

  if (!unit || !connection) {
    throw new Error('Incomplete data for publishing event');
  }

  log.info({ publishEventId, platform: connection.platform }, 'Publishing content unit');

  try {
    // 2. Mark as publishing
    await db.update(schema.publishEvents)
      .set({ status: PublishStatus.publishing })
      .where(eq(schema.publishEvents.id, publishEventId));

    // 3. Call adapter
    const adapter = getAdapter(connection.platform);
    const result = await adapter.publish(unit as any, connection as any);

    // 4. Update result
    await db.update(schema.publishEvents)
      .set({
        status: PublishStatus.published,
        published_at: new Date(),
        platform_post_id: result.platformPostId,
        platform_post_url: result.platformPostUrl,
      })
      .where(eq(schema.publishEvents.id, publishEventId));

    log.info({ publishEventId }, 'Successfully published');

  } catch (err: any) {
    log.error({ err, publishEventId }, 'Publishing failed');
    
    await db.update(schema.publishEvents)
      .set({
        status: PublishStatus.failed,
        error_message: err.message,
      })
      .where(eq(schema.publishEvents.id, publishEventId));
      
    throw err;
  }
}
