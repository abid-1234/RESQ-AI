/**
 * CAP 1.2 builder — Common Alerting Protocol XML (OASIS CAP 1.2).
 * Generates valid CAP XML for interoperability; validated structurally, not XSD-executed at runtime.
 */

export interface CapInfo {
  language: string; // en, hi, te, ta, mr, bn
  category: string; // Geo, Met, Safety, Rescue, etc.
  event: string;
  urgency: 'Immediate' | 'Expected' | 'Future' | 'Past' | 'Unknown';
  severity: 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown';
  certainty: 'Observed' | 'Likely' | 'Possible' | 'Unlikely' | 'Unknown';
  headline: string;
  description: string;
  instruction: string;
  areaDesc: string;
  polygon?: string; // space-separated lat,lon pairs (CAP requires lat,lon)
  circle?: string; // "lat,lon radiusKm"
}

export interface CapAlert {
  identifier: string; // RESQ-EVT-YYYY-NNNNNN pattern
  sender: string; // e.g. resq-ai@district.gov.in
  sent: string; // ISO 8601
  status: 'Actual' | 'Exercise' | 'System' | 'Test' | 'Draft';
  msgType: 'Alert' | 'Update' | 'Cancel' | 'Ack' | 'Error';
  scope: 'Public' | 'Restricted' | 'Private';
  info: CapInfo[];
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export function buildCapXml(alert: CapAlert): string {
  const infos = alert.info.map((i) => `  <info>
    <language>${esc(i.language)}</language>
    <category>${esc(i.category)}</category>
    <event>${esc(i.event)}</event>
    <urgency>${esc(i.urgency)}</urgency>
    <severity>${esc(i.severity)}</severity>
    <certainty>${esc(i.certainty)}</certainty>
    <headline>${esc(i.headline)}</headline>
    <description>${esc(i.description)}</description>
    <instruction>${esc(i.instruction)}</instruction>
    <area>
      <areaDesc>${esc(i.areaDesc)}</areaDesc>
      ${i.polygon ? `<polygon>${esc(i.polygon)}</polygon>` : ''}
      ${i.circle ? `<circle>${esc(i.circle)}</circle>` : ''}
    </area>
  </info>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>${esc(alert.identifier)}</identifier>
  <sender>${esc(alert.sender)}</sender>
  <sent>${esc(alert.sent)}</sent>
  <status>${esc(alert.status)}</status>
  <msgType>${esc(alert.msgType)}</msgType>
  <scope>${esc(alert.scope)}</scope>
${infos}
</alert>`;
}

export function validateCapAlert(a: CapAlert): string | null {
  if (!a.identifier || !a.sender || !a.sent || !a.status || !a.msgType || !a.scope) return 'Missing required CAP header field';
  if (!a.info || a.info.length === 0) return 'CAP info array must be non-empty';
  for (const i of a.info) {
    if (!i.language || !i.event || !i.headline) return 'CAP info missing language/event/headline';
  }
  return null;
}
