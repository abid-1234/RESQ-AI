import express from 'express';
import { z } from 'zod';

const router = express.Router();

// Simple in-memory ack log per alertId
type AckStatus = 'RECEIVED' | 'ACKNOWLEDGED' | 'FAILED' | 'PARTIAL';
const acks = new Map<string, { alertId: string; status: AckStatus; note?: string; at: string }[]>();

router.post('/:alertId/ack', (req, res) => {
  const schema = z.object({ status: z.enum(['RECEIVED', 'ACKNOWLEDGED', 'FAILED', 'PARTIAL']), note: z.string().max(2000).optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  const { status, note } = parsed.data;
  const alertId = req.params.alertId;
  if (!acks.has(alertId)) acks.set(alertId, []);
  const entry = { alertId, status: status as AckStatus, note, at: new Date().toISOString() };
  acks.get(alertId)!.push(entry);
  res.json({ success: true, ack: entry, history: acks.get(alertId) });
});

router.get('/:alertId/ack', (req, res) => {
  res.json({ success: true, alertId: req.params.alertId, history: acks.get(req.params.alertId) ?? [] });
});

export default router;
