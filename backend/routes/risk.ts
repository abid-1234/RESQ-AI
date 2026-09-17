import express from 'express';
import { z } from 'zod';
import { runDistrictRiskAnalysis, calculateBuildingRisk } from '../services/riskEngine.ts';

const router = express.Router();

const simSchema = z.object({
  hazardType: z.enum(['FLOOD', 'URBAN_FLOOD', 'DAM_BREACH', 'LANDSLIDE', 'SEISMIC_ANOMALY', 'CYCLONE', 'CLOUDBURST']),
  rainfallIntensityMmH: z.number().min(0).max(300),
  riverGaugeHeightM: z.number().min(0).max(12),
  groundAccelerationG: z.number().min(0).max(2),
  soilSaturationPercent: z.number().min(0).max(100),
  windSpeedKmh: z.number().min(0).max(300),
  evacuationComplianceRate: z.number().min(0).max(100),
  activeRoadClosures: z.number().int().min(0),
});

router.post('/analyze', (req, res) => {
  const schema = z.object({
    params: simSchema,
    buildings: z.array(z.any()).min(1),
    shelters: z.array(z.object({ capacity: z.number(), currentOccupancy: z.number() })).min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  const result = runDistrictRiskAnalysis(parsed.data.buildings as any, parsed.data.shelters, parsed.data.params as any);
  res.json({ success: true, result });
});

router.post('/building', (req, res) => {
  const schema = z.object({ building: z.any(), params: simSchema });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  const result = calculateBuildingRisk(parsed.data.building, parsed.data.params as any);
  res.json({ success: true, result });
});

export default router;
