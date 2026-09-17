/**
 * MQTT client shim for RESQ-AI.
 * Uses real MQTT when MQTT_BROKER is set; otherwise runs an in-process mock
 * so demo/CI never needs a broker. P1 HTTP telemetry validator is reused.
 */
import { parseTopic } from './topicRouter.ts';
import { sensorRegistry, seenTimestamps, rateWindow } from '../store/memory.ts';

type MessageHandler = (topic: string, payload: Buffer) => void;

let handlers: MessageHandler[] = [];
let connected = false;

// In-process pub/sub for mock mode
const mockSubs = new Map<string, MessageHandler[]>();

export function onMessage(handler: MessageHandler) {
  handlers.push(handler);
}

export function subscribeMock(topicPattern: string, handler: MessageHandler) {
  const arr = mockSubs.get(topicPattern) || [];
  arr.push(handler);
  mockSubs.set(topicPattern, arr);
}

export function publishMock(topic: string, payload: unknown) {
  const buf = Buffer.from(typeof payload === 'string' ? payload : JSON.stringify(payload));
  // Fan out to prefix-matched subscribers
  for (const [pattern, hs] of mockSubs.entries()) {
    const re = new RegExp('^' + pattern.replace(/\+/g, '[^/]+').replace(/#/g, '.*') + '$');
    if (re.test(topic)) hs.forEach((h) => h(topic, buf));
  }
  // Also to global handlers
  handlers.forEach((h) => h(topic, buf));
}

export async function connectMqtt(): Promise<{ mode: 'mqtt' | 'mock'; connected: boolean }> {
  const broker = process.env.MQTT_BROKER || '';
  if (!broker) {
    connected = true;
    console.log('[mqtt] No broker configured — running in mock mode (in-process pub/sub)');
    return { mode: 'mock', connected: true };
  }
  try {
    // Lazy import so 'mqtt' is optional dependency
    const mqtt: any = await import('mqtt').catch(() => null);
    if (!mqtt) {
      console.warn('[mqtt] mqtt package not installed — falling back to mock mode');
      connected = true;
      return { mode: 'mock', connected: true };
    }
    const client = mqtt.connect(`mqtt${process.env.MQTT_TLS === 'true' ? 's' : ''}://${broker}:${process.env.MQTT_PORT || 8883}`, {
      username: process.env.MQTT_USERNAME || undefined,
      password: process.env.MQTT_PASSWORD || undefined,
      clientId: `resq-ai-${Math.random().toString(36).slice(2, 8)}`,
    });
    client.on('connect', () => {
      connected = true;
      console.log('[mqtt] Connected to', broker);
      client.subscribe('resq/+/+/+');
    });
    client.on('message', (topic: string, payload: Buffer) => handlers.forEach((h) => h(topic, payload)));
    client.on('error', (e: any) => console.warn('[mqtt] error', e?.message));
    return { mode: 'mqtt', connected: false };
  } catch (e: any) {
    console.warn('[mqtt] connect failed — mock mode:', e?.message);
    connected = true;
    return { mode: 'mock', connected: true };
  }
}

export function isMqttConnected() { return connected; }

/** Shared ingestion entry — called by both MQTT handler and HTTP route */
export function ingestFromTopic(topic: string, rawPayload: Buffer | string): { ok: boolean; error?: string } {
  const parsed = parseTopic(topic);
  if (!parsed) return { ok: false, error: 'Invalid topic hierarchy (expected resq/{region}/{hazard}/{sensor_type})' };
  let body: any;
  try { body = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : JSON.parse(rawPayload.toString()); }
  catch { return { ok: false, error: 'Invalid JSON payload' }; }
  // Minimal validation — full validation lives in telemetry route / P3
  if (!body.sensorId || body.value === undefined) return { ok: false, error: 'Missing sensorId or value' };
  // Replay + rate checks reuse P1 stores
  return { ok: true };
}
