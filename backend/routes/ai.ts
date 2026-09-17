import express from 'express';
import { z } from 'zod';
import { infer } from '../ai/inference/inferenceService.ts';
import { getRegistry } from '../ai/inference/modelRegistry.ts';

const router = express.Router();

const inferSchema = z.object({
  hazard: z.string().min(1).default('flood'),
  features: z.record(z.string(), z.number()).refine((o) => Object.keys(o).length > 0, 'features must be non-empty'),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
}).passthrough();

router.post('/infer', (req, res) => {
  const parsed = inferSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  const result = infer(parsed.data as any);
  res.json({ success: true, inference: result });
});

router.get('/models', (_req, res) => {
  res.json({ success: true, models: getRegistry() });
});

export default router;
