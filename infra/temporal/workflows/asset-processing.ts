import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities/asset-activities.js';

const { extractFragments, scoreFragments, updateAssetStatus } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
  retry: {
    initialInterval: '1s',
    maximumInterval: '100s',
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
});

/**
 * Temporal workflow for processing an uploaded asset.
 * 
 * Flow: extractFragments -> scoreFragments -> updateAssetStatus
 */
export async function assetProcessingWorkflow(assetId: string): Promise<void> {
  // 1. Extract visual and audio fragments
  await extractFragments(assetId);

  // 2. Initial scoring/analysis of fragments
  await scoreFragments(assetId);

  // 3. Mark as complete
  await updateAssetStatus(assetId, 'extracted');
}
