import React, { useState } from 'react';
import {
  Radio,
  MapPin,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Truck,
  PhoneCall,
  Send,
  UploadCloud,
  LifeBuoy,
  Navigation,
  ShieldCheck,
  BatteryCharging,
  Wifi,
  Users,
  Building2
} from 'lucide-react';
import { Building, RescueTeam, RoadSegment } from '../../types';

interface FieldOfficerAppProps {
  teams: RescueTeam[];
  buildings: Building[];
  roads: RoadSegment[];
  onReportVictim: (buildingId: string, count: number) => void;
  onReportRoadBlock: (roadId: string, reason: string) => void;
}

export const FieldOfficerApp: React.FC<FieldOfficerAppProps> = ({
  teams,
  buildings,
  roads,
  onReportVictim,
  onReportRoadBlock
}) => {
  const [activeDept, setActiveDept] = useState<RescueTeam["department"]>(
    (teams[0]?.department as RescueTeam["department"]) ?? "NDRF",
  );
  const deptTeams = teams.filter((t) => t.department === activeDept);
  const currentTeam = (deptTeams[0] ?? teams[0]) || {
    id: 'team-ndrf-10',
    name: 'NDRF 10th Battalion — Alpha Flood Rescue',
    department: 'NDRF',
    personnelCount: 32,
    leaderName: 'Inspector Vikram Rathore',
    status: 'ON_SITE_RESCUE',
    specialization: 'WATER_FLOOD',
    equipment: ['4x Inflatable Motor Boats', 'Underwater Drones', 'Rope Rescue Kits'],
    assignedVehicle: 'NDRF Heavy Rescue Truck 04',
    contactRadio: 'NDRF-CH-01',
    lat: 17.3760,
    lng: 78.4780
  };

  const [missionStatus, setMissionStatus] = useState<'EN_ROUTE' | 'ON_SITE_RESCUE' | 'COMPLETED'>('ON_SITE_RESCUE');
  const [rescuedCount, setRescuedCount] = useState(14);
  const [reportedVictimsInput, setReportedVictimsInput] = useState('2');
  const [selectedBuildingId, setSelectedBuildingId] = useState('b-404');
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [damageTag, setDamageTag] = useState<'SEVERE' | 'COLLAPSED' | 'MODERATE'>('SEVERE');
  const [fieldNotes, setFieldNotes] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // local helper for road block reporting — preserves onReportRoadBlock usage
  const [roadBlockReason, setRoadBlockReason] = useState('');
  const [selectedRoadId, setSelectedRoadId] = useState<string>(roads[0]?.id ?? 'rd-02');

  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId) || buildings[0];

  const handleVictimExtractionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(reportedVictimsInput) || 1;
    setRescuedCount(prev => prev + count);
    onReportVictim(selectedBuildingId, count);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleRoadBlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoadId) return;
    onReportRoadBlock(selectedRoadId, roadBlockReason || 'Field reported obstruction');
    setRoadBlockReason('');
  };

  const statusMeta: Record<typeof missionStatus, { label: string; dot: string; bg: string; border: string; text: string }> = {
    EN_ROUTE: { label: 'EN ROUTE', dot: 'var(--info)', bg: 'var(--info-soft)', border: 'var(--info-line)', text: 'var(--info)' },
    ON_SITE_RESCUE: { label: 'ON SITE — RESCUE', dot: 'var(--warn)', bg: 'var(--warn-soft)', border: 'var(--warn-line)', text: 'var(--warn)' },
    COMPLETED: { label: 'COMPLETED', dot: 'var(--ok)', bg: 'var(--ok-soft)', border: 'var(--ok-line)', text: 'var(--ok)' },
  };

  const activeStatus = statusMeta[missionStatus];

  return (
    <div
      className="min-h-full p-4 sm:p-5 max-w-2xl mx-auto space-y-4"
      style={{ background: 'var(--bg, #F8F7F4)', color: 'var(--ink, #12151A)' }}
    >
      <style>{`
        :root {
          --bg: #F8F7F4;
          --bg-subtle: #F1EFEA;
          --surface: #ffffff;
          --ink: #12151A;
          --ink-2: #2B3240;
          --ink-3: #5A6577;
          --line: #E9E7E3;
          --accent: #1A2332;
          --danger: #C0392B;
          --ok: #1E7A4C;
          --warn: #B7791F;
          --info: #2F5D8A;
          --accent-soft: #EEF0F3;
          --accent-line: #D8DDE3;
          --danger-soft: #FDF0EF;
          --danger-line: #F0C8C3;
          --ok-soft: #EAF6EF;
          --ok-line: #C5E6D1;
          --warn-soft: #FEF6E8;
          --warn-line: #F2DEB8;
          --info-soft: #EFF3F8;
          --info-line: #C9D7E8;
        }
        .card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 16px;
          box-shadow: 0 1px 2px rgba(18,21,26,0.04), 0 4px 16px rgba(18,21,26,0.04);
        }
      `}</style>

      {/* Header — Team & Telemetry */}
      <div className="card p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 pb-4" style={{ borderBottom: '1px solid var(--line)' }}>
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', color: 'var(--accent)' }}
            >
              <Radio className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <div className="min-w-0">
              <h2 className="text-[14px] font-semibold leading-tight tracking-tight" style={{ color: 'var(--ink)' }}>
                {currentTeam.name}
              </h2>
              <p className="text-[12px] mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5" style={{ color: 'var(--ink-3)' }}>
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--ink-3)' }} />
                  {currentTeam.department} · {currentTeam.specialization?.replace(/_/g, ' ')}
                </span>
                <span className="hidden sm:inline" style={{ color: 'var(--line)' }}>·</span>
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" style={{ color: 'var(--ink-3)' }} />
                  {currentTeam.personnelCount} personnel
                </span>
              </p>
              <p className="text-[11px] mt-1 font-medium" style={{ color: 'var(--ink-3)' }}>
                <span className="inline-flex items-center gap-1">
                  <PhoneCall className="w-3 h-3" style={{ color: 'var(--ink-3)' }} />
                  {currentTeam.leaderName}
                </span>
                <span className="mx-1.5" style={{ color: 'var(--line)' }}>|</span>
                <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{currentTeam.contactRadio}</span>
                {currentTeam.assignedVehicle ? (
                  <>
                    <span className="mx-1.5" style={{ color: 'var(--line)' }}>|</span>
                    <span className="inline-flex items-center gap-1">
                      <Truck className="w-3 h-3" style={{ color: 'var(--ink-3)' }} />
                      {currentTeam.assignedVehicle}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <label className="inline-flex items-center gap-1.5 rounded-full border bg-white pl-2 pr-1 py-0.5">
              <span className="text-[10px] font-semibold tracking-wide" style={{ color: "var(--ink-3)" }}>Dept</span>
              <select
                value={activeDept}
                onChange={(e) => setActiveDept(e.target.value as RescueTeam["department"])}
                aria-label="Switch field department"
                className="bg-transparent pr-5 text-[11px] font-semibold outline-none cursor-pointer"
                style={{ color: "var(--ink-2)" }}
              >
                <option value="NDRF">NDRF</option>
                <option value="SDRF">SDRF</option>
                <option value="FIRE_RESCUE">Fire & Rescue</option>
                <option value="POLICE_QRT">Police QRT</option>
                <option value="CIVIL_DEFENSE">Civil Defense</option>
                <option value="MEDICAL_RAPID">Medical Rapid</option>
              </select>
            </label>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide border"
              style={{ background: activeStatus.bg, borderColor: activeStatus.border, color: activeStatus.text }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: activeStatus.dot }} />
              {activeStatus.label}
            </span>
            {/* Mission status control — preserves setMissionStatus logic */}
            <div
              className="hidden sm:flex items-center p-0.5 rounded-full border text-[11px] font-medium"
              style={{ background: 'var(--bg-subtle)', borderColor: 'var(--line)' }}
            >
              {(['EN_ROUTE', 'ON_SITE_RESCUE', 'COMPLETED'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setMissionStatus(s)}
                  className="px-2.5 py-1 rounded-full transition-colors"
                  style={{
                    background: missionStatus === s ? 'var(--surface)' : 'transparent',
                    color: missionStatus === s ? 'var(--ink)' : 'var(--ink-3)',
                    border: missionStatus === s ? '1px solid var(--line)' : '1px solid transparent',
                    boxShadow: missionStatus === s ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    fontWeight: missionStatus === s ? 600 : 500,
                  }}
                >
                  {s === 'EN_ROUTE' ? 'En route' : s === 'ON_SITE_RESCUE' ? 'On site' : 'Completed'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile status switch */}
        <div className="sm:hidden mt-3 flex items-center gap-1 p-1 rounded-full border" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--line)' }}>
          {(['EN_ROUTE', 'ON_SITE_RESCUE', 'COMPLETED'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setMissionStatus(s)}
              className="flex-1 px-2 py-1.5 rounded-full text-[11px] font-medium transition-colors"
              style={{
                background: missionStatus === s ? 'var(--surface)' : 'transparent',
                color: missionStatus === s ? 'var(--ink)' : 'var(--ink-3)',
                border: missionStatus === s ? '1px solid var(--line)' : '1px solid transparent',
                fontWeight: missionStatus === s ? 600 : 500,
              }}
            >
              {s === 'EN_ROUTE' ? 'En route' : s === 'ON_SITE_RESCUE' ? 'On site' : 'Done'}
            </button>
          ))}
        </div>

        {/* Telemetry */}
        <div className="grid grid-cols-3 gap-2.5 mt-4">
          <div className="rounded-xl p-3 border text-center" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-center gap-1 text-[11px] font-medium" style={{ color: 'var(--ink-3)' }}>
              <Wifi className="w-3.5 h-3.5" style={{ color: 'var(--ink-3)' }} />
              Mesh Gateway
            </div>
            <div className="mt-1 text-[12px] font-semibold flex items-center justify-center gap-1" style={{ color: 'var(--ink-2)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ok)' }} />
              GW-01 LoRa
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-3)' }}>Linked · 2.4s ago</div>
          </div>
          <div className="rounded-xl p-3 border text-center" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-center gap-1 text-[11px] font-medium" style={{ color: 'var(--ink-3)' }}>
              <BatteryCharging className="w-3.5 h-3.5" style={{ color: 'var(--info)' }} />
              Battery
            </div>
            <div className="mt-1 text-[12px] font-semibold" style={{ color: 'var(--ink-2)' }}>84% · 4.2h</div>
            <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-3)' }}>Backup active</div>
          </div>
          <div className="rounded-xl p-3 border text-center" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--line)' }}>
            <div className="flex items-center justify-center gap-1 text-[11px] font-medium" style={{ color: 'var(--ink-3)' }}>
              <LifeBuoy className="w-3.5 h-3.5" style={{ color: 'var(--ok)' }} />
              Extracted
            </div>
            <div className="mt-1 text-[13px] font-bold" style={{ color: 'var(--ink)' }}>{rescuedCount} persons</div>
            <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-3)' }}>Safe at shelter</div>
          </div>
        </div>
      </div>

      {/* Assigned Target Zone */}
      <div className="card p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-semibold tracking-widest uppercase flex items-center gap-1.5" style={{ color: 'var(--ink-2)' }}>
            <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--ink-3)' }} />
            Assigned Target Zone
          </h3>
          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold tracking-wide border"
            style={{ background: 'var(--danger-soft)', borderColor: 'var(--danger-line)', color: 'var(--danger)' }}
          >
            <AlertTriangle className="w-3 h-3" style={{ color: 'var(--danger)' }} />
            PRIORITY — CRITICAL
          </span>
        </div>

        <div className="rounded-xl border p-3.5" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--line)' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center border shrink-0"
                  style={{ background: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink-3)' }}
                >
                  <Building2 className="w-3.5 h-3.5" style={{ color: 'var(--ink-3)' }} />
                </span>
                <h4 className="text-[13px] font-semibold leading-tight truncate" style={{ color: 'var(--ink)' }}>
                  {selectedBuilding?.name ?? 'No structure selected'}
                </h4>
              </div>
              <p className="text-[12px] mt-1.5 leading-snug" style={{ color: 'var(--ink-3)' }}>
                {selectedBuilding?.address ?? 'Select a building from the extraction form below'}
              </p>
            </div>
            <span
              className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border"
              style={{ background: 'var(--surface)', borderColor: 'var(--danger-line)', color: 'var(--danger)' }}
            >
              {selectedBuilding?.estimatedTrappedCount ?? 0} trapped
            </span>
          </div>

          <div
            className="mt-3 grid grid-cols-2 gap-3 pt-3 text-[11px]"
            style={{ borderTop: '1px solid var(--line)' }}
          >
            <div>
              <div className="font-medium tracking-wide uppercase text-[10px]" style={{ color: 'var(--ink-3)' }}>Vulnerable</div>
              <div className="mt-0.5 font-semibold" style={{ color: 'var(--ink-2)' }}>
                {selectedBuilding ? selectedBuilding.vulnerableGroups.children + selectedBuilding.vulnerableGroups.elderly : 0} elders / infants
              </div>
            </div>
            <div>
              <div className="font-medium tracking-wide uppercase text-[10px]" style={{ color: 'var(--ink-3)' }}>Structure</div>
              <div className="mt-0.5 font-semibold inline-flex items-center gap-1.5" style={{ color: 'var(--ink-2)' }}>
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold border"
                  style={{
                    background: 'var(--warn-soft)',
                    borderColor: 'var(--warn-line)',
                    color: 'var(--warn)'
                  }}
                >
                  {selectedBuilding?.structuralType ?? '—'}
                </span>
                <span className="text-[11px] font-normal" style={{ color: 'var(--ink-3)' }}>assessed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Safe Route */}
        <div
          className="rounded-xl border p-3 flex items-center justify-between gap-3"
          style={{ background: 'var(--info-soft)', borderColor: 'var(--info-line)' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center border shrink-0"
              style={{ background: 'var(--surface)', borderColor: 'var(--info-line)', color: 'var(--info)' }}
            >
              <Navigation className="w-4 h-4" style={{ color: 'var(--info)' }} />
            </span>
            <div className="min-w-0">
              <div className="text-[12px] font-semibold leading-none" style={{ color: 'var(--ink)' }}>Safe Navigation Corridor</div>
              <div className="text-[11px] mt-1 leading-none truncate" style={{ color: 'var(--ink-3)' }}>
                {roads.find(r => r.id === 'rd-02')?.name ?? 'Sector 4 North Overbridge (rd-02)'} · Verified 6 min ago
              </div>
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors"
            style={{ background: 'var(--surface)', borderColor: 'var(--info-line)', color: 'var(--info)' }}
          >
            Open route
          </button>
        </div>
      </div>

      {/* Log Rescued / Extracted Victims */}
      <form onSubmit={handleVictimExtractionSubmit} className="card p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-semibold tracking-widest uppercase flex items-center gap-1.5" style={{ color: 'var(--ink-2)' }}>
            <LifeBuoy className="w-3.5 h-3.5" style={{ color: 'var(--ok)' }} />
            Log Rescued / Extracted Victims
          </h3>
          <span className="text-[11px] hidden sm:inline-flex items-center gap-1" style={{ color: 'var(--ink-3)' }}>
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--ink-3)' }} />
            Field verified
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium block mb-1.5" style={{ color: 'var(--ink-2)' }}>Target structure</label>
            <div className="relative">
              <Building2 className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--ink-3)' }} />
              <select
                value={selectedBuildingId}
                onChange={(e) => setSelectedBuildingId(e.target.value)}
                className="w-full rounded-xl border pl-8 pr-3 py-2.5 text-[13px] font-medium focus:outline-none focus:ring-0 appearance-none"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--line)',
                  color: 'var(--ink)',
                }}
              >
                {buildings.length === 0 ? (
                  <option value="b-404">b-404 — No buildings loaded</option>
                ) : (
                  buildings.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.estimatedTrappedCount || 0} trapped)
                    </option>
                  ))
                )}
              </select>
            </div>
            <p className="text-[11px] mt-1.5" style={{ color: 'var(--ink-3)' }}>
              Selected: <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{selectedBuilding?.name ?? '—'}</span>
            </p>
          </div>

          <div>
            <label className="text-[11px] font-medium block mb-1.5" style={{ color: 'var(--ink-2)' }}>Extracted headcount</label>
            <input
              type="number"
              min={1}
              max={50}
              value={reportedVictimsInput}
              onChange={(e) => setReportedVictimsInput(e.target.value)}
              className="w-full rounded-xl border px-3 py-2.5 text-[13px] font-semibold focus:outline-none"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--line)',
                color: 'var(--ink)',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace'
              }}
            />
            <p className="text-[11px] mt-1.5" style={{ color: 'var(--ink-3)' }}>Range 1–50 per entry</p>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-medium block mb-1.5" style={{ color: 'var(--ink-2)' }}>
            Field notes <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea
            value={fieldNotes}
            onChange={(e) => setFieldNotes(e.target.value)}
            rows={2}
            placeholder="Injuries, triage needs, access constraints, shelter assignment…"
            className="w-full rounded-xl border px-3 py-2.5 text-[13px] focus:outline-none resize-none"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--line)',
              color: 'var(--ink)',
            }}
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors"
          style={{ background: 'var(--ok)', color: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}
        >
          <CheckCircle2 className="w-4 h-4" style={{ color: '#fff' }} />
          Confirm extraction to North Highland Shelter
        </button>

        <p className="text-[11px] text-center" style={{ color: 'var(--ink-3)' }}>
          This logs locally first and syncs via mesh when the gateway is reachable.
        </p>

        {showSuccessToast && (
          <div
            className="rounded-xl border px-3 py-2.5 flex items-center gap-2 text-[12px] font-medium"
            style={{ background: 'var(--ok-soft)', borderColor: 'var(--ok-line)', color: 'var(--ok)' }}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--ok)' }} />
            <span>Field report recorded locally — {reportedVictimsInput} persons added to {selectedBuilding?.name ?? selectedBuildingId}.</span>
          </div>
        )}
      </form>

      {/* Recon Photo & Damage Triage */}
      <div className="card p-4 sm:p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[11px] font-semibold tracking-widest uppercase flex items-center gap-1.5" style={{ color: 'var(--ink-2)' }}>
            <Camera className="w-3.5 h-3.5" style={{ color: 'var(--ink-3)' }} />
            Recon Photo & Damage Classification
          </h3>
          <span className="text-[11px] px-2 py-1 rounded-full border font-medium hidden sm:inline-flex" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--line)', color: 'var(--ink-3)' }}>
            Ties to {selectedBuilding?.name ?? 'selected'} record
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(['MODERATE', 'SEVERE', 'COLLAPSED'] as const).map((tag) => {
            const isActive = damageTag === tag;
            const tone =
              tag === 'COLLAPSED'
                ? { bg: 'var(--danger-soft)', border: 'var(--danger)', text: 'var(--danger)', dot: 'var(--danger)' }
                : tag === 'SEVERE'
                ? { bg: 'var(--warn-soft)', border: 'var(--warn)', text: 'var(--warn)', dot: 'var(--warn)' }
                : { bg: 'var(--info-soft)', border: 'var(--info)', text: 'var(--info)', dot: 'var(--info)' };
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setDamageTag(tag)}
                className="rounded-xl border px-2 py-2.5 text-center transition-colors"
                style={{
                  background: isActive ? tone.bg : 'var(--surface)',
                  borderColor: isActive ? tone.border : 'var(--line)',
                  color: isActive ? tone.text : 'var(--ink-3)',
                }}
              >
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: isActive ? tone.dot : 'var(--line)' }} />
                  {tag}
                </span>
                <span className="block text-[10px] mt-0.5 font-medium" style={{ color: isActive ? tone.text : 'var(--ink-3)', opacity: isActive ? 0.85 : 0.7 }}>
                  {tag === 'MODERATE' ? 'Habitable' : tag === 'SEVERE' ? 'Unsafe' : 'Uninhabitable'}
                </span>
              </button>
            );
          })}
        </div>

        <div
          onClick={() => setPhotoUploaded((v) => !v)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPhotoUploaded(v => !v); } }}
          className="rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-colors select-none"
          style={{
            borderColor: photoUploaded ? 'var(--ok-line)' : 'var(--line)',
            background: photoUploaded ? 'var(--ok-soft)' : 'var(--bg-subtle)',
            color: photoUploaded ? 'var(--ok)' : 'var(--ink-3)',
          }}
        >
          <span
            className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center border mb-2"
            style={{
              background: 'var(--surface)',
              borderColor: photoUploaded ? 'var(--ok-line)' : 'var(--line)',
              color: photoUploaded ? 'var(--ok)' : 'var(--ink-3)',
            }}
          >
            {photoUploaded ? <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--ok)' }} /> : <UploadCloud className="w-5 h-5" style={{ color: 'var(--ink-3)' }} />}
          </span>
          {photoUploaded ? (
            <div>
              <div className="text-[12px] font-semibold" style={{ color: 'var(--ok)' }}>Recon photo queued for review</div>
              <div className="text-[11px] mt-1" style={{ color: 'var(--ink-3)' }}>Tap to replace · Tagged {damageTag} · {selectedBuilding?.name ?? selectedBuildingId}</div>
            </div>
          ) : (
            <div>
              <div className="text-[12px] font-semibold" style={{ color: 'var(--ink-2)' }}>Upload damage photo</div>
              <div className="text-[11px] mt-1" style={{ color: 'var(--ink-3)' }}>From field device camera · JPG / HEIC · Auto-tags to {damageTag.toLowerCase()}</div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--ink-3)' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ok)' }} />
          Offline-capable — image is stored on device until mesh sync.
        </div>
      </div>

      {/* Road Block Reporting — preserves roads + onReportRoadBlock */}
      <div className="card p-4 sm:p-5 space-y-3.5">
        <h3 className="text-[11px] font-semibold tracking-widest uppercase flex items-center gap-1.5" style={{ color: 'var(--ink-2)' }}>
          <Truck className="w-3.5 h-3.5" style={{ color: 'var(--ink-3)' }} />
          Report Road Obstruction
        </h3>
        <p className="text-[12px] leading-snug" style={{ color: 'var(--ink-3)' }}>
          Flag a blocked segment so routing excludes it for trailing teams. Uses the live <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>roads</span> feed.
        </p>

        <form onSubmit={handleRoadBlockSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium block mb-1.5" style={{ color: 'var(--ink-2)' }}>Road segment</label>
              <div className="relative">
                <Navigation className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--ink-3)' }} />
                <select
                  value={selectedRoadId}
                  onChange={(e) => setSelectedRoadId(e.target.value)}
                  className="w-full rounded-xl border pl-8 pr-3 py-2.5 text-[13px] font-medium focus:outline-none appearance-none"
                  style={{ background: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                >
                  {roads.length === 0 ? (
                    <option value="rd-02">rd-02 — Sector 4 North Overbridge</option>
                  ) : (
                    roads.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.id} — {(r as any).name ?? (r as any).status ?? 'segment'}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium block mb-1.5" style={{ color: 'var(--ink-2)' }}>Reason</label>
              <input
                value={roadBlockReason}
                onChange={(e) => setRoadBlockReason(e.target.value)}
                placeholder="Debris, flooding, collapse…"
                className="w-full rounded-xl border px-3 py-2.5 text-[13px] focus:outline-none"
                style={{ background: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold border transition-colors"
            style={{ background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff' }}
          >
            <Send className="w-3.5 h-3.5" style={{ color: '#fff' }} />
            Report block
          </button>
          <span className="text-[11px] sm:ml-2 inline-flex items-center gap-1" style={{ color: 'var(--ink-3)' }}>
            <AlertTriangle className="w-3 h-3" style={{ color: 'var(--warn)' }} />
            Dispatch is notified immediately
          </span>
        </form>
      </div>

      {/* Footer meta */}
      <div className="px-1 py-1 flex items-center justify-between text-[11px]" style={{ color: 'var(--ink-3)' }}>
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--ink-3)' }} />
          RESQ-AI Field Ops · Encrypted & mesh-first
        </span>
        <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
          {currentTeam.lat.toFixed(4)}, {currentTeam.lng.toFixed(4)}
        </span>
      </div>
    </div>
  );
};
