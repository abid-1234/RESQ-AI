import express from 'express';
const router = express.Router();

// Per-stage latency buckets (mocked from telemetry→AI→GIS→risk→alert→dispatch→ack)
router.get('/', (_req, res) => {
  res.json({
    success: true,
    latencies: {
      T_sensor: '12ms',
      T_ai: '42ms',
      T_gis: '18ms',
      T_risk: '9ms',
      T_alertDecision: '5ms',
      T_cap: '4ms',
      T_dispatch: '31ms',
      T_ack: '—',
    },
    counters: {
      telemetryReceived: 128,
      aiInferences: 64,
      alertsCreated: 7,
      dispatches: 7,
      acks: 3,
    },
  });
});

export default router;
