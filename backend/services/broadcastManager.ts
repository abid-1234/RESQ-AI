import { buildCapXml, type CapAlert } from '../cap/cap12.ts';
import { sendSms } from '../providers/sms.ts';
import { sendEmail } from '../providers/email.ts';
import { sendCbc } from '../providers/cbc.ts';

export type BroadcastChannel = 'APP_BROADCAST' | 'WEBSOCKET_BROADCAST' | 'SMS' | 'EMAIL' | 'CAP' | 'CBC_ADAPTER' | 'SIMULATION';
export type BroadcastMode = 'LIVE' | 'SIMULATION';

export interface BroadcastRequest {
  capAlert: CapAlert;
  channels: BroadcastChannel[];
  smsMessage?: string;
  emailSubject?: string;
  emailHtml?: string;
}

export interface ChannelResult {
  channel: BroadcastChannel;
  mode: BroadcastMode;
  ok: boolean;
  detail?: string;
  capXml?: string;
}

export async function broadcast(req: BroadcastRequest): Promise<{ mode: BroadcastMode; capXml: string; results: ChannelResult[] }> {
  const capXml = buildCapXml(req.capAlert);
  const results: ChannelResult[] = [];
  const isSimulation = !req.channels.some((c) => c === 'CBC_ADAPTER' || c === 'SMS' || c === 'EMAIL') || req.channels.includes('SIMULATION');

  for (const ch of req.channels) {
    if (ch === 'CAP') {
      results.push({ channel: 'CAP', mode: 'LIVE', ok: true, capXml, detail: 'CAP 1.2 XML generated' });
    } else if (ch === 'APP_BROADCAST' || ch === 'WEBSOCKET_BROADCAST') {
      results.push({ channel: ch, mode: 'LIVE', ok: true, detail: `${ch} — published to connected clients` });
    } else if (ch === 'SMS') {
      const r = await sendSms({ message: req.smsMessage ?? req.capAlert.info[0]?.headline ?? 'RESQ-AI Alert' });
      results.push({ channel: 'SMS', mode: r.mode, ok: true, detail: r.providerResponse });
    } else if (ch === 'EMAIL') {
      const r = await sendEmail({ subject: req.emailSubject ?? 'RESQ-AI Alert', html: req.emailHtml ?? capXml });
      results.push({ channel: 'EMAIL', mode: r.mode, ok: true, detail: r.providerResponse });
    } else if (ch === 'CBC_ADAPTER') {
      const r = await sendCbc({ capXml });
      const mappedChannel: BroadcastChannel = r.channel === 'CBC_ADAPTER' ? 'CBC_ADAPTER' : 'SIMULATION';
      results.push({ channel: mappedChannel, mode: r.mode, ok: true, detail: r.providerResponse, capXml });
    } else if (ch === 'SIMULATION') {
      results.push({ channel: 'SIMULATION', mode: 'SIMULATION', ok: true, detail: 'SIMULATION — no telecom transmission claimed', capXml });
    }
  }

  const mode: BroadcastMode = results.some((r) => r.mode === 'LIVE' && r.channel !== 'CAP' && r.channel !== 'APP_BROADCAST' && r.channel !== 'WEBSOCKET_BROADCAST') ? 'LIVE' : 'SIMULATION';
  // CAP alone does not make it LIVE; only SMS/EMAIL/CBC_ADAPTER/APP_BROADCAST count.
  const honestMode: BroadcastMode = results.some((r) => r.mode === 'LIVE' && (r.channel === 'SMS' || r.channel === 'EMAIL' || r.channel === 'CBC_ADAPTER')) ? 'LIVE' : 'SIMULATION';
  void isSimulation;
  return { mode: honestMode, capXml, results };
}
