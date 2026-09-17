import express from 'express';
const router = express.Router();

// Lightweight audit log stub — replace with persistent store when DB/Mongo is available
const entries: { at: string; action: string; detail?: unknown }[] = [];

export function audit(action: string, detail?: unknown) {
  entries.push({ at: new Date().toISOString(), action, detail });
  if (entries.length > 5000) entries.shift();
}

router.get('/', (_req, res) => {
  res.json({ success: true, audit: [...entries].reverse().slice(0, 200) });
});

export default router;
