import express from 'express';
import { z } from 'zod';
import { hazardPolygons, zoneForPoint } from '../services/geoService.ts';

const router = express.Router();

const polygonSchema = z.object({
  center: z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)]), // [lat, lng]
  redRadiusM: z.number().positive().max(50000),
  orangeMultiplier: z.number().positive().optional(),
  yellowMultiplier: z.number().positive().optional(),
});

router.post('/hazard-polygon', (req, res) => {
  const parsed = polygonSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  const { center, redRadiusM, orangeMultiplier, yellowMultiplier } = parsed.data;
  try {
    const zones = hazardPolygons(center as [number, number], redRadiusM, orangeMultiplier, yellowMultiplier);
    res.json({ success: true, zones });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/exposure', (req, res) => {
  const schema = z.object({
    center: z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)]),
    redRadiusM: z.number().positive().max(50000),
    points: z.array(z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)])), // [lat,lng][]
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  const { center, redRadiusM, points } = parsed.data;
  const zones = hazardPolygons(center as [number, number], redRadiusM);
  const results = points.map((p) => {
    const zone = zoneForPoint([p[1], p[0]], zones); // GeoJSON is [lng,lat]
    return { point: p, zone };
  });
  const byZone = { RED: 0, ORANGE: 0, YELLOW: 0, GREEN: 0 } as Record<string, number>;
  results.forEach((r) => byZone[r.zone]++);
  res.json({ success: true, zones, results, summary: byZone });
});

router.get('/zones', (req, res) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const r = parseFloat(req.query.redRadiusM as string) || 1400;
  if (!isFinite(lat) || !isFinite(lng)) return res.status(400).json({ error: 'lat and lng query params required' });
  const zones = hazardPolygons([lat, lng], r);
  res.json({ success: true, zones });
});

const INDIA_HAZARDS: Array<{ id: string; center: [number, number]; hazard: string; severity: string; radiusM: number; state: string; label: string }> = [
  { id: 'hz-gps', center: [17.3765, 78.4795], hazard: 'FLOOD', severity: 'LEVEL_4_CRITICAL', radiusM: 1400, state: 'Telangana', label: 'Krishna Basin Flood' },
  { id: 'hz-uk-01', center: [30.3165, 79.0322], hazard: 'LANDSLIDE', severity: 'LEVEL_5_EXTREME', radiusM: 1800, state: 'Uttarakhand', label: 'Uttarkashi Slope Failure' },
  { id: 'hz-hp-01', center: [31.1048, 77.1734], hazard: 'CLOUDBURST', severity: 'LEVEL_4_CRITICAL', radiusM: 1200, state: 'Himachal Pradesh', label: 'Shimla Cloudburst' },
  { id: 'hz-jk-01', center: [33.7782, 76.5762], hazard: 'SEISMIC_ANOMALY', severity: 'LEVEL_3_WARNING', radiusM: 2600, state: 'Jammu & Kashmir', label: 'Kishtwar Tremor Swarm' },
  { id: 'hz-as-01', center: [26.2006, 92.9376], hazard: 'FLOOD', severity: 'LEVEL_4_CRITICAL', radiusM: 3200, state: 'Assam', label: 'Brahmaputra Inundation' },
  { id: 'hz-ar-01', center: [27.0844, 93.6053], hazard: 'LANDSLIDE', severity: 'LEVEL_4_CRITICAL', radiusM: 1400, state: 'Arunachal Pradesh', label: 'Papum Pare Debris Flow' },
  { id: 'hz-od-01', center: [19.8135, 85.8312], hazard: 'CYCLONE', severity: 'LEVEL_5_EXTREME', radiusM: 2800, state: 'Odisha', label: 'Puri Cyclonic Surge' },
  { id: 'hz-wb-01', center: [22.5726, 88.3639], hazard: 'FLOOD', severity: 'LEVEL_3_WARNING', radiusM: 1600, state: 'West Bengal', label: 'Kolkata Urban Flood' },
  { id: 'hz-tn-01', center: [13.0827, 80.2707], hazard: 'CYCLONE', severity: 'LEVEL_4_CRITICAL', radiusM: 2100, state: 'Tamil Nadu', label: 'Chennai Coastal Surge' },
  { id: 'hz-ap-01', center: [16.5062, 80.648], hazard: 'FLOOD', severity: 'LEVEL_3_WARNING', radiusM: 1300, state: 'Andhra Pradesh', label: 'Vijayawada River Rise' },
  { id: 'hz-mh-01', center: [19.076, 72.8777], hazard: 'FLOOD', severity: 'LEVEL_3_WARNING', radiusM: 1500, state: 'Maharashtra', label: 'Mumbai Coastal Inundation' },
  { id: 'hz-gj-01', center: [23.0225, 72.5714], hazard: 'SEISMIC_ANOMALY', severity: 'LEVEL_3_WARNING', radiusM: 2400, state: 'Gujarat', label: 'Kutch Seismic Anomaly' },
  { id: 'hz-rj-01', center: [26.9124, 75.7873], hazard: 'DAM_BREACH', severity: 'LEVEL_4_CRITICAL', radiusM: 1900, state: 'Rajasthan', label: 'Bisalpur Reservoir Stress' },
  { id: 'hz-kl-01', center: [10.8505, 76.2711], hazard: 'CLOUDBURST', severity: 'LEVEL_4_CRITICAL', radiusM: 1100, state: 'Kerala', label: 'Idukki Cloudburst' },
  { id: 'hz-ka-01', center: [12.9716, 77.5946], hazard: 'FLOOD', severity: 'LEVEL_3_WARNING', radiusM: 1000, state: 'Karnataka', label: 'Bengaluru Urban Flood' },
  { id: 'hz-mp-01', center: [23.2599, 77.4126], hazard: 'LANDSLIDE', severity: 'LEVEL_3_WARNING', radiusM: 900, state: 'Madhya Pradesh', label: 'Bhopal Escarpment Slip' },
];

router.get('/india-hazards', (_req, res) => {
  res.json({ success: true, hazards: INDIA_HAZARDS, count: INDIA_HAZARDS.length, redCount: INDIA_HAZARDS.filter(h => h.severity === 'LEVEL_4_CRITICAL' || h.severity === 'LEVEL_5_EXTREME').length });
});

export default router;
