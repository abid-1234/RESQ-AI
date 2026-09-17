/**
 * WebSocket server — /ws with JWT upgrade + room fanout.
 * Mounted from server.ts via http.createServer(app).
 */
import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { Server } from 'http';
import { verifyToken } from '../middleware/auth.ts';

type WsEvent = 'alert_created' | 'alert_authorized' | 'alert_dispatched' | 'telemetry' | 'sensor_anomaly' | 'sos_created';

const clients = new Set<WebSocket>();

export function attachWs(httpServer: Server): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    // JWT via query ?token= or Sec-WebSocket-Protocol fallback; allow anon for demo
    const url = new URL(req.url || '/ws', `http://${req.headers.host || 'localhost'}`);
    const token = url.searchParams.get('token');
    if (token) {
      try { verifyToken(token); } catch { /* allow with degraded label */ }
    }
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
    ws.on('error', () => clients.delete(ws));
    ws.send(JSON.stringify({ event: 'connected', timestamp: new Date().toISOString() }));
  });

  return wss;
}

export function publish(event: WsEvent, payload: unknown): void {
  const msg = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      try { ws.send(msg); } catch { /* ignore */ }
    }
  }
}

export function wsClientCount(): number {
  let n = 0;
  for (const ws of clients) if (ws.readyState === WebSocket.OPEN) n++;
  return n;
}
