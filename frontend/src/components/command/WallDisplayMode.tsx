import React from 'react';
import { Minimize2, ShieldAlert, Radio, Home, Truck } from 'lucide-react';
import { Building, Incident, RescueTeam, SensorNode, Shelter } from '../../types';

interface WallDisplayModeProps {
  buildings: Building[];
  sensors: SensorNode[];
  shelters: Shelter[];
  teams: RescueTeam[];
  incident: Incident;
  overallRisk: number;
  onExitWallMode: () => void;
}

export const WallDisplayMode: React.FC<WallDisplayModeProps> = ({
  buildings, sensors, shelters, teams, incident, overallRisk, onExitWallMode,
}) => {
  const totalTrapped = buildings.reduce((a, b) => a + (b.estimatedTrappedCount ?? 0), 0);
  const criticalSensors = sensors.filter((s) => s.status === 'CRITICAL' || s.status === 'ANOMALY');

  return (
    <div className="fixed inset-0 z-[1000] bg-[var(--bg)] text-[var(--ink)] p-4 sm:p-6 flex flex-col overflow-hidden">
      {/* Header — paper, not neon void */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--danger)] text-white shadow-sm">
            <ShieldAlert className="h-6 w-6" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[18px] font-extrabold tracking-tight text-[var(--ink)]">RESQ-AI — Master command wall</h1>
              <span className="rounded-full bg-[var(--danger)] px-2.5 py-1 font-mono-code text-[11px] font-bold tracking-wide text-white">LEVEL 4 · CRITICAL</span>
            </div>
            <p className="font-mono-code text-[11px] text-[var(--ink-3)]">Incident {incident.code} · NDMA integrated geo-operations — wall display (demo)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex rounded-full border border-[var(--line)] bg-white px-3 py-1.5 font-mono-code text-[11px] text-[var(--ink-3)]">
            Satellite feed · demo
          </span>
          <button
            id="btn-exit-wall-mode"
            data-cursor="hover"
            onClick={onExitWallMode}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white px-3.5 py-2 text-[12px] font-semibold text-[var(--ink-2)] shadow-sm hover:text-[var(--ink)] active:scale-[.985]"
          >
            <Minimize2 className="h-4 w-4" /> Exit wall mode
          </button>
        </div>
      </div>

      {/* Bento — white cards on paper */}
      <div className="grid flex-1 grid-cols-12 gap-4 overflow-auto py-4 sm:gap-5">
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 card flex flex-col justify-between p-5 border-[var(--danger-line)]">
          <div>
            <span className="text-[11px] font-bold tracking-wide text-[var(--danger)]">District hazard index</span>
            <span className="mt-1 block font-mono-code text-[48px] font-extrabold leading-none tracking-tight text-[var(--danger)]">{overallRisk}%</span>
            <span className="mt-2 block text-[11px] leading-relaxed text-[var(--ink-3)]">Based on live gauge 4.82 m and heavy rainfall telemetry.</span>
          </div>
          <div className="mt-4 space-y-2 border-t border-[var(--line)] pt-4 text-[12px]">
            <span className="flex justify-between"><span className="text-[var(--ink-3)]">Exposed</span><strong className="font-mono-code text-[var(--ink)]">{incident.estimatedExposedPopulation.toLocaleString()}</strong></span>
            <span className="flex justify-between"><span className="text-[var(--ink-3)]">Vulnerable</span><strong className="font-mono-code text-[var(--danger)]">{incident.vulnerableCount.toLocaleString()}</strong></span>
            <span className="flex justify-between"><span className="text-[var(--ink-3)]">Trapped / distress</span><strong className="font-mono-code text-[var(--danger)]">{totalTrapped}</strong></span>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 lg:col-span-3 card flex flex-col p-5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-[var(--ink)]"><Radio className="h-4 w-4 text-[var(--ink-3)]" /> Sensor anomalies</span>
          <div className="mt-3 space-y-2">
            {criticalSensors.slice(0, 4).map((s) => (
              <div key={s.id} className="rounded-xl border border-[var(--line)] bg-[var(--bg-subtle)] px-3 py-2.5 flex items-center justify-between gap-2">
                <span className="min-w-0">
                  <strong className="block truncate text-[12px] text-[var(--ink)]">{s.name}</strong>
                  <span className="font-mono-code text-[10px] text-[var(--ink-4)]">{s.nodeCode}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-mono-code text-[12px] font-bold text-[var(--ink)]">{s.currentReading.value} {s.currentReading.unit}</span>
                  <span className={`inline-flex rounded-full border px-1.5 py-0.5 font-mono-code text-[10px] font-bold ${s.status === 'CRITICAL' ? 'bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger-line)]' : 'bg-[var(--warn-soft)] text-[var(--warn)] border-[var(--warn-line)]'}`}>{s.status}</span>
                </span>
              </div>
            ))}
            {criticalSensors.length === 0 && <p className="text-[12px] text-[var(--ink-3)]">No active anomalies.</p>}
          </div>
          <p className="mt-auto border-t border-[var(--line)] pt-3 font-mono-code text-[11px] text-[var(--ink-4)] flex justify-between"><span>Mesh <strong className="text-[var(--ok)]">locked</strong></span><span>~320 ms</span></p>
        </div>

        <div className="col-span-12 sm:col-span-6 lg:col-span-3 card flex flex-col p-5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-[var(--ink)]"><Truck className="h-4 w-4 text-[var(--ink-3)]" /> Tactical units</span>
          <div className="mt-3 space-y-2">
            {teams.map((t) => (
              <div key={t.id} className="rounded-xl border border-[var(--line)] bg-[var(--bg-subtle)] px-3 py-2.5 flex items-center justify-between gap-2">
                <span className="min-w-0">
                  <strong className="block truncate text-[12px] text-[var(--ink)]">{t.name}</strong>
                  <span className="font-mono-code text-[10px] text-[var(--ink-4)]">{t.assignedVehicle}</span>
                </span>
                <span className="shrink-0 rounded-full bg-white border border-[var(--line)] px-2 py-0.5 font-mono-code text-[10px] font-bold text-[var(--ink-2)]">{t.status}</span>
              </div>
            ))}
          </div>
          <p className="mt-auto border-t border-[var(--line)] pt-3 font-mono-code text-[11px] text-[var(--ink-4)]">Channel <strong className="text-[var(--accent)]">NDRF-SECURE-01</strong></p>
        </div>

        <div className="col-span-12 sm:col-span-6 lg:col-span-3 card flex flex-col p-5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-[var(--ink)]"><Home className="h-4 w-4 text-[var(--ink-3)]" /> Shelter intake</span>
          <div className="mt-3 space-y-2.5">
            {shelters.map((s) => {
              const p = Math.round((s.currentOccupancy / s.capacity) * 100);
              return (
                <div key={s.id} className="rounded-xl border border-[var(--line)] bg-[var(--bg-subtle)] px-3 py-2.5 space-y-1.5">
                  <span className="flex justify-between font-mono-code text-[11px]"><strong className="text-[var(--ink)]">{s.name.split(' ')[0]} hub</strong><span className="text-[var(--ink-2)]">{s.currentOccupancy}/{s.capacity}</span></span>
                  <span className="block h-1.5 overflow-hidden rounded-full bg-[var(--line)]"><i className="block h-full rounded-full bg-[var(--ok)]" style={{ width: `${p}%` }} /></span>
                </div>
              );
            })}
          </div>
          <p className="mt-auto flex justify-between border-t border-[var(--line)] pt-3 font-mono-code text-[11px] text-[var(--ink-4)]"><span>Ration <strong className="text-[var(--ink)]">6.5 d</strong></span><span>Water <strong className="text-[var(--info)]">18.5 L/p</strong></span></p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-3 font-mono-code text-[11px] text-[var(--ink-4)]">
        <span className="flex gap-4"><strong className="text-[var(--ok)]">Local check: pass</strong><span>CAP v1.2</span><span>Capacity rules configured</span></span>
        <span className="text-[var(--ink-3)]">{new Date().toUTCString()}</span>
      </div>
    </div>
  );
};
