import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities/analytics-activities.js';

const { runMetricsCollection, runWeeklyReportGeneration } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
  retry: {
    initialInterval: '1 minute',
    maximumAttempts: 3,
  },
});

/**
 * Temporal workflow for collecting analytics and optionally generating reports.
 */
export async function analyticsCollectionWorkflow(params: {
  brandId: string;
  generateReport?: boolean;
  weekOf?: Date;
}): Promise<void> {
  const { brandId, generateReport, weekOf } = params;

  // 1. Collect latest metrics from all platforms
  await runMetricsCollection(brandId);

  // 2. Generate report if requested
  if (generateReport) {
    await runWeeklyReportGeneration(brandId, weekOf || new Date());
  }
}
