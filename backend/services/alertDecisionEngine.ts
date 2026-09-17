/**
 * Alert decision engine — maps {probability, severity, exposure, tti, confidence, policy} → decision.
 * Also generates dedup IDs RESQ-EVT-YYYY-NNNNNN.
 */

export type AlertDecision = 'NO_ALERT' | 'ADVISORY' | 'WATCH' | 'WARNING' | 'EVACUATE';

export interface DecisionInput {
  probability: number; // 0..1
  severity: number; // 0..1
  exposure: number; // people at risk
  ttiMinutes?: number;
  confidence: number; // 0..1
  policy?: 'conservative' | 'standard' | 'aggressive';
}

let counter = 0;

export function nextEventId(): string {
  const y = new Date().getFullYear();
  counter = (counter + 1) % 100000;
  return `RESQ-EVT-${y}-${String(counter).padStart(6, '0')}`;
}

export function decide(input: DecisionInput): { decision: AlertDecision; score: number; reason: string } {
  const policyBoost = input.policy === 'aggressive' ? 0.15 : input.policy === 'conservative' ? -0.10 : 0;
  const ttiFactor = input.ttiMinutes !== undefined && input.ttiMinutes < 60 ? 0.15 : input.ttiMinutes !== undefined && input.ttiMinutes < 180 ? 0.05 : 0;
  const score = Math.max(0, Math.min(1, input.probability * 0.30 + input.severity * 0.40 + input.confidence * 0.20 + ttiFactor + policyBoost));
  let decision: AlertDecision = 'NO_ALERT';
  let reason = `score=${score.toFixed(2)} (p=${input.probability} s=${input.severity} conf=${input.confidence} exposure=${input.exposure})`;
  if (score >= 0.75 && input.exposure >= 100) { decision = 'EVACUATE'; reason += ' → EVACUATE (high score + exposure)'; }
  else if (score >= 0.60) { decision = 'WARNING'; reason += ' → WARNING'; }
  else if (score >= 0.40) { decision = 'WATCH'; reason += ' → WATCH'; }
  else if (score >= 0.20) { decision = 'ADVISORY'; reason += ' → ADVISORY'; }
  return { decision, score: +score.toFixed(3), reason };
}
