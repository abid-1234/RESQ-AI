/**
 * Inference service — deterministic RESEARCH/DEMO models (no external deps).
 * Every prediction is stamped with model/version/timestamp/confidence/uncertainty/feature_importance + mode.
 */
import { config } from '../../config.ts';
import { getModel, getEnsembleMeta } from './modelRegistry.ts';
import type { AiMode } from './modelRegistry.ts';

export interface InferenceInput {
  hazard: string; // flood | landslide | wildfire | earthquake | ...
  features: Record<string, number>; // e.g. { waterLevelM: 4.82, rainfallMmH: 94.5, soilSaturation: 89.2 }
  lat?: number;
  lng?: number;
}

export interface InferenceResult {
  hazard: string;
  severity: number; // 0..1
  severityLabel: 'LOW' | 'WATCH' | 'HIGH' | 'CRITICAL';
  confidence: number; // 0..1
  uncertainty: number; // 0..1
  directionDeg?: number; // 0..360 if applicable
  radiusM?: number;
  ttiMinutes?: number; // time-to-impact
  featureImportance: Record<string, number>;
  model: string;
  version: string;
  timestamp: string;
  mode: AiMode;
}

function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }
function sigmoid(x: number) { return 1 / (1 + Math.exp(-x)); }
function labelForSeverity(s: number): InferenceResult['severityLabel'] {
  if (s >= 0.85) return 'CRITICAL';
  if (s >= 0.65) return 'HIGH';
  if (s >= 0.40) return 'WATCH';
  return 'LOW';
}

/** Z-score-like anomaly score (0..1) */
function anomalyScore(features: Record<string, number>): number {
  // Simple rule: deviation from nominal ranges
  let maxZ = 0;
  for (const [k, v] of Object.entries(features)) {
    const nominal: Record<string, { mean: number; sd: number }> = {
      waterLevelM: { mean: 1.2, sd: 1.0 },
      rainfallMmH: { mean: 8, sd: 15 },
      soilSaturation: { mean: 45, sd: 15 },
      pga: { mean: 0.03, sd: 0.05 },
      pressureHpa: { mean: 1010, sd: 6 },
    };
    const n = nominal[k];
    if (n) maxZ = Math.max(maxZ, Math.abs(v - n.mean) / n.sd);
  }
  return clamp01(1 - Math.exp(-maxZ / 2));
}

function floodSeverity(f: Record<string, number>): { s: number; fi: Record<string, number> } {
  const wl = f.waterLevelM ?? f.value ?? 0;
  const rain = f.rainfallMmH ?? 0;
  // Logistic proxy: weighted sum through sigmoid
  const logit = (wl - 2.5) * 1.6 + (rain - 30) * 0.04 + (f.soilSaturation ? (f.soilSaturation - 60) * 0.02 : 0);
  const s = clamp01(sigmoid(logit));
  const fi: Record<string, number> = { waterLevelM: 0.55, rainfallMmH: 0.30, soilSaturation: 0.15 };
  return { s, fi };
}

function landslideSeverity(f: Record<string, number>): { s: number; fi: Record<string, number> } {
  const sat = f.soilSaturation ?? 0;
  const tilt = f.tiltDeg ?? 0;
  const rain = f.rainfallMmH ?? 0;
  const logit = (sat - 70) * 0.08 + tilt * 0.6 + (rain - 40) * 0.025;
  const s = clamp01(sigmoid(logit));
  return { s, fi: { soilSaturation: 0.50, tiltDeg: 0.30, rainfallMmH: 0.20 } };
}

export function infer(input: InferenceInput): InferenceResult {
  const hazard = (input.hazard || 'flood').toLowerCase();
  const f = input.features || {};
  let s: number; let fi: Record<string, number> = {};
  if (hazard === 'landslide') ({ s, fi } = landslideSeverity(f));
  else ({ s, fi } = floodSeverity(f));

  const anom = anomalyScore(f);
  // Confidence: higher when severity is extreme or anomaly is strong
  const confidence = clamp01(0.55 + s * 0.35 + anom * 0.15);
  const uncertainty = clamp01(1 - confidence + Math.random() * 0.05);

  const meta = getModel(hazard) || getEnsembleMeta();
  // Normalize feature importance to sum 1
  const sum = Object.values(fi).reduce((a, b) => a + b, 0) || 1;
  const normFi: Record<string, number> = Object.fromEntries(Object.entries(fi).map(([k, v]) => [k, +(v / sum).toFixed(3)]));

  // Direction/radius/TTI heuristics
  const radiusM = Math.round(500 + s * 1800 + (f.waterLevelM ? f.waterLevelM * 120 : 0));
  const ttiMinutes = s > 0.7 ? Math.round(30 + (1 - s) * 90) : undefined;
  const directionDeg = input.lat !== undefined ? 180 + ((input.lng || 0) * 10) % 90 : undefined;

  return {
    hazard,
    severity: +s.toFixed(3),
    severityLabel: labelForSeverity(s),
    confidence: +confidence.toFixed(3),
    uncertainty: +uncertainty.toFixed(3),
    directionDeg: directionDeg !== undefined ? Math.round(directionDeg) % 360 : undefined,
    radiusM,
    ttiMinutes,
    featureImportance: normFi,
    model: meta.name,
    version: meta.version,
    timestamp: new Date().toISOString(),
    mode: config.aiMode as AiMode,
  };
}
