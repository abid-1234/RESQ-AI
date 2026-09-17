import React, { useState } from 'react';
import { Building, RescueTeam, Shelter } from '../../types';
import { Building2, X, AlertTriangle, Users, Navigation, Layers, Truck } from 'lucide-react';

interface BuildingModalProps {
  building: Building; shelters: Shelter[]; rescueTeams: RescueTeam[];
  onClose: () => void; onDispatchTeam: (building: Building, teamId: string) => void;
}

export const BuildingModal: React.FC<BuildingModalProps> = ({ building, shelters, rescueTeams, onClose, onDispatchTeam }) => {
  const [teamId, setTeamId] = useState(() => rescueTeams.find(t => t.status === 'AVAILABLE' || t.status === 'ASSIGNED')?.id ?? rescueTeams[0]?.id ?? '');
  const nearestShelter = shelters.find(s => s.id === building.nearestShelterId) ?? shelters[0];
  const availableTeams = rescueTeams.filter(t => t.status === 'AVAILABLE' || t.status === 'ASSIGNED');
  const hasTrapped = (building.estimatedTrappedCount ?? 0) > 0;

  const riskMeta = (() => {
    const s = building.overallRiskScore;
    if (s >= 85) return { label: 'Critical', cls: 'bg-[var(--danger)] text-white border-[var(--danger)]' };
    if (s >= 70) return { label: 'High risk', cls: 'bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger-line)]' };
    if (s >= 45) return { label: 'Watch', cls: 'bg-[var(--warn-soft)] text-[var(--warn)] border-[var(--warn-line)]' };
    return { label: 'Stable', cls: 'bg-[var(--ok-soft)] text-[var(--ok)] border-[var(--ok-line)]' };
  })();

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-[rgba(18,21,26,.38)] backdrop-blur-[2px]" />
      <div className="relative w-full max-w-[720px] max-h-[90vh] overflow-hidden rounded-[16px] border border-[var(--line)] bg-white shadow-xl flex flex-col" style={{ animation: 'scaleIn .22s var(--ease-out) both' }}>
        {/* header */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
          <div className="flex items-start gap-3 min-w-0">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--accent)]">
              <Building2 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[15px] font-extrabold leading-none tracking-tight text-[var(--ink)]">{building.name}</h3>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold tracking-wide ${riskMeta.cls}`}>{riskMeta.label} · {building.overallRiskScore}%</span>
              </div>
              <p className="mt-1 font-mono-code text-[11px] text-[var(--ink-3)]">{building.code} · {building.address}</p>
              <p className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                <span className="rounded-full border border-[var(--line)] bg-[var(--bg-subtle)] px-2 py-0.5 text-[var(--ink-2)]">{building.floors} floors · {building.structuralType.replace('_',' ')}</span>
                <span className="rounded-full border border-[var(--line)] bg-white px-2 py-0.5 text-[var(--ink-3)]">{building.lat.toFixed(4)}, {building.lng.toFixed(4)}</span>
              </p>
            </div>
          </div>
          <button data-cursor="hover" onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-white text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
              <span className="text-[11px] font-semibold tracking-wide text-[var(--ink-3)]">Risk score</span>
              <span className="mt-1 block font-mono-code text-[20px] font-extrabold leading-none text-[var(--ink)]">{building.overallRiskScore}%</span>
              <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-[var(--line)]"><i className="block h-full rounded-full bg-[var(--danger)]" style={{ width: `${building.overallRiskScore}%` }} /></span>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-white p-3">
              <span className="text-[11px] font-semibold tracking-wide text-[var(--ink-3)]">Occupancy</span>
              <span className="mt-1 block font-mono-code text-[20px] font-extrabold leading-none text-[var(--ink)]">{building.estimatedOccupancy}</span>
              <span className="mt-1 block text-[11px] text-[var(--ink-3)]">Registered {building.registeredPopulation}</span>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-white p-3">
              <span className="text-[11px] font-semibold tracking-wide text-[var(--ink-3)]">Elevation</span>
              <span className="mt-1 block font-mono-code text-[20px] font-extrabold leading-none text-[var(--ink)]">{building.elevationMeters}<span className="text-[12px] font-semibold text-[var(--ink-3)]"> m</span></span>
              <span className="mt-1 block text-[11px] text-[var(--ink-3)]">{Math.round(building.nearestRiverDistanceKm*1000)} m to river · {building.soilCategory}</span>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-white p-3">
              <span className="text-[11px] font-semibold tracking-wide text-[var(--ink-3)]">Structure</span>
              <span className="mt-1 block text-[13px] font-bold text-[var(--ink)]">{building.constructionYear} · {building.floors}F</span>
              <span className="mt-1 block text-[11px] text-[var(--ink-3)]">Vuln. {building.structuralVulnerabilityScore}/100 · Hazard {building.currentHazardScore}/100</span>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-white p-4">
            <h4 className="inline-flex items-center gap-1.5 text-[12px] font-bold tracking-wide text-[var(--ink)]"><Users className="h-3.5 w-3.5 text-[var(--ink-3)]" /> Vulnerable groups</h4>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { k: 'Children <10', v: building.vulnerableGroups.children },
                { k: 'Elderly >65', v: building.vulnerableGroups.elderly },
                { k: 'Disabled', v: building.vulnerableGroups.disabled },
                { k: 'High-risk medical', v: building.vulnerableGroups.highRiskMed },
              ].map(x => (
                <div key={x.k} className="rounded-lg border border-[var(--line)] bg-[var(--bg-subtle)] px-3 py-2.5 text-center">
                  <span className="block text-[10px] font-semibold tracking-wide text-[var(--ink-3)]">{x.k}</span>
                  <strong className="mt-1 block font-mono-code text-[16px] font-extrabold text-[var(--ink)]">{x.v}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--info-line)] bg-[var(--info-soft)] p-4">
            <span className="inline-flex items-center gap-1 font-mono-code text-[11px] font-bold tracking-wide text-[var(--info)]"><Navigation className="h-3 w-3" /> Evacuation corridor</span>
            <h5 className="mt-1 text-[13px] font-bold text-[var(--ink)]">{building.nearestSafeRoute}</h5>
            <p className="mt-1 text-[12px] text-[var(--ink-2)]">Target shelter <strong className="text-[var(--ink)]">{nearestShelter?.name}</strong> · spare capacity {(nearestShelter.capacity - nearestShelter.currentOccupancy).toLocaleString()} beds</p>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
            <h4 className="inline-flex items-center gap-1.5 text-[12px] font-bold tracking-wide text-[var(--ink)]"><Layers className="h-3.5 w-3.5 text-[var(--ink-3)]" /> Digital twin</h4>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
              <div className="flex justify-between gap-2"><dt className="text-[var(--ink-3)]">Soil</dt><dd className="font-mono-code font-semibold text-[var(--ink)]">{building.soilCategory}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-[var(--ink-3)]">Status</dt><dd className="font-mono-code font-semibold text-[var(--ink)]">{building.evacuationStatus}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-[var(--ink-3)]">Vulnerability</dt><dd className="font-mono-code font-semibold text-[var(--warn)]">{building.structuralVulnerabilityScore}/100</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-[var(--ink-3)]">Hazard load</dt><dd className="font-mono-code font-semibold text-[var(--danger)]">{building.currentHazardScore}/100</dd></div>
            </dl>
          </div>

          {hasTrapped && (
            <div className="rounded-xl border border-[var(--danger-line)] bg-[var(--danger-soft)] p-4">
              <div className="flex items-start gap-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--danger)] text-white"><AlertTriangle className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[13px] font-extrabold text-[var(--danger)]">{building.estimatedTrappedCount} persons reported trapped</h4>
                  <p className="mt-1 text-[12px] leading-relaxed text-[var(--ink-2)]">Acoustic / sensor signals indicate trapped persons. Dispatch a rescue unit immediately. Selection below shows available teams.</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <select value={teamId} onChange={e => setTeamId(e.target.value)} className="h-9 min-w-[220px] flex-1 rounded-full border border-[var(--line)] bg-white px-3 text-[13px] font-medium text-[var(--ink)] outline-none focus:border-[var(--line-strong)]">
                      {availableTeams.length === 0 && <option value="">No teams available</option>}
                      {availableTeams.map(t => <option key={t.id} value={t.id}>{t.name} — {t.specialization} · {t.status}</option>)}
                    </select>
                    <button
                      data-cursor="hover"
                      disabled={!teamId || availableTeams.length === 0}
                      onClick={() => teamId && onDispatchTeam(building, teamId)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--danger)] px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:opacity-95 active:scale-[.985] disabled:opacity-50"
                    >
                      <Truck className="h-4 w-4" /> Dispatch team
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--bg-subtle)] px-5 py-3">
          <span className="hidden sm:inline font-mono-code text-[11px] text-[var(--ink-4)]">Building record · synthetic district data</span>
          <button data-cursor="hover" onClick={onClose} className="ml-auto rounded-full border border-[var(--line)] bg-white px-4 py-1.5 text-[13px] font-semibold text-[var(--ink-2)] hover:text-[var(--ink)]">Close</button>
        </div>
      </div>
    </div>
  );
};
