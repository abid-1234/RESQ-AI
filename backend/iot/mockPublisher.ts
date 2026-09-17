/**
 * Mock sensor publisher — emits synthetic telemetry on the in-process mock bus.
 * Used for demo/full_disaster simulation when no real MQTT broker is present.
 */
import { publishMock } from './mqttClient.ts';
import { topicForSensor } from './topicRouter.ts';

export interface MockPublishOpts {
  sensorId: string;
  region: string;
  hazard: string;
  sensorType: string; // e.g. water_level
  value: number;
  unit: string;
  latitude: number;
  longitude: number;
  gatewayId?: string;
}

export function mockPublish(opts: MockPublishOpts) {
  const topic = topicForSensor(opts.region, opts.hazard, opts.sensorType);
  const payload = {
    sensorId: opts.sensorId,
    timestamp: new Date().toISOString(),
    latitude: opts.latitude,
    longitude: opts.longitude,
    value: opts.value,
    unit: opts.unit,
    gatewayId: opts.gatewayId,
    authStatus: 'authenticated' as const,
  };
  publishMock(topic, payload);
  return { topic, payload };
}

/** Burst helper for demo scripts */
export function mockBurst(count = 10, delayMs = 200): Promise<void> {
  return new Promise((resolve) => {
    let i = 0;
    const iv = setInterval(() => {
      mockPublish({
        sensorId: 'sns-01',
        region: 'hyderabad',
        hazard: 'flood',
        sensorType: 'water_level',
        value: 3.5 + Math.random() * 1.8,
        unit: 'meters (gauge)',
        latitude: 17.374,
        longitude: 78.4775,
        gatewayId: 'gw-01',
      });
      if (++i >= count) { clearInterval(iv); resolve(); }
    }, delayMs);
  });
}
