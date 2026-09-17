import express from 'express';
import { z } from 'zod';
import { publish } from '../ws/server.ts';

const router = express.Router();

interface SosRecord {
  id: string;
  citizenId?: string;
  lat: number;
  lng: number;
  message?: string;
  status: 'RECEIVED' | 'ACKNOWLEDGED' | 'DISPATCHED' | 'RESOLVED';
  createdAt: string;
}

const store: SosRecord[] = [];
let seq = 0;
function nextId() { return `SOS-${Date.now()}-${++seq}`; }

const sosSchema = z.object({
  citizenId: z.string().optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  message: z.string().max(2000).optional(),
});

// Create SOS
router.post('/', (req, res) => {
  const parsed = sosSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  const rec: SosRecord = { id: nextId(), ...parsed.data, status: 'RECEIVED', createdAt: new Date().toISOString() };
  store.push(rec);
  try { publish('sos_created', rec); } catch { /* ws not attached yet */ }
  res.status(201).json({ success: true, sos: rec });
});

// List SOS
router.get('/', (_req, res) => {
  res.json({ success: true, sos: [...store].reverse().slice(0, 100) });
});

// Ack / status update
router.post('/:id/ack', (req, res) => {
  const { status } = req.body as { status?: SosRecord['status'] };
  const rec = store.find((s) => s.id === req.params.id);
  if (!rec) return res.status(404).json({ error: 'SOS not found' });
  if (status && ['ACKNOWLEDGED', 'DISPATCHED', 'RESOLVED'].includes(status)) rec.status = status;
  res.json({ success: true, sos: rec });
});

export default router;
