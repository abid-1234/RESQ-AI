import express from 'express';
import { z } from 'zod';
import { hazardPolygons, zoneForPoint } from '../services/geoService.ts';

const router = express.Router();

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const schema = z.object({
  origin: z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)]),
  shelters: z.array(z.object({
    id: z.string(),
    name: z.string().optional(),
    location: z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)]),
    availableBeds: z.number().min(0).optional(),
  })).min(1),
  hazardCenter: z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)]).optional(),
  redRadiusM: z.number().positive().max(50000).optional(),
  roadClosures: z.number().int().min(0).optional(),
});

router.post('/route', (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  const { origin, shelters, hazardCenter, redRadiusM } = parsed.data;

  let zones: ReturnType<typeof hazardPolygons> | null = null;
  if (hazardCenter && redRadiusM) {
    try { zones = hazardPolygons(hazardCenter as [number, number], redRadiusM); } catch { zones = null; }
  }

  // Score each shelter: distance + red-zone penalty + capacity bonus
  const options = shelters.map((s) => {
    const distKm = haversineKm(origin[0], origin[1], s.location[0], s.location[1]);
    let penalty = 0;
    let zone: string = 'UNKNOWN';
    let avoidsRedZone = true;

    if (zones) {
      // Check midpoint and destination for red-zone incursion
      const mid: [number, number] = [(origin[0] + s.location[0]) / 2, (origin[1] + s.location[1]) / 2];
      // zoneForPoint expects [lng, lat]
      const midZone = zoneForPoint([mid[1], mid[0]], zones);
      const destZone = zoneForPoint([s.location[1], s.location[0]], zones);
      zone = destZone;
      if (midZone === 'RED' || destZone === 'RED') {
        penalty = 8; // heavy penalty — route through red zone
        avoidsRedZone = false;
      } else if (midZone === 'ORANGE') {
        penalty = 2;
      }
    }

    const etaMinutes = Math.round((distKm / 28) * 60 + penalty * 3); // 28 km/h avg convoy + penalty
    const score = distKm + penalty * 1.5 - (s.availableBeds ?? 0) / 500;
    return {
      shelterId: s.id,
      shelterName: s.name ?? s.id,
      distanceKm: Math.round(distKm * 10) / 10,
      etaMinutes,
      avoidsRedZone,
      zone,
      score: Math.round(score * 10) / 10,
      waypoints: [origin, s.location] as [number, number][],
    };
  });

  options.sort((a, b) => a.score - b.score);

  // Top option is recommended; include up to 3
  const ranked = options.slice(0, 3).map((o, idx) => ({ ...o, rank: idx + 1, recommended: idx === 0 }));

  res.json({ success: true, origin, options: ranked });
});

export default router;
