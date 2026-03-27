import { generateAssetContent, deduplicateContentUnits } from '@cronus/content-generation';
import { scoreContentUnits } from '@cronus/scoring';
import { getDb, schema } from '@cronus/db';
import { eq } from 'drizzle-orm';
import { Platform } from '@cronus/domain';

export async function generateContent(params: {
  brandId: string;
  assetId: string;
  platforms: Platform[];
}): Promise<string[]> {
  await generateAssetContent(params);

  const db = getDb();

  // Get all content units generated from this asset's fragments
  const units = await db
    .select({ id: schema.contentUnits.id })
    .from(schema.contentUnits)
    .innerJoin(schema.fragments, eq(schema.contentUnits.fragment_id, schema.fragments.id))
    .where(eq(schema.fragments.asset_id, params.assetId));

  return units.map(u => u.id);
}

export async function scoreGeneratedContent(unitIds: string[]): Promise<void> {
  await scoreContentUnits(unitIds);
}

export async function deduplicateContent(brandId: string, unitIds: string[]): Promise<void> {
  await deduplicateContentUnits(brandId, unitIds);
}
