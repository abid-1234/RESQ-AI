import express from 'express';
import { z } from 'zod';

const router = express.Router();

/**
 * Relocation carrying capacity — mirrors frontend/src/services/riskEngine.evaluateRelocationCarryingCapacity
 */
router.post('/evaluate', (req, res) => {
  const schema = z.object({
    site: z.object({
      totalPopulationCapacity: z.number().positive(),
      currentRelocated: z.number().min(0),
      carryingCapacity: z.object({
        waterCapacityPersons: z.number().min(0),
        foodLogisticsDays: z.number().min(0),
        sanitationIndexScore: z.number().min(0).max(100),
      }),
    }),
    addedPopulation: z.number().min(0),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  const { site, addedPopulation } = parsed.data;
  const projected = site.currentRelocated + addedPopulation;
  const ratio = projected / site.totalPopulationCapacity;
  const waterRemainingDays = Math.max(0, Math.round(site.carryingCapacity.waterCapacityPersons / Math.max(1, projected) * 10));
  const foodRemainingDays = Math.max(0, Math.round(site.carryingCapacity.foodLogisticsDays * (site.totalPopulationCapacity / Math.max(1, projected))));
  let score = 95;
  if (ratio > 1.2) score -= 40;
  else if (ratio > 1.0) score -= 25;
  else if (ratio > 0.8) score -= 10;
  if (waterRemainingDays < 5) score -= 25;
  if (foodRemainingDays < 7) score -= 15;
  if (site.carryingCapacity.sanitationIndexScore < 75) score -= 15;
  score = Math.max(10, Math.min(100, score));
  let warningLevel: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' = 'GREEN';
  if (score < 40) warningLevel = 'RED';
  else if (score < 65) warningLevel = 'ORANGE';
  else if (score < 80) warningLevel = 'YELLOW';
  let notes = 'Stable logistics corridor. High water and food replenishment reserves.';
  if (warningLevel === 'RED') notes = 'CRITICAL OVERLOAD: Sanitation and drinking water supply will deplete rapidly without immediate logistical convoys.';
  else if (warningLevel === 'ORANGE') notes = 'CAUTION: Additional mobile water purification and field toilets required within 24 hours.';
  res.json({ success: true, result: { effectiveScore: score, waterRemainingDays, foodRemainingDays, warningLevel, notes } });
});

export default router;
