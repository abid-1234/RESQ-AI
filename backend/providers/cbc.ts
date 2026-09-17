import { config } from '../config.ts';

/**
 * Cell Broadcast (CBC) adapter interface.
 * - mock_cbc (default): SIMULATION/test endpoint — never claims telecom transmission.
 * - production: forwards to CBC_API_URL with CBC_API_KEY (operator CBC).
 * UI must distinguish CBC_ADAPTER vs SIMULATION.
 */
export type CbcResult = { channel: 'CBC_ADAPTER' | 'SIMULATION'; mode: 'LIVE' | 'SIMULATION'; providerResponse?: string };

export async function sendCbc(payload: { capXml: string; areaDescription?: string }): Promise<CbcResult> {
  if (config.cbcAdapter === 'production' && config.cbcApiUrl && config.cbcApiKey) {
    try {
      await fetch(config.cbcApiUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${config.cbcApiKey}`, 'Content-Type': 'application/xml' },
        body: payload.capXml,
      });
      return { channel: 'CBC_ADAPTER', mode: 'LIVE', providerResponse: `CBC LIVE via ${config.cbcApiUrl}` };
    } catch (e: any) {
      return { channel: 'CBC_ADAPTER', mode: 'LIVE', providerResponse: `CBC production error: ${e?.message}` };
    }
  }
  return { channel: 'SIMULATION', mode: 'SIMULATION', providerResponse: 'SIMULATION — CBC test endpoint (no telecom transmission)' };
}

export function cbcTestPayload() {
  return {
    adapter: config.cbcAdapter,
    cbcApiUrl: config.cbcApiUrl ? '[configured]' : null,
    mode: config.cbcAdapter === 'production' && config.cbcApiUrl ? 'LIVE' : 'SIMULATION' as const,
    note: config.cbcAdapter === 'production' ? 'CBC adapter production mode' : 'SIMULATION — no telecom transmission claimed',
  };
}
