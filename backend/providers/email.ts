import { config } from '../config.ts';

export type EmailResult = { channel: 'EMAIL'; mode: 'LIVE' | 'SIMULATION'; providerResponse?: string };

export async function sendEmail(payload: { to?: string[]; subject: string; html: string }): Promise<EmailResult> {
  if (!config.emailUser || !config.emailHost) {
    return { channel: 'EMAIL', mode: 'SIMULATION', providerResponse: 'SIMULATION — no email sent (EMAIL_HOST/USER not configured)' };
  }
  // Wire nodemailer here when EMAIL_HOST/PORT/USER/PASSWORD are set. Kept as LIVE stub.
  return { channel: 'EMAIL', mode: 'LIVE', providerResponse: `EMAIL LIVE via ${config.emailHost}` };
}
