import React, { useState, useEffect } from 'react';
import { Building, HazardType, Shelter, SensorNode } from '../../types';
import { SimulationParams, runDistrictRiskAnalysis, RiskAnalysisResult } from '../../services/riskEngine';
import {
  Cpu, Play, Pause, RotateCcw, FastForward, Sliders, ShieldAlert, Waves, Wind, Activity, AlertTriangle, Layers, CheckCircle2, Sparkles,
} from 'lucide-react';

interface SimulationLabProps {
  buildings: Building[]; shelters: Shelter[]; sensors: SensorNode[];
  onApplySimulation: (params: SimulationParams, results: RiskAnalysisResult) => void;
  onBroadcastSimAlert: () => void;
}

export const SimulationLab: React.FC<SimulationLabProps> = ({ buildings, shelters, sensors, onApplySimulation, onBroadcastSimAlert }) => {
  void sensors;
  const [selectedHazard, setSelectedHazard] = useState<HazardType>('FLOOD');
  const [params, setParams] = useState<SimulationParams>({
    hazardType: 'FLOOD', rainfallIntensityMmH: 94.5, riverGaugeHeightM: 4.82, groundAccelerationG: 0.08,
    soilSaturationPercent: 89.2, windSpeedKmh: 68, evacuationComplianceRate: 72, activeRoadClosures: 2,
  });
  const [currentStep, setCurrentStep] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const analysis = runDistrictRiskAnalysis(buildings, shelters, params);

  useEffect(() => {
    let timer: any = null;
    if (isPlaying) timer = setInterval(() => setCurrentStep(prev => { if (prev >= 6) { setIsPlaying(false); return 6; } return prev + 1; }), 3200);
    return () => clearInterval(timer);
  }, [isPlaying]);

  useEffect(() => { onApplySimulation(params, analysis); }, [params]);

  const handleScenarioChange = (hazard: HazardType) => {
    setSelectedHazard(hazard);
    const next: Record<string, SimulationParams> = {
      FLOOD: { hazardType: 'FLOOD', rainfallIntensityMmH: 95, riverGaugeHeightM: 4.85, groundAccelerationG: 0.02, soilSaturationPercent: 88, windSpeedKmh: 45, evacuationComplianceRate: 75, activeRoadClosures: 2 },
      LANDSLIDE: { hazardType: 'LANDSLIDE', rainfallIntensityMmH: 120, riverGaugeHeightM: 2.4, groundAccelerationG: 0.05, soilSaturationPercent: 96, windSpeedKmh: 35, evacuationComplianceRate: 60, activeRoadClosures: 3 },
      CYCLONE: { hazardType: 'CYCLONE', rainfallIntensityMmH: 80, riverGaugeHeightM: 3.8, groundAccelerationG: 0.01, soilSaturationPercent: 70, windSpeedKmh: 165, evacuationComplianceRate: 85, activeRoadClosures: 4 },
      SEISMIC_ANOMALY: { hazardType: 'SEISMIC_ANOMALY', rainfallIntensityMmH: 10, riverGaugeHeightM: 1.5, groundAccelerationG: 0.38, soilSaturationPercent: 40, windSpeedKmh: 15, evacuationComplianceRate: 50, activeRoadClosures: 5 },
      DAM_BREACH: { hazardType: 'DAM_BREACH', rainfallIntensityMmH: 130, riverGaugeHeightM: 6.8, groundAccelerationG: 0.04, soilSaturationPercent: 95, windSpeedKmh: 50, evacuationComplianceRate: 40, activeRoadClosures: 6 },
    };
    setParams(next[hazard]);
    setCurrentStep(1);
  };

  const simulationSteps = [
    { id: 0, title: 'Normal Baseline Telemetry', desc: 'River gauge within safe limit (2.1 m), rainfall low (<15 mm/h). All systems nominal.' },
    { id: 1, title: 'Sensor Telemetry Anomaly Detected', desc: 'Riverfront and slope sensors exceed threshold — precipitation and water rise flagged.' },
    { id: 2, title: 'Gateway Sync & Risk Index', desc: 'LoRa / cellular gateways ingest packets; RESQ-AI risk score escalates to critical.' },
    { id: 3, title: 'Red-Zone Polygon Generated', desc: 'GIS overlay draws 1.4 km hazard radius intersecting 482 buildings in Sector 4.' },
    { id: 4, title: 'Population & Vulnerability', desc: '8,420 exposed; 1,840 vulnerable (children / elderly) prioritised for evacuation.' },
    { id: 5, title: 'Corridor Routing & Shelter Allocation', desc: 'North Overbridge as green corridor; Highland and Stadium shelters activated.' },
    { id: 6, title: 'SACHET Broadcast & Field Deployment', desc: 'CAP warnings to 3,420 households; NDRF / SDRF teams dispatched.' },
  ];

  const SCENARIOS: { id: HazardType; label: string; icon: any; hint: string }[] = [
    { id: 'FLOOD', label: 'River Flood', icon: Waves, hint: 'Catchment' },
    { id: 'LANDSLIDE', label: 'Landslide', icon: AlertTriangle, hint: 'Slope slip' },
    { id: 'CYCLONE', label: 'Cyclone Surge', icon: Wind, hint: 'Coastal' },
    { id: 'SEISMIC_ANOMALY', label: 'Seismic Motion', icon: Activity, hint: 'Ground' },
    { id: 'DAM_BREACH', label: 'Dam Breach', icon: ShieldAlert, hint: 'Embankment' },
  ];

  const SliderRow: React.FC<{ label: string; value: string; children: React.ReactNode }> = ({ label, value, children }) => (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12px] font-semibold text-[var(--ink-2)]">{label}</span>
        <span className="font-mono-code text-[12px] font-bold text-[var(--ink)]">{value}</span>
      </div>
      {children}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1600px] space-y-4">
      {/* Header — light, no gradient */}
      <div className="card flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent)] text-white shadow-sm">
            <Cpu className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-[15px] font-extrabold tracking-tight text-[var(--ink)]">Multi-Hazard Simulation Lab</h2>
            <p className="text-[12px] leading-relaxed text-[var(--ink-3)]">
              Sensor anomaly → risk index → red-zone → exposure → evacuation → shelter → warning
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--bg-subtle)] p-1">
          <button data-cursor="hover" onClick={() => { setCurrentStep(0); setIsPlaying(false); }} className="grid h-8 w-8 place-items-center rounded-full bg-white border border-[var(--line)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors" title="Reset">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            data-cursor="hover"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-semibold transition-colors active:scale-[.985] ${isPlaying ? "bg-[var(--accent)] text-white" : "bg-white border border-[var(--line)] text-[var(--ink)] shadow-sm"}`}
          >
            {isPlaying ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Auto run</>}
          </button>
          <button data-cursor="hover" onClick={() => setCurrentStep((p) => Math.min(6, p + 1))} className="grid h-8 w-8 place-items-center rounded-full bg-white border border-[var(--line)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors" title="Step forward">
            <FastForward className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scenarios */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {SCENARIOS.map((sc) => {
          const Icon = sc.icon;
          const active = selectedHazard === sc.id;
          return (
            <button
              key={sc.id}
              data-cursor="hover"
              onClick={() => handleScenarioChange(sc.id)}
              className={`flex flex-col gap-2 rounded-xl border p-3 text-left transition-all active:scale-[.985] ${active ? "bg-[var(--accent)] border-[var(--accent)] text-white shadow-sm" : "bg-white border-[var(--line)] hover:border-[var(--line-strong)] hover:shadow-sm"}`}
            >
              <span className={`grid h-8 w-8 place-items-center rounded-lg border ${active ? "bg-white/15 border-white/20 text-white" : "bg-[var(--bg-subtle)] border-[var(--line)] text-[var(--ink-2)]"}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span>
                <span className={`block text-[12px] font-bold leading-none ${active ? "text-white" : "text-[var(--ink)]"}`}>{sc.label}</span>
                <span className={`text-[11px] ${active ? "text-white/70" : "text-[var(--ink-3)]"}`}>{sc.hint} · {sc.id}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Controls */}
        <div className="card p-4 sm:p-5 lg:col-span-4 space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <h3 className="inline-flex items-center gap-1.5 text-[12px] font-bold tracking-wide text-[var(--ink)]">
              <Sliders className="h-4 w-4 text-[var(--ink-3)]" />
              Telemetry parameters
            </h3>
            <span className="rounded-full bg-[var(--accent-soft)] border border-[var(--accent-line)] px-2 py-0.5 font-mono-code text-[10px] font-bold tracking-wide text-[var(--accent)]">MODEL</span>
          </div>

          <SliderRow label="River gauge" value={`${params.riverGaugeHeightM.toFixed(2)} m`}>
            <input type="range" min="0.5" max="7" step="0.05" value={params.riverGaugeHeightM} onChange={(e) => setParams({ ...params, riverGaugeHeightM: parseFloat(e.target.value) })} className="h-1.5 w-full accent-[var(--accent)]" />
            <div className="flex justify-between font-mono-code text-[10px] text-[var(--ink-4)]"><span>Dry 0.5 m</span><span className="text-[var(--warn)]">Warn 3.5 m</span><span className="text-[var(--danger)]">Danger 4.5 m</span></div>
          </SliderRow>

          <SliderRow label="Rainfall intensity" value={`${params.rainfallIntensityMmH.toFixed(1)} mm/h`}>
            <input type="range" min="0" max="150" step="1" value={params.rainfallIntensityMmH} onChange={(e) => setParams({ ...params, rainfallIntensityMmH: parseFloat(e.target.value) })} className="h-1.5 w-full accent-[var(--accent)]" />
          </SliderRow>

          <SliderRow label="Soil saturation" value={`${params.soilSaturationPercent.toFixed(1)} %`}>
            <input type="range" min="10" max="100" step="1" value={params.soilSaturationPercent} onChange={(e) => setParams({ ...params, soilSaturationPercent: parseFloat(e.target.value) })} className="h-1.5 w-full accent-[var(--accent)]" />
          </SliderRow>

          <SliderRow label="Evacuation compliance" value={`${params.evacuationComplianceRate} %`}>
            <input type="range" min="10" max="100" step="5" value={params.evacuationComplianceRate} onChange={(e) => setParams({ ...params, evacuationComplianceRate: parseInt(e.target.value) })} className="h-1.5 w-full accent-[var(--ok)]" />
          </SliderRow>

          <SliderRow label="Gust wind" value={`${params.windSpeedKmh} km/h`}>
            <input type="range" min="0" max="200" step="5" value={params.windSpeedKmh} onChange={(e) => setParams({ ...params, windSpeedKmh: parseInt(e.target.value) })} className="h-1.5 w-full accent-[var(--info)]" />
          </SliderRow>

          <p className="rounded-lg border border-[var(--line)] bg-[var(--bg-subtle)] px-3 py-2 text-[11px] leading-relaxed text-[var(--ink-3)]">
            Dragging a parameter updates the district risk, red-zone and exposure in real time. Use <em className="not-italic font-semibold text-[var(--ink-2)]">Auto run</em> to step through the propagation chain.
          </p>
        </div>

        <div className="space-y-4 lg:col-span-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="card p-4">
              <span className="text-[11px] font-semibold tracking-wide text-[var(--ink-3)]">District risk</span>
              <span className="mt-1 block font-mono-code text-[22px] font-extrabold leading-none text-[var(--danger)]">{analysis.overallDistrictRisk}%</span>
              <span className="mt-1 inline-flex rounded-full bg-[var(--danger-soft)] border border-[var(--danger-line)] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[var(--danger)]">LEVEL 4 CRITICAL</span>
            </div>
            <div className="card p-4">
              <span className="text-[11px] font-semibold tracking-wide text-[var(--ink-3)]">Red-zone radius</span>
              <span className="mt-1 block font-mono-code text-[22px] font-extrabold leading-none text-[var(--ink)]">{analysis.redZoneRadiusMeters}<span className="text-[12px] font-semibold text-[var(--ink-3)]"> m</span></span>
              <span className="mt-1 block text-[11px] text-[var(--ink-3)]">{analysis.affectedBuildingsCount} buildings</span>
            </div>
            <div className="card p-4">
              <span className="text-[11px] font-semibold tracking-wide text-[var(--ink-3)]">Exposed</span>
              <span className="mt-1 block font-mono-code text-[22px] font-extrabold leading-none text-[var(--ink)]">{analysis.exposedPopulationTotal.toLocaleString()}</span>
              <span className="mt-1 block text-[11px] text-[var(--ink-3)]">{analysis.vulnerablePersonsCount} vulnerable</span>
            </div>
            <div className="card p-4">
              <span className="text-[11px] font-semibold tracking-wide text-[var(--ink-3)]">Est. trapped</span>
              <span className="mt-1 block font-mono-code text-[22px] font-extrabold leading-none text-[var(--danger)]">{analysis.estimatedTrappedCount}</span>
              <span className="mt-1 block text-[11px] text-[var(--ink-3)]">~{analysis.estimatedCasualtiesAtRisk} at critical risk</span>
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
              <h3 className="inline-flex items-center gap-2 text-[12px] font-bold tracking-wide text-[var(--ink)]">
                <Layers className="h-4 w-4 text-[var(--ink-3)]" />
                Propagation chain — step {currentStep} of 6
              </h3>
              <span className="font-mono-code text-[11px] text-[var(--ink-4)]">Deterministic engine</span>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-1">
              {simulationSteps.map((step) => {
                const isCurrent = step.id === currentStep;
                const isPast = step.id < currentStep;
                return (
                  <button
                    key={step.id}
                    data-cursor="hover"
                    onClick={() => setCurrentStep(step.id)}
                    className={`rounded-lg border p-2 text-left transition-colors active:scale-[.98] ${
                      isCurrent ? "bg-[var(--accent)] border-[var(--accent)] text-white shadow-sm" : isPast ? "bg-white border-[var(--line-strong)] text-[var(--ink-2)]" : "bg-[var(--bg-subtle)] border-[var(--line)] text-[var(--ink-4)] hover:text-[var(--ink-2)]"
                    }`}
                  >
                    <span className="block font-mono-code text-[10px] font-bold">0{step.id}</span>
                    <span className="block truncate text-[9px] leading-tight opacity-80">{step.title.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--bg-subtle)] p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white border border-[var(--line)] font-mono-code text-[12px] font-bold text-[var(--ink)] shadow-sm">{currentStep}</span>
                <div className="min-w-0">
                  <h4 className="text-[13px] font-bold text-[var(--ink)]">{simulationSteps[currentStep]?.title}</h4>
                  <p className="mt-1 text-[12px] leading-relaxed text-[var(--ink-2)]">{simulationSteps[currentStep]?.desc}</p>
                  {currentStep === 6 && (
                    <button data-cursor="hover" onClick={onBroadcastSimAlert} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--danger)] px-4 py-2 text-[12px] font-semibold text-white shadow-sm hover:opacity-95 active:scale-[.985]">
                      <ShieldAlert className="h-4 w-4" />
                      Broadcast SACHET warning
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <h4 className="inline-flex items-center gap-1.5 text-[12px] font-bold tracking-wide text-[var(--ink)]">
              <Sparkles className="h-4 w-4 text-[var(--ink-3)]" />
              Why the model says so
            </h4>
            <div className="mt-3 space-y-2">
              {analysis.reasoningFactors.map((factor, idx) => (
                <div key={idx} className="flex items-start gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2.5 text-[12px] leading-relaxed text-[var(--ink-2)]">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--ok)]" />
                  <span>{factor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
