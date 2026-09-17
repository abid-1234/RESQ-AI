/**
 * In-memory stores seeded from frontend mock data.
 * Used when MongoDB is absent (demo/CI). Shares shape with Mongoose documents
 * so service layer code does not branch on storage backend.
 * NOTE: No import of frontend code at runtime — snapshot copied at P0.
 */
import { randomUUID } from 'crypto';

export interface SensorReading {
  id: string;
  sensorId: string;
  value: number;
  unit: string;
  secondaryValue?: number;
  secondaryUnit?: string;
  lat: number;
  lng: number;
  timestamp: string; // ISO 8601 from sensor
  receivedAt: string; // server ingest time
  gatewayId?: string;
  authStatus?: 'authenticated' | 'unauthenticated' | 'unknown';
  anomalyDetected?: boolean;
  anomalyConfidence?: number;
}

export interface SensorMeta {
  sensorId: string;
  nodeCode: string;
  type: string;
  lat: number;
  lng: number;
  gatewayId: string;
  allowedUnits: string[];
}

// Seeded sensor registry — mirrors INITIAL_SENSORS in frontend/src/data/mockDistrictData.ts
export const sensorRegistry: Map<string, SensorMeta> = new Map([
  ['sns-01', { sensorId: 'sns-01', nodeCode: 'NODE-WTR-SEC4-01', type: 'WATER_LEVEL', lat: 17.374, lng: 78.4775, gatewayId: 'gw-01', allowedUnits: ['meters (gauge)', 'm3/s velocity'] }],
  ['sns-02', { sensorId: 'sns-02', nodeCode: 'NODE-RAIN-HILL-02', type: 'RAINFALL', lat: 17.401, lng: 78.473, gatewayId: 'gw-03', allowedUnits: ['mm/hour (Extreme)', 'mm cumulative 24h'] }],
  ['sns-03', { sensorId: 'sns-03', nodeCode: 'NODE-SOIL-HILL-03', type: 'SOIL_MOISTURE', lat: 17.3995, lng: 78.4715, gatewayId: 'gw-03', allowedUnits: ['% saturation', 'degrees tilt shift'] }],
  ['sns-04', { sensorId: 'sns-04', nodeCode: 'NODE-SEIS-CTR-04', type: 'SEISMIC_VIBRATION', lat: 17.39, lng: 78.486, gatewayId: 'gw-02', allowedUnits: ['g Peak Ground Acceleration (PGA)', 'Hz frequency band'] }],
  ['sns-05', { sensorId: 'sns-05', nodeCode: 'NODE-WTR-SEC2-05', type: 'WATER_LEVEL', lat: 17.387, lng: 78.484, gatewayId: 'gw-02', allowedUnits: ['meters (Moderate)'] }],
  ['sns-06', { sensorId: 'sns-06', nodeCode: 'NODE-BARO-IND-06', type: 'WEATHER_BARO', lat: 17.375, lng: 78.501, gatewayId: 'gw-04', allowedUnits: ['hPa (Pressure Drop)', 'km/h Gusts'] }],
]);

export const telemetryStore: SensorReading[] = [];
export const MAX_TELEMETRY = 5000;

/** Replay protection: sensorId → Set of seen ISO timestamps (windowed by telemetry replayWindowMs). */
export const seenTimestamps: Map<string, Set<string>> = new Map();

/** Per-sensor rate limiting: sensorId → timestamps (ms) in current minute window */
export const rateWindow: Map<string, number[]> = new Map();

export function pushReading(r: SensorReading) {
  telemetryStore.push(r);
  if (telemetryStore.length > MAX_TELEMETRY) telemetryStore.shift();
}

export function registerSensor(meta: SensorMeta) {
  sensorRegistry.set(meta.sensorId, meta);
}

export function newId(prefix = 'tel'): string {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}
