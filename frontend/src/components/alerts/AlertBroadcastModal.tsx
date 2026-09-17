import React, { useState } from 'react';
import { Bell, X, Send, Radio, Smartphone, Volume2, CheckCircle2 } from 'lucide-react';
import { PublicAlert } from '../../types';

interface AlertBroadcastModalProps {
  onClose: () => void;
  onDispatchAlert: (alert: Partial<PublicAlert>) => void;
}

export const AlertBroadcastModal: React.FC<AlertBroadcastModalProps> = ({ onClose, onDispatchAlert }) => {
  const [headline, setHeadline] = useState('FLASH FLOOD SURGE EMERGENCY: EVACUATE SECTOR 4 LOWLANDS');
  const [instruction, setInstruction] = useState('Krishna River gauge exceeded 4.82 m. Move immediately via Sector 4 North Overbridge to North Highland Shelter.');
  const [severity, setSeverity] = useState<'CRITICAL' | 'WARNING' | 'WATCH'>('CRITICAL');
  const [targetRadiusMeters, setTargetRadiusMeters] = useState(1400);
  const [sendSMS, setSendSMS] = useState(true);
  const [sendPush, setSendPush] = useState(true);
  const [sendSiren, setSendSiren] = useState(true);
  const [isDispatched, setIsDispatched] = useState(false);

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    onDispatchAlert({
      headline, instruction, severity, targetRadiusMeters,
      channel: 'ALL_CHANNELS',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      senderAgency: 'District Disaster Management Authority (DDMA)',
    } as any);
    setIsDispatched(true);
    window.setTimeout(() => onClose(), 2200);
  };

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-[rgba(18,21,26,.38)] backdrop-blur-[2px]" />
      <div className="relative w-full max-w-[640px] overflow-hidden rounded-[16px] border border-[var(--line)] bg-white shadow-xl flex flex-col" style={{ animation: 'scaleIn .22s var(--ease-out) both' }}>
        <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
          <span className="flex items-center gap-3 min-w-0">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--danger-soft)] border border-[var(--danger-line)] text-[var(--danger)]">
              <Bell className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] font-extrabold tracking-tight text-[var(--ink)]">SACHET geo-targeted alert</span>
              <span className="font-mono-code text-[11px] text-[var(--ink-3)]">Common Alerting Protocol (CAP v1.2)</span>
            </span>
          </span>
          <button data-cursor="hover" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full border border-[var(--line)] bg-white text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {isDispatched ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="mx-auto h-10 w-10 text-[var(--ok)]" />
            <h4 className="text-[15px] font-bold text-[var(--ink)]">Broadcast initiated</h4>
            <p className="mx-auto max-w-[42ch] text-[12px] leading-relaxed text-[var(--ink-2)]">
              Dispatched to <strong className="text-[var(--ink)]">3,420 cell towers</strong>, <strong className="text-[var(--ink)]">6 gateway sirens</strong> and <strong className="text-[var(--ink)]">14,800 handsets</strong> in the red zone (demo).
            </p>
          </div>
        ) : (
          <form onSubmit={handleBroadcast} className="p-5 space-y-4">
            <label className="block space-y-1">
              <span className="font-mono-code text-[11px] font-semibold tracking-wide text-[var(--ink-3)]">Headline</span>
              <input value={headline} onChange={(e) => setHeadline(e.target.value)} required className="h-10 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-[13px] font-semibold text-[var(--ink)] outline-none focus:border-[var(--line-strong)]" />
            </label>

            <label className="block space-y-1">
              <span className="font-mono-code text-[11px] font-semibold tracking-wide text-[var(--ink-3)]">Public directive</span>
              <textarea rows={3} value={instruction} onChange={(e) => setInstruction(e.target.value)} required className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-[13px] leading-relaxed text-[var(--ink)] outline-none focus:border-[var(--line-strong)]" />
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="font-mono-code text-[11px] font-semibold tracking-wide text-[var(--ink-3)]">Geofence radius</span>
                <select value={targetRadiusMeters} onChange={(e) => setTargetRadiusMeters(parseInt(e.target.value))} className="h-10 w-full rounded-full border border-[var(--line)] bg-white px-3 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--line-strong)]">
                  <option value={800}>800 m — sector core</option>
                  <option value={1400}>1,400 m — Sector 4 river basin</option>
                  <option value={3000}>3,000 m — sub-district</option>
                  <option value={10000}>10,000 m — district</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="font-mono-code text-[11px] font-semibold tracking-wide text-[var(--ink-3)]">Severity</span>
                <select value={severity} onChange={(e) => setSeverity(e.target.value as any)} className="h-10 w-full rounded-full border border-[var(--line)] bg-white px-3 text-[13px] font-semibold text-[var(--ink)] outline-none focus:border-[var(--line-strong)]">
                  <option value="CRITICAL">Critical — red siren</option>
                  <option value="WARNING">Warning — orange advisory</option>
                  <option value="WATCH">Watch — yellow notice</option>
                </select>
              </label>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-subtle)] p-3 space-y-2">
              <span className="font-mono-code text-[11px] font-semibold tracking-wide text-[var(--ink-3)]">Dispatch channels</span>
              <div className="grid grid-cols-3 gap-2 text-[12px]">
                {[
                  { v: sendSMS, set: setSendSMS, Icon: Smartphone, label: 'Cell / SMS' },
                  { v: sendPush, set: setSendPush, Icon: Radio, label: 'SACHET app' },
                  { v: sendSiren, set: setSendSiren, Icon: Volume2, label: 'Mesh sirens' },
                ].map((c) => (
                  <label key={c.label} className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--line)] bg-white px-2.5 py-2 text-[var(--ink-2)] hover:border-[var(--line-strong)]">
                    <input type="checkbox" checked={c.v} onChange={(e) => c.set(e.target.checked)} className="accent-[var(--accent)]" />
                    <c.Icon className="h-3.5 w-3.5 text-[var(--ink-3)]" />
                    <span className="text-[11px] font-medium">{c.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              id="btn-confirm-broadcast-alert"
              data-cursor="hover"
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--danger)] px-4 py-3 text-[13px] font-bold tracking-wide text-white shadow-sm hover:opacity-95 active:scale-[.985]"
            >
              <Send className="h-4 w-4" /> Authorize & broadcast CAP alert
            </button>
            <p className="text-center text-[11px] text-[var(--ink-4)]">Demo only — no real broadcast is sent</p>
          </form>
        )}
      </div>
    </div>
  );
};
