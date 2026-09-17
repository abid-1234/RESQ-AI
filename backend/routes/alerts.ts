import express from 'express';
import { z } from 'zod';
import * as alertService from '../services/alertService.ts';
import { decide, nextEventId } from '../services/alertDecisionEngine.ts';
import { cbcTestPayload } from '../providers/cbc.ts';
import { broadcast } from '../services/broadcastManager.ts';
import { buildCapXml } from '../cap/cap12.ts';

const router = express.Router();

// In-memory ack log (also exposed via /api/alert-acks alias for history)
const ackStore = new Map<string, { alertId: string; status: string; note?: string; at: string }[]>();

// Get all active alerts
router.get('/', async (req, res) => {
  try {
    const alerts = await alertService.getActiveAlerts();
    res.json({ success: true, alerts });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get alert statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await alertService.getAlertStatistics();
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get alerts by incident
router.get('/incident/:incidentId', async (req, res) => {
  try {
    const alerts = await alertService.getAlertsByIncident(req.params.incidentId);
    res.json({ success: true, alerts });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create new alert
router.post('/', async (req, res) => {
  try {
    const alert = await alertService.createAlert(req.body);
    res.status(201).json({ success: true, alert });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Dispatch alert (and broadcast it)
router.post('/broadcast', async (req, res) => {
  try {
    const alert = await alertService.broadcastAlert(req.body);
    res.status(201).json({
      success: true,
      alert,
      message: 'Alert dispatched successfully',
      estimatedAudience: alert.estimatedAudience,
      channels: alert.channels
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update alert delivery status
router.put('/:alertId/delivery', async (req, res) => {
  try {
    const { successRate, acknowledgedCount } = req.body;
    const alert = await alertService.updateAlertDeliveryStatus(req.params.alertId, successRate, acknowledgedCount);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json({ success: true, alert });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Expire old alerts
router.post('/maintenance/expire-old', async (req, res) => {
  try {
    const result = await alertService.expireOldAlerts();
    res.json({ success: true, message: 'Old alerts expired', modifiedCount: result.modifiedCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Alert decision — maps probability/severity/exposure/tti/confidence → decision (P6)
router.post('/decide', (req, res) => {
  const schema = z.object({
    probability: z.number().min(0).max(1),
    severity: z.number().min(0).max(1),
    exposure: z.number().min(0),
    ttiMinutes: z.number().min(0).optional(),
    confidence: z.number().min(0).max(1),
    policy: z.enum(['conservative', 'standard', 'aggressive']).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  const result = decide(parsed.data);
  res.json({ success: true, eventId: nextEventId(), ...result });
});

// CBC test endpoint — SIMULATION only, never claims telecom success
router.get('/cbc/test', (_req, res) => {
  res.json({ success: true, cbc: cbcTestPayload() });
});

// Broadcast dispatch — honest mode labeling via broadcastManager (P6)
router.post('/dispatch', async (req, res) => {
  const schema = z.object({
    capAlert: z.object({
      identifier: z.string().min(1),
      sender: z.string().min(1),
      sent: z.string().min(1),
      status: z.string().min(1),
      msgType: z.string().min(1),
      scope: z.string().min(1),
      info: z.array(z.object({
        language: z.string().min(1),
        category: z.string().min(1),
        event: z.string().min(1),
        urgency: z.string().min(1),
        severity: z.string().min(1),
        certainty: z.string().min(1),
        headline: z.string().min(1),
        description: z.string().min(1),
        instruction: z.string().min(1),
        areaDesc: z.string().min(1),
        polygon: z.string().optional(),
        circle: z.string().optional(),
      })).min(1),
    }),
    channels: z.array(z.enum(['APP_BROADCAST', 'WEBSOCKET_BROADCAST', 'SMS', 'EMAIL', 'CAP', 'CBC_ADAPTER', 'SIMULATION'])).min(1),
    smsMessage: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  try {
    const capXml = buildCapXml(parsed.data.capAlert as any);
    const out = await broadcast({ capAlert: parsed.data.capAlert as any, channels: parsed.data.channels as any, smsMessage: parsed.data.smsMessage });
    res.json({ success: true, capXml, mode: out.mode, results: out.results });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Ack for an alert — POST /api/alerts/:alertId/ack (P7)
router.post('/:alertId/ack', (req, res) => {
  const schema = z.object({ status: z.enum(['RECEIVED', 'ACKNOWLEDGED', 'FAILED', 'PARTIAL']), note: z.string().max(2000).optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  const alertId = req.params.alertId;
  if (!ackStore.has(alertId)) ackStore.set(alertId, []);
  const entry = { alertId, status: parsed.data.status, note: parsed.data.note, at: new Date().toISOString() };
  ackStore.get(alertId)!.push(entry);
  res.json({ success: true, ack: entry, history: ackStore.get(alertId) });
});
router.get('/:alertId/ack', (req, res) => {
  res.json({ success: true, alertId: req.params.alertId, history: ackStore.get(req.params.alertId) ?? [] });
});

export default router;
