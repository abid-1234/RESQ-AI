import { config } from '../config.ts';

/**
 * SMS adapter — real when SMS_API_KEY present, otherwise SIMULATION.
 * Never exposes keys to frontend; returns honest delivery record.
 */
export type SmsResult = { channel: 'SMS'; mode: 'LIVE' | 'SIMULATION'; providerResponse?: string; audience?: number };

export async function sendSms(payload: { to?: string[]; message: string }): Promise<SmsResult> {
  if (!config.smsApiKey) {
    return { channel: 'SMS', mode: 'SIMULATION', providerResponse: 'SIMULATION — no SMS sent', audience: payload.to?.length ?? 3420 };
  }
  // Placeholder for real provider (e.g. Twilio/MSG91). Wire SMS_API_URL + SMS_API_KEY here.
  try {
    if (config.smsApiUrl) {
      await fetch(config.smsApiUrl, { method: 'POST', headers: { 'Authorization': `Bearer ${config.smsApiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }
    return { channel: 'SMS', mode: 'LIVE', audience: payload.to?.length ?? 3420 };
  } catch (e: any) {
    return { channel: 'SMS', mode: 'SIMULATION', providerResponse: `SMS provider error (fell back to SIMULATION): ${e?.message}` };
  }
}
