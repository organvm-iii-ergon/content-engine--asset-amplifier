import { getDb, schema } from '@cronus/db';
import { eq, sql } from 'drizzle-orm';
import { createLogger } from '@cronus/logger';

const log = createLogger('analytics:attribution');

/**
 * Computes attribution metrics for an asset by rolling up observations.
 */
export async function computeAssetAttribution(assetId: string) {
  const db = getDb();

  log.info({ assetId }, 'Computing asset attribution');

  // This would ideally be a complex query or a materialized view.
  // For MVP, we'll use a simplified version.
  
  // 1. Roll up views and engagement from PerformanceObservations
  // through PublishEvents and ContentUnits to Fragments
  const fragmentMetrics = await db
    .select({
      fragment_id: schema.contentUnits.fragment_id,
      total_views: sql<number>`sum(${schema.performanceObservations.views})`,
      total_engagement: sql<number>`sum(${schema.performanceObservations.likes} + ${schema.performanceObservations.comments} + ${schema.performanceObservations.shares} + ${schema.performanceObservations.saves})`,
    })
    .from(schema.performanceObservations)
    .innerJoin(
      schema.publishEvents,
      eq(schema.performanceObservations.publish_event_id, schema.publishEvents.id)
    )
    .innerJoin(
      schema.contentUnits,
      eq(schema.publishEvents.content_unit_id, schema.contentUnits.id)
    )
    .innerJoin(
      schema.fragments,
      eq(schema.contentUnits.fragment_id, schema.fragments.id)
    )
    .where(eq(schema.fragments.asset_id, assetId))
    .groupBy(schema.contentUnits.fragment_id);

  // 2. Roll up fragments to Asset
  const assetRollup = fragmentMetrics.reduce((acc, curr) => ({
    views: acc.views + Number(curr.total_views || 0),
    engagement: acc.engagement + Number(curr.total_engagement || 0),
  }), { views: 0, engagement: 0 });

  return {
    assetId,
    totalViews: assetRollup.views,
    totalEngagement: assetRollup.engagement,
    engagementRate: assetRollup.views > 0 ? assetRollup.engagement / assetRollup.views : 0,
    fragments: fragmentMetrics,
  };
}
