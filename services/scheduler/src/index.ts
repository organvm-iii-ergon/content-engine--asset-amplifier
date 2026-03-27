import { getDb, schema } from '@cronus/db';
import { eq, and, inArray } from '@cronus/db';
import { ApprovalStatus, PublishStatus, ScheduleStrategy } from '@cronus/domain';
import { createLogger } from '@cronus/logger';
import { randomUUID } from 'node:crypto';

const log = createLogger('scheduler');

/**
 * Schedules approved content units for publishing.
 * 
 * 1. Validates all provided content units are approved.
 * 2. Computes publish times based on the chosen strategy.
 * 3. Creates PublishEvent records.
 */
export async function scheduleContent(params: {
  brandId: string;
  contentUnitIds: string[];
  strategy: ScheduleStrategy;
  startDate: Date;
  endDate?: Date;
}) {
  const { brandId, contentUnitIds, strategy, startDate, endDate } = params;
  const db = getDb();

  log.info({ brandId, count: contentUnitIds.length, strategy }, 'Scheduling content');

  // 1. Fetch and validate units
  const units = await db
    .select()
    .from(schema.contentUnits)
    .where(
      inArray(schema.contentUnits.id, contentUnitIds)
    );

  const unapproved = units.filter(u => u.approval_status !== ApprovalStatus.approved);
  if (unapproved.length > 0) {
    throw new Error(`${unapproved.length} units are not approved and cannot be scheduled.`);
  }

  // 2. Compute publish times
  // Simple "Evenly Distributed" strategy for MVP
  const publishEvents = [];
  const durationMs = endDate 
    ? endDate.getTime() - startDate.getTime() 
    : contentUnitIds.length * 24 * 60 * 60 * 1000; // Default 1 post per day
  
  const intervalMs = durationMs / contentUnitIds.length;

  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    const scheduledAt = new Date(startDate.getTime() + (i * intervalMs));

    // Find a platform connection for this platform
    const [connection] = await db
      .select()
      .from(schema.platformConnections)
      .where(and(
        eq(schema.platformConnections.platform, unit.platform),
        eq(schema.platformConnections.brand_id, brandId)
      ));

    if (!connection) {
      log.warn({ platform: unit.platform, brandId }, 'No active connection found for platform, skipping schedule');
      continue;
    }

    publishEvents.push({
      id: randomUUID(),
      content_unit_id: unit.id,
      platform_connection_id: connection.id,
      scheduled_at: scheduledAt,
      status: PublishStatus.scheduled,
      retry_count: 0,
    });
  }

  // 3. Persist events
  if (publishEvents.length > 0) {
    await db.insert(schema.publishEvents).values(publishEvents);
  }

  log.info({ scheduledCount: publishEvents.length }, 'Scheduling complete');
  return publishEvents;
}
