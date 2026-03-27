import { FastifyPluginAsync } from 'fastify';
import { toCamel } from '@cronus/db';
import { generateWeeklyReport, computeAssetAttribution } from '@cronus/analytics';

export const analyticsRoutes: FastifyPluginAsync = async (app) => {
  // GET /brands/:brandId/reports/weekly
  app.get('/brands/:brandId/reports/weekly', async (request) => {
    const { brandId } = request.params as { brandId: string };
    const { week_of } = request.query as { week_of?: string };

    const report = await generateWeeklyReport(brandId, week_of ? new Date(week_of) : new Date());
    return toCamel(report);
  });

  // GET /brands/:brandId/assets/:assetId/attribution
  app.get('/brands/:brandId/assets/:assetId/attribution', async (request) => {
    const { assetId } = request.params as { assetId: string };
    
    const attribution = await computeAssetAttribution(assetId);
    return toCamel(attribution);
  });
};
