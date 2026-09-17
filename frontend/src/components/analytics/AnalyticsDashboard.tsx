import React from 'react';
import { SensorNode, Building } from '../../types';
import { Activity, ShieldCheck, Radio, Clock, CheckCircle2 } from 'lucide-react';

interface AnalyticsDashboardProps { sensors: SensorNode[]; buildings: Building[]; }

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ sensors }) => {
  const onlineSensors = sensors.filter((s) => s.status !== 'OFFLINE').length;

  return (
    <div className="mx-auto max-w-[1600px] space-y-4" style={{ animation: 'fadeUp .36s var(--ease-out) both' }}>
      {/* Banner — calm, not gradient neon */}
      <div className="card flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent)] text-white shadow-sm">
            <Activity className="h-5 w-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-extrabold tracking-tight text-[var(--ink)]">Data confidence & predictive accuracy</h2>
              <span className="rounded-full border border-[var(--line)] bg-[var(--bg-subtle)] px-2 py-0.5 font-mono-code text-[10px] font-bold tracking-wide text-[var(--ink-3)]">REFERENCE METRICS</span>
            </div>
            <p className="text-[12px] text-[var(--ink-3)]">Model indicators, telemetry health, and the current data confidence estimate.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--bg-subtle)] px-4 py-2.5">
          <span className="text-right">
            <span className="block font-mono-code text-[10px] font-semibold tracking-wide text-[var(--ink-3)]">System data confidence</span>
            <span className="font-mono-code text-[22px] font-extrabold leading-none text-[var(--ink)]">87.4%</span>
          </span>
          <span className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] bg-white text-[var(--accent)]"><ShieldCheck className="h-5 w-5" /></span>
        </div>
      </div>

      {/* Confidence breakdown */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Sensor SNR & calibration', value: '92.1%', w: 92, sub: '16/16 nodes calibrated Q1 2026', tone: 'ok' as const },
          { label: 'GIS building twin precision', value: '88.5%', w: 88.5, sub: 'NDMA geo-cadastre verified', tone: 'info' as const },
          { label: 'LoRa mesh packet reliability', value: '94.8%', w: 94.8, sub: '< 450 ms telemetry', tone: 'accent' as const },
          { label: 'Satellite sync freshness', value: '84.2%', w: 84.2, sub: 'Sentinel-2 sync 14 m ago', tone: 'warn' as const },
        ].map((c) => (
          <div key={c.label} className="card p-4 space-y-2">
            <div className="flex items-center justify-between gap-2 font-mono-code text-[11px]">
              <span className="font-semibold text-[var(--ink-3)]">{c.label}</span>
              <strong className={c.tone === 'ok' ? 'text-[var(--ok)]' : c.tone === 'warn' ? 'text-[var(--warn)]' : c.tone === 'info' ? 'text-[var(--info)]' : 'text-[var(--ink)]'}>{c.value}</strong>
            </div>
            <span className="block h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
              <i className={`block h-full rounded-full ${c.tone === 'ok' ? 'bg-[var(--ok)]' : c.tone === 'warn' ? 'bg-[var(--warn)]' : c.tone === 'info' ? 'bg-[var(--info)]' : 'bg-[var(--accent)]'}`} style={{ width: `${c.w}%` }} />
            </span>
            <span className="block text-[11px] text-[var(--ink-4)]">{c.sub}</span>
          </div>
        ))}
      </div>

      {/* Benchmark */}
      <div className="card p-4 sm:p-5 space-y-3">
        <h3 className="inline-flex items-center gap-2 text-[12px] font-bold tracking-wide text-[var(--ink)]">
          <Clock className="h-4 w-4 text-[var(--ink-3)]" /> Benchmark operational response
        </h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-subtle)] p-4">
            <span className="font-mono-code text-[11px] font-semibold tracking-wide text-[var(--ink-4)]">Legacy pre-AI (2022)</span>
            <span className="mt-1 block font-mono-code text-[20px] font-extrabold text-[var(--ink-2)]">42 minutes</span>
            <span className="text-[11px] text-[var(--ink-3)]">Average alert broadcast delay</span>
          </div>
          <div className="rounded-xl border border-[var(--ok-line)] bg-[var(--ok-soft)] p-4">
            <span className="font-mono-code text-[11px] font-semibold tracking-wide text-[var(--ok)]">RESQ-AI early warning (2026)</span>
            <span className="mt-1 block font-mono-code text-[20px] font-extrabold text-[var(--ok)]">2.4 minutes</span>
            <span className="text-[11px] text-[var(--ink-3)]">Illustrative sensor-triggered timing</span>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-white p-4">
            <span className="font-mono-code text-[11px] font-semibold tracking-wide text-[var(--ink-4)]">Projected casualty reduction</span>
            <span className="mt-1 block text-[13px] font-bold text-[var(--ink)]">Illustrative estimate</span>
            <span className="text-[11px] text-[var(--ink-3)]">Based on evacuation lead time</span>
          </div>
        </div>
      </div>

      {/* Sensor fleet table — light, no slate neon */}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] bg-[var(--surface-2)] px-4 py-3">
          <h3 className="inline-flex items-center gap-2 text-[12px] font-bold tracking-wide text-[var(--ink)]">
            <Radio className="h-4 w-4 text-[var(--ink-3)]" /> Live IoT sensor fleet
          </h3>
          <span className="font-mono-code text-[11px] font-semibold text-[var(--ok)]">{onlineSensors}/{sensors.length} online</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-[var(--bg-subtle)] font-mono-code text-[11px] text-[var(--ink-3)]">
              <tr className="border-b border-[var(--line)]">
                <th className="px-3 py-2.5 font-semibold">Node</th>
                <th className="px-3 py-2.5 font-semibold">Location</th>
                <th className="px-3 py-2.5 font-semibold">Type</th>
                <th className="px-3 py-2.5 font-semibold">Telemetry</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="px-3 py-2.5 font-semibold">Battery</th>
                <th className="px-3 py-2.5 font-semibold">SNR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] font-mono-code text-[11px]">
              {sensors.map((s) => (
                <tr key={s.id} className="hover:bg-[var(--bg-subtle)]/70">
                  <td className="px-3 py-2.5 font-bold text-[var(--accent)]">{s.nodeCode}</td>
                  <td className="px-3 py-2.5 font-sans font-medium text-[var(--ink)]">{s.name}</td>
                  <td className="px-3 py-2.5 text-[var(--ink-3)]">{s.type}</td>
                  <td className="px-3 py-2.5 font-bold text-[var(--ink)]">{s.currentReading.value} {s.currentReading.unit}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${
                      s.status === 'CRITICAL' ? 'bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger-line)]' :
                      s.status === 'ANOMALY' ? 'bg-[var(--warn-soft)] text-[var(--warn)] border-[var(--warn-line)]' :
                      'bg-[var(--ok-soft)] text-[var(--ok)] border-[var(--ok-line)]'
                    }`}>{s.status}</span>
                  </td>
                  <td className="px-3 py-2.5 text-[var(--ink-2)]">{s.batteryPercentage}%</td>
                  <td className="px-3 py-2.5 text-[var(--ink-2)]">{s.signalStrengthDbm} dBm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="flex items-center gap-1.5 border-t border-[var(--line)] bg-[var(--bg-subtle)] px-4 py-2 text-[11px] text-[var(--ink-4)]">
          <CheckCircle2 className="h-3.5 w-3.5 text-[var(--ok)]" /> Telemetry is illustrative demo data · mesh latency ~320 ms
        </p>
      </div>
    </div>
  );
};
