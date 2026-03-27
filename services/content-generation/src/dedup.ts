import { getDb, schema } from '@cronus/db';
import { eq, and, inArray } from 'drizzle-orm';
import { ApprovalStatus } from '@cronus/domain';
import { createLogger } from '@cronus/logger';

const log = createLogger('content-generation:dedup');

/**
 * Identifies and flags duplicate content units for a brand.
 * 
 * 1. Checks for identical captions on the same platform.
 * 2. Checks for identical media keys (same fragment used for same platform).
 * 3. Marks duplicates as 'flagged' for review.
 */
export async function deduplicateContentUnits(brandId: string, contentUnitIds: string[]) {
  const db = getDb();
  
  const units = await db
    .select()
    .from(schema.contentUnits)
    .where(
      and(
        eq(schema.contentUnits.brand_id, brandId),
        inArray(schema.contentUnits.id, contentUnitIds)
      )
    );

  if (units.length === 0) return;

  log.info({ brandId, count: units.length }, 'Running deduplication');

  const seenCaptions = new Map<string, string>(); // caption:unitId
  const seenMedia = new Map<string, string>(); // mediaKey:unitId

  for (const unit of units) {
    const captionKey = `${unit.platform}:${unit.caption.slice(0, 100)}`;
    const mediaKey = `${unit.platform}:${unit.media_key}`;

    if (seenCaptions.has(captionKey)) {
      await flagDuplicate(unit.id, `Duplicate caption found in unit ${seenCaptions.get(captionKey)}`);
      continue;
    }

    if (seenMedia.has(mediaKey)) {
      await flagDuplicate(unit.id, `Duplicate media (same fragment) used for ${unit.platform}`);
      continue;
    }

    seenCaptions.set(captionKey, unit.id);
    seenMedia.set(mediaKey, unit.id);
  }
}

async function flagDuplicate(unitId: string, reason: string) {
  const db = getDb();
  log.info({ unitId, reason }, 'Flagging duplicate content unit');
  
  await db.update(schema.contentUnits)
    .set({ 
      approval_status: ApprovalStatus.flagged,
      flagged_reason: reason 
    })
    .where(eq(schema.contentUnits.id, unitId));
}
