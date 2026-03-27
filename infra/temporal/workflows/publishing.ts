import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from '../activities/publishing-activities.js';

const { publishToPlatform } = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
  retry: {
    initialInterval: '10s',
    maximumAttempts: 3,
    backoffCoefficient: 2,
  },
});

/**
 * Temporal workflow for publishing content.
 * Can be used for immediate publishing or scheduled by sleeping.
 */
export async function publishingWorkflow(params: {
  publishEventId: string;
  scheduledAt: Date;
}): Promise<void> {
  const { publishEventId, scheduledAt } = params;

  // 1. Wait until scheduled time
  const now = new Date();
  const delayMs = new Date(scheduledAt).getTime() - now.getTime();
  
  if (delayMs > 0) {
    await sleep(delayMs);
  }

  // 2. Execute publishing
  await publishToPlatform(publishEventId);
}
