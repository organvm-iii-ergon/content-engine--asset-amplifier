import { collectMetrics, generateWeeklyReport } from '@cronus/analytics';

export async function runMetricsCollection(brandId: string): Promise<void> {
  await collectMetrics(brandId);
}

export async function runWeeklyReportGeneration(brandId: string, weekOf: Date): Promise<void> {
  await generateWeeklyReport(brandId, weekOf);
}
