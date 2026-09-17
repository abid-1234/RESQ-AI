import express from 'express';
import * as incidentService from '../services/incidentService.ts';

const router = express.Router();

// Get all active incidents
router.get('/', async (_req, res) => {
  try {
    const incidents = await incidentService.getActiveIncidents();
    res.json({ success: true, incidents });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get incident by ID
router.get('/:incidentId', async (req, res) => {
  try {
    const incident = await incidentService.getIncidentById(req.params.incidentId);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    res.json({ success: true, incident });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get incident statistics
router.get('/:incidentId/stats', async (req, res) => {
  try {
    const stats = await incidentService.getIncidentStats(req.params.incidentId);
    if (!stats) return res.status(404).json({ error: 'Incident not found' });
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create new incident
router.post('/', async (req, res) => {
  try {
    const incident = await incidentService.createIncident(req.body);
    res.status(201).json({ success: true, incident });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update incident
router.put('/:incidentId', async (req, res) => {
  try {
    const incident = await incidentService.updateIncident(req.params.incidentId, req.body);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    res.json({ success: true, incident });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Close incident
router.post('/:incidentId/close', async (req, res) => {
  try {
    const incident = await incidentService.closeIncident(req.params.incidentId);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    res.json({ success: true, message: 'Incident closed', incident });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
