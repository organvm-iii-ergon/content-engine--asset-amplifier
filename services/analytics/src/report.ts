import { getDb, schema } from '@cronus/db';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { createLogger } from '@cronus/logger';
import { computeAssetAttribution } from './attribution.js';

const log = createLogger('analytics:report');

/**
 * Generates a weekly performance report for a brand.
 */
export async function generateWeeklyReport(brandId: string, weekOf: Date) {
  const db = getDb();

  // 1. Calculate week boundaries
  const weekStart = new Date(weekOf);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  log.info({ brandId, weekStart, weekEnd }, 'Generating weekly report');

  // 2. Aggregate weekly totals
  const [totals] = await db
    .select({
      posts_published: sql<number>`count(distinct ${schema.publishEvents.id})`,
      total_views: sql<number>`sum(${schema.performanceObservations.views})`,
      total_engagement: sql<number>`sum(${schema.performanceObservations.engagement})`,
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
    .where(
      and(
        eq(schema.contentUnits.brand_id, brandId),
        gte(schema.performanceObservations.observed_at, weekStart),
        lte(schema.performanceObservations.observed_at, weekEnd)
      )
    );

  // 3. Get performance per asset
  const assets = await db
    .select()
    .from(schema.assets)
    .where(eq(schema.assets.brand_id, brandId));

  const assetAttributions = [];
  for (const asset of assets) {
    const attribution = await computeAssetAttribution(asset.id);
    if (attribution.totalViews > 0) {
      assetAttributions.push({
        ...attribution,
        originalFilename: asset.original_filename
      });
    }
  }

  return {
    brandId,
    weekStart,
    weekEnd,
    totalPostsPublished: Number(totals?.posts_published || 0),
    totalViews: Number(totals?.total_views || 0),
    totalEngagement: Number(totals?.total_engagement || 0),
    engagementRate: totals?.total_views ? Number(totals.total_engagement) / Number(totals.total_views) : 0,
    assetAttributions,
  };
}
