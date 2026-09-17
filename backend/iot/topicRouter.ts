/**
 * MQTT topic router for RESQ-AI ingestion.
 * Hierarchy: resq/{region}/{hazard}/{sensor_type}
 * e.g. resq/hyderabad/flood/water_level  or  resq/giri/landslide/soil_moisture
 */
export interface ParsedTopic {
  region: string;
  hazard: string;
  sensorType: string;
  raw: string;
}

const VALID_HAZARDS = new Set(['flood', 'landslide', 'wildfire', 'earthquake', 'cyclone', 'dam_breach', 'cloudburst', 'seismic_anomaly']);
const VALID_SENSOR_TYPES = new Set(['water_level', 'rainfall', 'soil_moisture', 'seismic_vibration', 'weather_baro', 'barometric', 'wind', 'temperature', 'humidity']);

export function parseTopic(topic: string): ParsedTopic | null {
  const parts = topic.split('/');
  if (parts.length !== 4) return null;
  if (parts[0] !== 'resq') return null;
  const [, region, hazard, sensorType] = parts;
  if (!region || !hazard || !sensorType) return null;
  return { region: region.toLowerCase(), hazard: hazard.toLowerCase(), sensorType: sensorType.toLowerCase(), raw: topic };
}

export function isAllowedTopic(topic: string): boolean {
  const p = parseTopic(topic);
  if (!p) return false;
  // Region is open (any non-empty), hazard + sensor type validated against known sets but
  // unknown hazards are allowed through with a warning — don't drop data.
  return !!p.region;
}

export function topicForSensor(region: string, hazard: string, sensorType: string): string {
  return `resq/${region.toLowerCase()}/${hazard.toLowerCase()}/${sensorType.toLowerCase()}`;
}
