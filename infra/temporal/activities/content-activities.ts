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
  
  // Return IDs of generated units for next activity
  const db = getDb();
  const units = await db.select({ id: schema.contentUnits.id })
    .from(schema.contentUnits)
    .where(eq(schema.contentUnits.fragment_id, params.assetId)); // Simplification: assuming we want to score what we just made
  
  return units.map(u => u.id);
}

export async function scoreGeneratedContent(unitIds: string[]): Promise<void> {
  await scoreContentUnits(unitIds);
}

export async function deduplicateContent(brandId: string, unitIds: string[]): Promise<void> {
  await deduplicateContentUnits(brandId, unitIds);
}
