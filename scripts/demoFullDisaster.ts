/**
 * Demo: telemetry burst → AI inference → GIS polygon → risk → capacity → alert → dispatch(SIMULATION) → SOS → ack
 * Run: npx tsx scripts/demoFullDisaster.ts  (expects server on http://localhost:3000)
 */
const BASE = process.env.APP_URL || 'http://localhost:3000';

async function j(path: string, init?: RequestInit) {
  const r = await fetch(`${BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, ...init });
  const body = await r.json().catch(() => ({}));
  const ok = r.ok ? '✓' : '✗';
  console.log(`${ok} ${init?.method || 'GET'} ${path} → ${r.status}`);
  if (!r.ok) console.log(body);
  return { status: r.status, body };
}

async function main() {
  console.log(`\nRESQ-AI demoFullDisaster — BASE=${BASE}\n`);

  const h = await j('/api/health');
  console.log('health:', h.body.subsystems ?? h.body.status);

  // 1. Telemetry burst (sns-01 critical gauge)
  await j('/api/telemetry', {
    method: 'POST',
    body: JSON.stringify({
      sensorId: 'sns-01',
      timestamp: new Date().toISOString(),
      lat: 17.385, lng: 78.4867,
      value: 5.1, unit: 'meters',
      gatewayId: 'gw-01',
    }),
  });

  // 2. Inference
  const inf = await j('/api/ai/infer', {
    method: 'POST',
    body: JSON.stringify({ hazard: 'flood', features: { waterLevelM: 5.1, rainfallMmH: 88, soilSaturation: 92 }, lat: 17.385, lng: 78.4867 }),
  });
  const sev = inf.body?.inference?.severity ?? 0.8;
  const radiusM = inf.body?.inference?.radiusM ?? 1400;

  // 3. GIS polygon
  await j('/api/gis/hazard-polygon', { method: 'POST', body: JSON.stringify({ center: [17.385, 78.4867], redRadiusM: radiusM }) });

  // 4. Exposure
  await j('/api/gis/exposure', {
    method: 'POST',
    body: JSON.stringify({ center: [17.385, 78.4867], redRadiusM: radiusM, points: [[17.386, 78.487], [17.40, 78.50], [17.30, 78.40]] }),
  });

  // 5. Risk
  const buildings = [
    { structuralType: 'TIMBER_MUD', constructionYear: 1980, soilCategory: 'RIVER_BED_SAND', elevationMeters: 502, nearestRiverDistanceKm: 0.2, registeredPopulation: 120, estimatedOccupancy: 95, vulnerableGroups: { children: 20, elderly: 15, disabled: 5 } },
    { structuralType: 'REINFORCED_CONCRETE', constructionYear: 2010, soilCategory: 'ROCK_STABLE', elevationMeters: 540, nearestRiverDistanceKm: 3.0, registeredPopulation: 200, estimatedOccupancy: 180, vulnerableGroups: { children: 10, elderly: 8, disabled: 2 } },
  ];
  await j('/api/risk/analyze', {
    method: 'POST',
    body: JSON.stringify({
      params: { hazardType: 'FLOOD', rainfallIntensityMmH: 88, riverGaugeHeightM: 5.1, groundAccelerationG: 0, soilSaturationPercent: 92, windSpeedKmh: 12, evacuationComplianceRate: 70, activeRoadClosures: 1 },
      buildings, shelters: [{ capacity: 1500, currentOccupancy: 840 }],
    }),
  });

  // 6. Capacity
  await j('/api/capacity/evaluate', {
    method: 'POST',
    body: JSON.stringify({ site: { totalPopulationCapacity: 1500, currentRelocated: 840, carryingCapacity: { waterCapacityPersons: 1800, foodLogisticsDays: 12, sanitationIndexScore: 82 } }, addedPopulation: 200 }),
  });

  // 7. Evacuation
  await j('/api/evacuation/route', {
    method: 'POST',
    body: JSON.stringify({
      origin: [17.385, 78.4867],
      shelters: [{ id: 'sh-01', name: 'North Highland', location: [17.395, 78.49], availableBeds: 660 }],
      hazardCenter: [17.385, 78.4867], redRadiusM: radiusM,
    }),
  });

  // 8. Alert decision
  await j('/api/alerts/decide', { method: 'POST', body: JSON.stringify({ probability: 0.82, severity: sev, exposure: 8420, ttiMinutes: 35, confidence: 0.84 }) });

  // 9. Dispatch (SIMULATION — honest mode)
  const capAlert = {
    identifier: `RESQ-EVT-${new Date().getFullYear()}-000001`,
    sender: 'resq-ai@district.gov.in',
    sent: new Date().toISOString(),
    status: 'Actual', msgType: 'Alert', scope: 'Public',
    info: [{
      language: 'en', category: 'Met', event: 'Flood', urgency: 'Immediate', severity: 'Severe', certainty: 'Likely',
      headline: 'Flood warning — Sector 4 riverfront',
      description: 'River gauge 5.10m, rainfall 88 mm/h. Evacuate low-lying areas.',
      instruction: 'Move to North Highland Shelter via Overbridge corridor.',
      areaDesc: 'Sector 4 lowlands', polygon: '17.385,78.4867 17.390,78.490 17.385,78.495 17.380,78.490',
    }],
  };
  const disp = await j('/api/alerts/dispatch', { method: 'POST', body: JSON.stringify({ capAlert, channels: ['CAP', 'SIMULATION'] }) });
  console.log('dispatch mode:', disp.body.mode, '—', disp.body.results?.[0]?.detail ?? disp.body.note);

  // 10. CBC test (simulation)
  await j('/api/alerts/cbc/test');

  // 11. SOS
  const sos = await j('/api/sos', { method: 'POST', body: JSON.stringify({ lat: 17.386, lng: 78.487, message: 'Trapped — Bund Colony, need boat' }) });
  if (sos.body?.sos?.id) {
    await j(`/api/sos/${sos.body.sos.id}/ack`, { method: 'POST', body: JSON.stringify({ status: 'ACKNOWLEDGED' }) });
  }

  // 12. Ack an alert
  const alertId = disp.body.capXml ? 'ALT-DEMO' : 'ALT-DEMO';
  await j(`/api/alerts/${alertId}/ack`, { method: 'POST', body: JSON.stringify({ status: 'ACKNOWLEDGED', note: 'Demo ack' }) });

  // 13. Audit + analytics
  await j('/api/audit');
  await j('/api/analytics');

  console.log('\ndemoFullDisaster done.\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
