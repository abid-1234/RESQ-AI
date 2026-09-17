import express from 'express';
import * as shelterService from '../services/shelterService.ts';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const shelters = await shelterService.getAllShelters();
    res.json({ success: true, shelters });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/report/capacity', async (_req, res) => {
  try {
    const report = await shelterService.getShelterCapacityReport();
    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:shelterId', async (req, res) => {
  try {
    const shelter = await shelterService.getShelterById(req.params.shelterId);
    if (!shelter) return res.status(404).json({ error: 'Shelter not found' });
    res.json({ success: true, shelter });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const shelter = await shelterService.createShelter(req.body);
    res.status(201).json({ success: true, shelter });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:shelterId/occupancy', async (req, res) => {
  try {
    const shelter = await shelterService.updateShelterOccupancy(req.params.shelterId, req.body.occupancy);
    if (!shelter) return res.status(404).json({ error: 'Shelter not found' });
    res.json({ success: true, shelter });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:shelterId/resources', async (req, res) => {
  try {
    const shelter = await shelterService.updateShelterResources(req.params.shelterId, req.body);
    if (!shelter) return res.status(404).json({ error: 'Shelter not found' });
    res.json({ success: true, shelter });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/nearest', async (req, res) => {
  try {
    const shelter = await shelterService.findNearestShelter(req.body.latitude, req.body.longitude);
    if (!shelter) return res.status(404).json({ error: 'No available shelter found' });
    res.json({ success: true, shelter });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
