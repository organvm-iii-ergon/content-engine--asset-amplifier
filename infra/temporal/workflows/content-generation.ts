import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities/content-activities.js';
import { Platform } from '@cronus/domain';

const { generateContent, scoreGeneratedContent, deduplicateContent } = proxyActivities<typeof activities>({
  startToCloseTimeout: '15 minutes',
  retry: {
    initialInterval: '5s',
    maximumAttempts: 3,
  },
});

/**
 * Temporal workflow for generating social content from fragments.
 * 
 * Flow: generateContent -> scoreAll -> deduplicate -> store
 */
export async function contentGenerationWorkflow(params: {
  brandId: string;
  assetId: string;
  platforms: Platform[];
}): Promise<void> {
  // 1. Generate captions and format media for each platform
  const unitIds = await generateContent(params);

  if (unitIds.length === 0) return;

  // 2. Score units against Natural Center
  await scoreGeneratedContent(unitIds);

  // 3. Deduplicate to avoid repetitive content
  await deduplicateContent(params.brandId, unitIds);
}
