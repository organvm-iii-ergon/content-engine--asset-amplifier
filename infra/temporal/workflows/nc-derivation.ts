import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities/nc-activities.js';

const { runNCDerivation } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
  retry: {
    initialInterval: '5s',
    maximumAttempts: 3,
  },
});

/**
 * Temporal workflow for deriving a brand's Natural Center.
 */
export async function ncDerivationWorkflow(params: {
  brandId: string;
  assetIds: string[];
  toneDescription?: string;
}): Promise<void> {
  // 1. Run derivation pipeline
  await runNCDerivation(params);
}
