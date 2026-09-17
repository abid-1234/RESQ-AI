import React, { useState, useEffect } from "react";
import {
  Shield,
  Activity,
  Radio,
  Satellite,
  Layers,
  Bell,
  Maximize2,
  Volume2,
  VolumeX,
  Users,
  Compass,
  Cpu,
  Sparkles,
} from "lucide-react";
import { OperationalMode, SeverityLevel, UserRole } from "../../types";

interface CommandHeaderProps {
  operationalMode: OperationalMode;
  setOperationalMode: (mode: OperationalMode) => void;
  severityLevel: SeverityLevel;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  activeView: string;
  setActiveView: (view: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  onOpenAlertModal: () => void;
  onToggleWallMode: () => void;
  unreadAlertCount: number;
  overallRisk: number;
}

type SeverityMeta = { label: string; dot: string; cls: string };

function severityMeta(level: SeverityLevel): SeverityMeta {
  switch (level) {
    case "LEVEL_5_MASS_EMERGENCY":
      return { label: "Level 5 · Mass emergency", dot: "bg-[var(--danger)]", cls: "bg-[var(--danger)] text-white border-[var(--danger)]" };
    case "LEVEL_4_CRITICAL":
      return { label: "Level 4 · Critical", dot: "bg-[var(--danger)]", cls: "bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger-line)]" };
    case "LEVEL_3_WARNING":
      return { label: "Level 3 · Warning", dot: "bg-[var(--warn)]", cls: "bg-[var(--warn-soft)] text-[var(--warn)] border-[var(--warn-line)]" };
    case "LEVEL_2_WATCH":
      return { label: "Level 2 · Watch", dot: "bg-[var(--warn)]", cls: "bg-white text-[var(--ink-2)] border-[var(--line)]" };
    default:
      return { label: "Level 1 · Normal", dot: "bg-[var(--ok)]", cls: "bg-[var(--ok-soft)] text-[var(--ok)] border-[var(--ok-line)]" };
  }
}

const NAV: { id: string; label: string; icon: React.ElementType }[] = [
  { id: "COMMAND_MAP", label: "Map", icon: Compass },
  { id: "SIMULATION_LAB", label: "Simulation", icon: Cpu },
  { id: "RELOCATION_LAB", label: "Relocation", icon: Layers },
  { id: "COPILOT", label: "Copilot", icon: Sparkles },
  { id: "FIELD_OFFICER", label: "Field", icon: Radio },
  { id: "CITIZEN_PORTAL", label: "Citizen", icon: Users },
  { id: "ANALYTICS", label: "Analytics", icon: Activity },
];

export const CommandHeader: React.FC<CommandHeaderProps> = ({
  operationalMode,
  setOperationalMode,
  severityLevel,
  userRole,
  setUserRole,
  activeView,
  setActiveView,
  soundEnabled,
  setSoundEnabled,
  onOpenAlertModal,
  onToggleWallMode,
  unreadAlertCount,
}) => {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const t = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
      const tz = new Intl.DateTimeFormat([], { timeZoneName: "short" }).formatToParts(now).find((p) => p.type === "timeZoneName")?.value ?? "";
      setCurrentTime(`${t} ${tz}`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const sev = severityMeta(severityLevel);

  return (
    <header className="sticky top-0 z-40 bg-[rgba(255,255,255,.92)] backdrop-blur-xl border-b border-[var(--line)]">
      {/* hairline accent — replaces neon edge */}
      <div className="h-[2px] w-full bg-gradient-to-r from-[var(--accent)] via-[var(--accent)] to-transparent opacity-90" />

      <div className="max-w-[1600px] mx-auto px-3 sm:px-4">
        {/* Row 1 — identity + status + utilities */}
        <div className="flex items-center gap-3 py-2.5">
          {/* Brand */}
          <button
            data-cursor="hover"
            onClick={() => setActiveView("COMMAND_MAP")}
            className="flex items-center gap-2.5 shrink-0 text-left transition-opacity hover:opacity-90 active:scale-[.99]"
          >
            <span className="h-8 w-8 rounded-[9px] bg-[var(--accent)] text-white grid place-items-center shadow-sm">
              <Shield className="h-[16px] w-[16px]" strokeWidth={2.1} />
            </span>
            <span className="leading-none">
              <span className="block text-[15px] font-extrabold tracking-[.14em] text-[var(--ink)]">RESQ-AI</span>
              <span className="block text-[10px] font-semibold tracking-[.16em] text-[var(--ink-3)] -mt-0.5">COMMAND CENTER</span>
            </span>
          </button>

          {/* Status cluster — desktop only */}
          <div className="hidden lg:flex items-center gap-2 ml-2 pl-3 border-l border-[var(--line)]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ok-line)] bg-[var(--ok-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ok)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--ok)] animate-pulse" />
              System active
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${sev.cls}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${sev.dot}`} />
              {sev.label}
            </span>

            {/* Mode switch — segmented control */}
            <span className="ml-1 inline-flex rounded-full border border-[var(--line)] bg-[var(--bg-subtle)] p-1 gap-1">
              <button
                data-cursor="hover"
                onClick={() => setOperationalMode("PRE_DISASTER")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                  operationalMode === "PRE_DISASTER" ? "bg-white border border-[var(--line)] shadow-sm text-[var(--ink)]" : "text-[var(--ink-3)] hover:text-[var(--ink)]"
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                Pre-disaster
              </button>
              <button
                data-cursor="hover"
                onClick={() => setOperationalMode("POST_DISASTER_EMERGENCY")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                  operationalMode === "POST_DISASTER_EMERGENCY"
                    ? "bg-[var(--danger)] text-white shadow-sm"
                    : "text-[var(--ink-3)] hover:text-[var(--ink)]"
                }`}
              >
                <Radio className="h-3.5 w-3.5" />
                Emergency ops
              </button>
            </span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Utilities — clock + satellite + role + actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center rounded-full border border-[var(--line)] bg-white px-2.5 py-1 font-mono-code text-[11px] font-semibold tracking-wide text-[var(--ink-2)]">
              {currentTime || "—"}
            </span>

            <span className="hidden xl:inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white px-2.5 py-1 text-[11px] text-[var(--ink-3)]">
              <Satellite className="h-3.5 w-3.5 text-[var(--ink-2)]" />
              <span className="font-mono-code font-semibold tracking-wide text-[var(--ink-2)]">SENTINEL-2</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--ok)]" />
            </span>

            <label className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white pl-2 pr-1 py-1 max-w-[46vw] sm:max-w-none">
              <Users className="h-3.5 w-3.5 text-[var(--ink-3)] shrink-0" />
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                aria-label="Switch department / role"
                className="bg-transparent pr-6 text-[12px] font-semibold text-[var(--ink-2)] outline-none cursor-pointer min-w-0"
              >
                <option value="SUPER_ADMIN">State HQ</option>
                <option value="STATE_AUTHORITY">State Authority</option>
                <option value="DISTRICT_AUTHORITY">District Magistrate</option>
                <option value="FIELD_OFFICER">Field Officer</option>
                <option value="POLICE">Police</option>
                <option value="FIRE_RESCUE">Fire & Rescue</option>
                <option value="MEDICAL_OFFICER">Medical Officer</option>
                <option value="SHELTER_MANAGER">Shelter Manager</option>
                <option value="CITIZEN">Citizen</option>
              </select>
            </label>

            <button
              data-cursor="hover"
              onClick={onOpenAlertModal}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--danger)] px-3 sm:px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-[transform,opacity] hover:opacity-95 active:scale-[.98]"
            >
              <Bell className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">SACHET</span>
              {unreadAlertCount > 0 && (
                <span className="ml-0.5 inline-grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[11px] font-extrabold leading-none text-[var(--danger)]">
                  {unreadAlertCount}
                </span>
              )}
            </button>

            <button
              data-cursor="hover"
              onClick={() => setSoundEnabled(!soundEnabled)}
              aria-label={soundEnabled ? "Mute siren" : "Enable siren"}
              className={`grid h-8 w-8 place-items-center rounded-full border transition-colors ${soundEnabled ? "bg-white border-[var(--line)] text-[var(--ink)]" : "bg-white border-[var(--line)] text-[var(--ink-3)]"}`}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            <button
              data-cursor="hover"
              onClick={onToggleWallMode}
              aria-label="Wall display"
              className="hidden sm:grid h-8 w-8 place-items-center rounded-full border border-[var(--line)] bg-white text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Row 2 — navigation: calm pill nav, active is paper-white, not neon */}
        <nav className="flex items-center gap-1 overflow-x-auto pb-2.5 -mx-1 px-1 scrollbar-thin">
          {NAV.map((item) => {
            const isActive = activeView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                data-cursor="hover"
                onClick={() => setActiveView(item.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-all active:scale-[.985] ${
                  isActive
                    ? "bg-[var(--accent)] border-[var(--accent)] text-white shadow-sm"
                    : "bg-white border-[var(--line)] text-[var(--ink-2)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-white/90" : "text-[var(--ink-3)]"}`} />
                {item.label}
              </button>
            );
          })}

          {/* mobile mode switch — visible only when desktop cluster is hidden */}
          <span className="lg:hidden ml-1 inline-flex shrink-0 rounded-full border border-[var(--line)] bg-[var(--bg-subtle)] p-1 gap-1">
            <button
              onClick={() => setOperationalMode("PRE_DISASTER")}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold ${operationalMode === "PRE_DISASTER" ? "bg-white shadow-sm border border-[var(--line)] text-[var(--ink)]" : "text-[var(--ink-3)]"}`}
            >
              Pre
            </button>
            <button
              onClick={() => setOperationalMode("POST_DISASTER_EMERGENCY")}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold ${operationalMode === "POST_DISASTER_EMERGENCY" ? "bg-[var(--danger)] text-white" : "text-[var(--ink-3)]"}`}
            >
              Ops
            </button>
          </span>
        </nav>
      </div>
    </header>
  );
};
