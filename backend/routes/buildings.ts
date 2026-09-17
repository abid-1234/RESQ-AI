import express from 'express';
import * as buildingService from '../services/buildingService.ts';

const router = express.Router();

router.get('/sector/:sector', async (req, res) => {
  try {
    res.json({ success: true, buildings: await buildingService.getBuildingsBySector(req.params.sector) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/zone/:hazardZone', async (req, res) => {
  try {
    res.json({ success: true, buildings: await buildingService.getBuildingsByHazardZone(req.params.hazardZone) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/gis/boundaries', async (_req, res) => {
  try {
    res.json({ success: true, boundaries: await buildingService.getGISBoundaryData() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/risk/high', async (req, res) => {
  try {
    res.json({ success: true, buildings: await buildingService.getHighRiskBuildings(req.query.sector as string) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/rescue/status', async (req, res) => {
  try {
    res.json({ success: true, status: await buildingService.getRescueOperationsStatus(req.query.sector as string) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:buildingId', async (req, res) => {
  try {
    const building = await buildingService.getBuildingById(req.params.buildingId);
    if (!building) return res.status(404).json({ error: 'Building not found' });
    res.json({ success: true, building });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    res.status(201).json({ success: true, building: await buildingService.createBuilding(req.body) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:buildingId/evacuation', async (req, res) => {
  try {
    const building = await buildingService.updateBuildingEvacuation(req.params.buildingId, req.body.evacuationStatus, req.body.trappedPersons);
    if (!building) return res.status(404).json({ error: 'Building not found' });
    res.json({ success: true, building });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:buildingId/structure', async (req, res) => {
  try {
    const building = await buildingService.updateBuildingStructure(req.params.buildingId, req.body.damageLevel);
    if (!building) return res.status(404).json({ error: 'Building not found' });
    res.json({ success: true, building });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
