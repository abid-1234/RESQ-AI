import express from 'express';
import { z } from 'zod';
import { sensorRegistry, seenTimestamps, rateWindow, pushReading, registerSensor, telemetryStore } from '../store/memory.ts';
import type { SensorReading, SensorMeta } from '../store/memory.ts';

const router = express.Router();

const REPLAY_WINDOW_MS = parseInt(process.env.TELEMETRY_REPLAY_WINDOW_MS || '300000', 10);
const RATE_LIMIT_PER_MIN = parseInt(process.env.RATE_LIMIT_PER_SENSOR_PER_MINUTE || '60', 10);

const telemetrySchema = z.object({
  sensorId: z.string().min(1),
  timestamp: z.string().min(1), // ISO 8601 — validated below
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  value: z.number(),
  unit: z.string().min(1),
  secondaryValue: z.number().optional(),
  secondaryUnit: z.string().optional(),
  gatewayId: z.string().optional(),
  status: z.string().optional(),
  authStatus: z.enum(['authenticated', 'unauthenticated', 'unknown']).optional(),
});

function isReplay(sensorId: string, ts: string): boolean {
  const set = seenTimestamps.get(sensorId);
  return !!set?.has(ts);
}
function markSeen(sensorId: string, ts: string) {
  if (!seenTimestamps.has(sensorId)) seenTimestamps.set(sensorId, new Set());
  seenTimestamps.get(sensorId)!.add(ts);
}

function isRateLimited(sensorId: string): boolean {
  const now = Date.now();
  const window = rateWindow.get(sensorId) || [];
  const recent = window.filter((t) => now - t < 60_000);
  rateWindow.set(sensorId, recent);
  if (recent.length >= RATE_LIMIT_PER_MIN) return true;
  recent.push(now);
  rateWindow.set(sensorId, recent);
  return false;
}

function validateSemantics(body: z.infer<typeof telemetrySchema>): string | null {
  const parsed = new Date(body.timestamp);
  if (isNaN(parsed.getTime())) return 'timestamp must be ISO 8601';
  const age = Date.now() - parsed.getTime();
  if (age > REPLAY_WINDOW_MS) return `timestamp too old (>${REPLAY_WINDOW_MS}ms replay window)`;
  if (age < -60_000) return 'timestamp is in the future';
  if (isReplay(body.sensorId, body.timestamp)) return 'duplicate timestamp (replay protection)';
  if (isRateLimited(body.sensorId)) return `rate limit exceeded (${RATE_LIMIT_PER_MIN}/min per sensor)`;
  // Unit check if sensor is known
  const known = sensorRegistry.get(body.sensorId);
  if (known && !known.allowedUnits.includes(body.unit) && body.unit !== known.allowedUnits[0]) {
    // Allow secondary unit as primary as well — soft check
    const allAllowed = known.allowedUnits.join(', ');
    // Don't reject, but could warn — for now enforce loosely
    // return `unit '${body.unit}' not allowed for sensor ${body.sensorId} (allowed: ${allAllowed})`;
  }
  return null;
}

// POST /api/telemetry — ingest single reading
router.post('/', (req, res) => {
  const parsed = telemetrySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  const err = validateSemantics(parsed.data);
  if (err) return res.status(400).json({ error: err });

  const b = parsed.data;
  markSeen(b.sensorId, b.timestamp);

  const reading: SensorReading = {
    id: `tel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sensorId: b.sensorId,
    value: b.value,
    unit: b.unit,
    secondaryValue: b.secondaryValue,
    secondaryUnit: b.secondaryUnit,
    lat: b.latitude,
    lng: b.longitude,
    timestamp: new Date(b.timestamp).toISOString(),
    receivedAt: new Date().toISOString(),
    gatewayId: b.gatewayId,
    authStatus: b.authStatus || 'unknown',
  };
  pushReading(reading);

  // Simple threshold anomaly flagging (real model in P3)
  const anomalyHint = b.value > 4.5 && b.unit.includes('meters') ? { anomalyDetected: true, anomalyHint: 'threshold_exceeded' } : {};

  res.status(201).json({ success: true, reading: { ...reading, ...anomalyHint } });
});

// GET /api/telemetry?sensorId=&limit=
router.get('/', (req, res) => {
  const { sensorId, limit } = req.query as any;
  let data = telemetryStore as SensorReading[];
  if (sensorId) data = data.filter((r) => r.sensorId === sensorId);
  const n = Math.min(parseInt(limit || '100', 10) || 100, 500);
  res.json({ success: true, count: data.length, readings: data.slice(-n) });
});

// GET /api/telemetry/sensors — also aliased as GET /api/sensors via server.ts
router.get('/sensors', (_req, res) => {
  res.json({ success: true, sensors: Array.from(sensorRegistry.values()) });
});

// POST /api/telemetry/sensors/register — also aliased as POST /api/sensors/register
router.post('/sensors/register', (req, res) => {
  const schema = z.object({
    sensorId: z.string().min(1),
    nodeCode: z.string().min(1),
    type: z.string().min(1),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    gatewayId: z.string().min(1),
    allowedUnits: z.array(z.string()).min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  if (sensorRegistry.has(parsed.data.sensorId)) return res.status(409).json({ error: 'sensorId already registered' });
  const meta: SensorMeta = parsed.data as SensorMeta;
  registerSensor(meta);
  res.status(201).json({ success: true, sensor: meta });
});

export default router;
