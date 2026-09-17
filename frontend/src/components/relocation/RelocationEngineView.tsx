import React, { useState } from 'react';
import { Shelter, Building } from '../../types';
import {
  Layers, Home, Droplets, Utensils, Zap, ShieldCheck, Users, CheckCircle2, AlertCircle,
} from 'lucide-react';

interface RelocationEngineViewProps { shelters: Shelter[]; buildings: Building[]; }

export const RelocationEngineView: React.FC<RelocationEngineViewProps> = ({ shelters }) => {
  const [selectedShelterId, setSelectedShelterId] = useState<string>(shelters[0]?.id ?? '');

  const totalCapacity = shelters.reduce((a, s) => a + s.capacity, 0);
  const totalCurrentOccupancy = shelters.reduce((a, s) => a + s.currentOccupancy, 0);
  const totalAvailableSpace = totalCapacity - totalCurrentOccupancy;
  const occupancyPercent = totalCapacity ? Math.round((totalCurrentOccupancy / totalCapacity) * 100) : 0;

  const activeShelter = shelters.find((s) => s.id === selectedShelterId) ?? shelters[0];
  const activeShelterMetrics = activeShelter
    ? {
        waterLitersPerPerson: Math.round(activeShelter.amenities.waterLiters / Math.max(activeShelter.capacity, 1)),
        foodDays: activeShelter.amenities.foodDaysRemaining,
        toiletCount: activeShelter.amenities.toiletsCount,
        powerStatus: activeShelter.amenities.backupPower ? 'Backup ready' : 'No backup',
        medicalBedCount: activeShelter.amenities.medicalBedCount,
      }
    : null;

  const occBarClass = (p: number) => {
    if (p > 95) return 'bg-[var(--danger)]';
    if (p > 80) return 'bg-[var(--warn)]';
    return 'bg-[var(--ok)]';
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-4" style={{ animation: 'fadeUp .36s var(--ease-out) both' }}>
      {/* Header — calm */}
      <div className="card flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent)] text-white shadow-sm">
            <Layers className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-[15px] font-extrabold tracking-tight text-[var(--ink)]">Relocation & carrying capacity</h2>
            <p className="text-[12px] leading-relaxed text-[var(--ink-3)]">Water · food · sanitation · medical · power — shelter load balanced across safe zones</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg-subtle)] px-3 py-2.5 text-[11px] font-mono-code">
          <span className="text-[var(--ink-3)]">Capacity <strong className="text-[var(--ink)]">{totalCapacity.toLocaleString()}</strong></span>
          <span className="h-4 w-px bg-[var(--line)] hidden sm:block" />
          <span className="text-[var(--ok)] font-bold">{totalAvailableSpace.toLocaleString()} free</span>
          <span className="h-4 w-px bg-[var(--line)] hidden sm:block" />
          <span className="text-[var(--ink-2)]">{occupancyPercent}% occupied</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Shelter directory */}
        <div className="card p-4 sm:p-5 lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <h3 className="inline-flex items-center gap-1.5 text-[12px] font-bold tracking-wide text-[var(--ink)]">
              <Home className="h-4 w-4 text-[var(--ink-3)]" /> Relief shelters & safe havens
            </h3>
            <span className="font-mono-code text-[11px] text-[var(--ink-4)]">{shelters.length} sites</span>
          </div>

          <div className="space-y-3">
            {shelters.map((s) => {
              const occ = s.capacity ? Math.min(100, Math.round((s.currentOccupancy / s.capacity) * 100)) : 0;
              const isSelected = selectedShelterId === s.id;
              return (
                <button
                  key={s.id}
                  data-cursor="hover"
                  onClick={() => setSelectedShelterId(s.id)}
                  className={`w-full text-left rounded-xl border p-3.5 transition-all active:scale-[.985] ${
                    isSelected ? 'bg-[var(--accent-soft)] border-[var(--accent-line)] shadow-sm' : 'bg-white border-[var(--line)] hover:border-[var(--line-strong)] hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="block text-[13px] font-bold leading-tight text-[var(--ink)]">{s.name}</span>
                      <span className="mt-1 inline-flex flex-wrap gap-1.5 text-[11px]">
                        <span className={`rounded-full border px-2 py-0.5 font-mono-code text-[10px] font-bold tracking-wide ${isSelected ? 'bg-white border-[var(--line)] text-[var(--ink-2)]' : 'bg-[var(--bg-subtle)] border-[var(--line)] text-[var(--ink-3)]'}`}>{s.status.replace('_', ' ')}</span>
                        <span className="font-mono-code text-[var(--ink-4)]">{s.code} · {s.lat.toFixed(4)}, {s.lng.toFixed(4)}</span>
                      </span>
                    </div>
                    <span className="shrink-0 text-right">
                      <span className="block font-mono-code text-[13px] font-bold text-[var(--ink)]">{s.currentOccupancy} / {s.capacity}</span>
                      <span className="font-mono-code text-[11px] text-[var(--ink-3)]">{occ}%</span>
                    </span>
                  </div>
                  <span className="mt-2.5 block h-2 overflow-hidden rounded-full bg-[var(--line)]">
                    {/* eslint-disable-next-line react/forbid-dom-props */}
                    <i className={`block h-full rounded-full transition-all duration-500 ${occBarClass(occ)}`} style={{ width: `${occ}%` }} />
                  </span>
                  <span className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--line)] pt-3 sm:grid-cols-4 font-mono-code text-[11px] text-[var(--ink-2)]">
                    <span className="inline-flex items-center gap-1"><Droplets className="h-3 w-3 text-[var(--info)]" /> {Math.round(s.amenities.waterLiters / Math.max(s.capacity, 1))} L/p/d</span>
                    <span className="inline-flex items-center gap-1"><Utensils className="h-3 w-3 text-[var(--ink-3)]" /> {s.amenities.foodDaysRemaining}d food</span>
                    <span className="inline-flex items-center gap-1"><Zap className="h-3 w-3 text-[var(--ink-3)]" /> {s.amenities.backupPower ? 'Backup' : 'No backup'}</span>
                    <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-[var(--ok)]" /> {s.amenities.medicalBedCount} med beds</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Logistics audit */}
        <div className="space-y-4 lg:col-span-5">
          <div className="card p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <h3 className="text-[12px] font-bold tracking-wide text-[var(--ink)]">Logistics & sphere standards</h3>
              <span className="rounded-full border border-[var(--line)] bg-[var(--bg-subtle)] px-2 py-0.5 font-mono-code text-[10px] font-bold text-[var(--ink-3)]">{activeShelter?.name.split(' ')[0] ?? '—'}</span>
            </div>

            <div className="space-y-2.5">
              {[
                { icon: Droplets, label: 'Potable water buffer', sub: 'Sphere ≥ 15 L/person/day', value: `${activeShelterMetrics?.waterLitersPerPerson ?? 0} L/p/d`, badge: (activeShelterMetrics?.waterLitersPerPerson ?? 0) >= 15 ? 'Compliant' : 'Below standard', badgeOk: (activeShelterMetrics?.waterLitersPerPerson ?? 0) >= 15 },
                { icon: Utensils, label: 'Dry ration & kitchen', sub: 'Buffer at current intake', value: `${activeShelterMetrics?.foodDays ?? 0} days`, badge: 'Secured', badgeOk: true },
                { icon: Users, label: 'Sanitation & toilets', sub: `${activeShelterMetrics?.toiletCount ?? 0} units installed`, value: `${activeShelterMetrics?.toiletCount ?? 0} units`, badge: activeShelter ? `1:${Math.max(1, Math.ceil(activeShelter.capacity / Math.max(activeShelterMetrics?.toiletCount ?? 1, 1)))}` : '—', badgeOk: false },
                { icon: Zap, label: 'Diesel & solar power', sub: activeShelterMetrics?.powerStatus ?? '—', value: activeShelterMetrics?.powerStatus ?? '—', badge: 'Facility status', badgeOk: true },
              ].map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--bg-subtle)] px-3 py-3">
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--line)] bg-white text-[var(--ink-2)]"><Icon className="h-4 w-4" /></span>
                      <span className="min-w-0">
                        <span className="block text-[12px] font-semibold leading-none text-[var(--ink)]">{row.label}</span>
                        <span className="text-[11px] text-[var(--ink-3)]">{row.sub}</span>
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-mono-code text-[13px] font-bold text-[var(--ink)]">{row.value}</span>
                      <span className={`inline-flex rounded-full border px-2 py-0.5 font-mono-code text-[10px] font-bold tracking-wide ${row.badgeOk ? 'bg-[var(--ok-soft)] border-[var(--ok-line)] text-[var(--ok)]' : 'bg-white border-[var(--line)] text-[var(--ink-3)]'}`}>{row.badge}</span>
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-white px-3 py-3">
              <span>
                <span className="block text-[11px] font-semibold tracking-wide text-[var(--ink-3)]">Facility manager</span>
                <span className="text-[12px] font-bold text-[var(--ink)]">{activeShelter?.contactOfficer ?? '—'}</span>
              </span>
              <span className="font-mono-code text-[12px] font-semibold text-[var(--accent)]">{activeShelter?.contactPhone ?? '—'}</span>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-subtle)] px-3 py-2.5 text-[11px] leading-relaxed text-[var(--ink-3)] flex items-start gap-2">
            {totalAvailableSpace < 200 ? <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--warn)]" /> : <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--ok)]" />}
            <span>
              {totalAvailableSpace < 200
                ? 'District shelters are near capacity — consider activating reserve community halls for overflow.'
                : 'Capacity headroom is comfortable. Loads are balanced across the three safe-zone tiers.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
