/**
 * Minimal typed API client for RESQ-AI.
 * No secrets — browser only calls same-origin /api via Vite proxy.
 * Every method returns parsed JSON or throws with the server's error message.
 */
export type ApiOk<T> = { success: true } & T;
export type HealthResponse = {
  status: string;
  system: string;
  version: string;
  timestamp: string;
  activeCapabilities: string[];
  subsystems?: Record<string, 'HEALTHY' | 'DEGRADED' | 'FAILED' | 'UNKNOWN'>;
  uptimeMs?: number;
};

const BASE = ''; // same-origin; Vite proxies /api → backend in dev

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (body as any)?.error || (body as any)?.message || res.statusText;
    throw new Error(msg);
  }
  return body as T;
}

export const api = {
  health: () => request<HealthResponse>('/api/health'),

  // Generic pass-throughs used by new features wiring into GISCommandMap etc.
  get<T = unknown>(path: string) {
    return request<T>(path);
  },
  post<T = unknown>(path: string, body?: unknown) {
    return request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
  },
  put<T = unknown>(path: string, body?: unknown) {
    return request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
  },
};

export type WsEvent =
  | { type: 'alert_created'; payload: unknown }
  | { type: 'alert_authorized'; payload: unknown }
  | { type: 'alert_dispatched'; payload: unknown }
  | { type: 'telemetry'; payload: unknown }
  | { type: 'sensor_anomaly'; payload: unknown }
  | { type: 'sos_created'; payload: unknown };

export function connectWs(onEvent: (ev: WsEvent) => void): WebSocket {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${proto}//${location.host}/ws`);
  ws.onmessage = (e) => {
    try {
      const parsed = JSON.parse(e.data) as WsEvent;
      onEvent(parsed);
    } catch {
      // ignore non-JSON frames
    }
  };
  return ws;
}
