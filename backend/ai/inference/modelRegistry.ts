/**
 * Model registry — labels every prediction with mode + model metadata.
 * Modes: DEMO | RESEARCH | VALIDATED | LIVE  (from config.aiMode)
 */
import { config } from '../../config.ts';

export type AiMode = 'DEMO' | 'RESEARCH' | 'VALIDATED' | 'LIVE';

export interface ModelMeta {
  name: string;
  version: string;
  hazard: string; // flood | landslide | wildfire | earthquake | anomaly | ensemble
  mode: AiMode;
  trainedAt: string;
  description: string;
}

const REGISTRY: ModelMeta[] = [
  { name: 'resq-flood-rf', version: '0.1.0-demo', hazard: 'flood', mode: config.aiMode as AiMode, trainedAt: new Date().toISOString(), description: 'Threshold + logistic proxy for flood severity (synthetic data)' },
  { name: 'resq-landslide-rf', version: '0.1.0-demo', hazard: 'landslide', mode: config.aiMode as AiMode, trainedAt: new Date().toISOString(), description: 'Soil saturation + tilt threshold proxy' },
  { name: 'resq-anomaly-zscore', version: '0.1.0-demo', hazard: 'anomaly', mode: config.aiMode as AiMode, trainedAt: new Date().toISOString(), description: 'Z-score + IsolationForest-lite anomaly detector' },
  { name: 'resq-ensemble', version: '0.1.0-demo', hazard: 'ensemble', mode: config.aiMode as AiMode, trainedAt: new Date().toISOString(), description: 'Weighted ensemble of hazard models' },
];

export function getRegistry(): ModelMeta[] { return REGISTRY; }
export function getModel(hazard: string): ModelMeta | undefined { return REGISTRY.find((m) => m.hazard === hazard); }
export function getEnsembleMeta(): ModelMeta { return REGISTRY.find((m) => m.hazard === 'ensemble')!; }
