import { processAssetFragments } from '@cronus/fragment-extraction';
import { scoreContentUnits } from '@cronus/scoring';
import { getDb, schema } from '@cronus/db';
import { eq } from 'drizzle-orm';
import { ProcessingStatus } from '@cronus/domain';

export async function extractFragments(assetId: string): Promise<void> {
  await processAssetFragments(assetId);
}

export async function scoreFragments(assetId: string): Promise<void> {
  // In Layer 1, we might score fragments or just content units.
  // The task says "scoreFragments". For now, we stub this if needed
  // or call the content unit scoring if applicable.
}

export async function updateAssetStatus(assetId: string, status: ProcessingStatus): Promise<void> {
  const db = getDb();
  await db.update(schema.assets)
    .set({ processing_status: status })
    .where(eq(schema.assets.id, assetId));
}
