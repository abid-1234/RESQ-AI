import { useState } from "react";
import {
  Building,
  SensorNode,
  CommunityGateway,
  Shelter,
  Hospital,
  RescueTeam,
  Ambulance,
  RoadSegment,
  Incident,
  PublicAlert,
  AuditLog,
  SOSRequest,
  OperationalMode,
  SeverityLevel,
  UserRole,
  BuildingStatus,
} from "./types";
import {
  INITIAL_BUILDINGS,
  INITIAL_SENSORS,
  INITIAL_GATEWAYS,
  INITIAL_SHELTERS,
  INITIAL_HOSPITALS,
  INITIAL_RESCUE_TEAMS,
  INITIAL_AMBULANCES,
  INITIAL_ROADS,
  INITIAL_INCIDENTS,
  INITIAL_ALERTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SOS_REQUESTS,
} from "./data/mockDistrictData";
import { calculateBuildingRisk, SimulationParams, RiskAnalysisResult } from "./services/riskEngine";

import { lazy, Suspense } from "react";
import { CommandHeader } from "./components/header/CommandHeader";
const GISCommandMap = lazy(() => import("./components/gis/GISCommandMap").then(m => ({ default: m.GISCommandMap })));
const GISGlobeMap = lazy(() => import("./components/gis/GISGlobeMap").then(m => ({ default: m.GISGlobeMap })));
import { BuildingModal } from "./components/gis/BuildingModal";
import { SimulationLab } from "./components/simulation/SimulationLab";
import { ResqCopilot } from "./components/copilot/ResqCopilot";
import { FieldOfficerApp } from "./components/field/FieldOfficerApp";
import { CitizenApp } from "./components/citizen/CitizenApp";
import { RelocationEngineView } from "./components/relocation/RelocationEngineView";
import { AnalyticsDashboard } from "./components/analytics/AnalyticsDashboard";
import { AlertBroadcastModal } from "./components/alerts/AlertBroadcastModal";
import { WallDisplayMode } from "./components/command/WallDisplayMode";
import { MotionCursor } from "./components/motion/MotionCursor";

export default function App() {
  const [buildings, setBuildings] = useState<Building[]>(INITIAL_BUILDINGS);
  const [sensors] = useState<SensorNode[]>(INITIAL_SENSORS);
  const [gateways] = useState<CommunityGateway[]>(INITIAL_GATEWAYS);
  const [shelters, setShelters] = useState<Shelter[]>(INITIAL_SHELTERS);
  const [hospitals] = useState<Hospital[]>(INITIAL_HOSPITALS);
  const [rescueTeams, setRescueTeams] = useState<RescueTeam[]>(INITIAL_RESCUE_TEAMS);
  const [ambulances] = useState<Ambulance[]>(INITIAL_AMBULANCES);
  const [roads, setRoads] = useState<RoadSegment[]>(INITIAL_ROADS);
  const [activeIncident, setActiveIncident] = useState<Incident>(INITIAL_INCIDENTS[0]);
  const [alerts, setAlerts] = useState<PublicAlert[]>(INITIAL_ALERTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [sosRequests, setSosRequests] = useState<SOSRequest[]>(INITIAL_SOS_REQUESTS);

  const [operationalMode, setOperationalMode] = useState<OperationalMode>("PRE_DISASTER");
  const [severityLevel] = useState<SeverityLevel>("LEVEL_4_CRITICAL");
  const [userRole, setUserRole] = useState<UserRole>("DISTRICT_AUTHORITY");
  const [activeView, setActiveView] = useState<string>("COMMAND_MAP");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isWallMode, setIsWallMode] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedSensor, setSelectedSensor] = useState<SensorNode | null>(null);
  const [redZoneRadius, setRedZoneRadius] = useState(1400);

  void selectedSensor;
  void auditLogs;

  const playAlertSiren = () => {
    if (!soundEnabled) return;
    try {
      const AC: any = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      const ctx: AudioContext = new AC();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.4);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.1);
    } catch {
      /* autoplay blocked */
    }
  };

  const handleApplySimulation = (params: SimulationParams, results: RiskAnalysisResult) => {
    setRedZoneRadius(results.redZoneRadiusMeters);
    setBuildings((prev) =>
      prev.map((b) => {
        const res = calculateBuildingRisk(b, params);
        let status: BuildingStatus = "SAFE";
        if (res.overallScore >= 85) status = "CRITICAL";
        else if (res.overallScore >= 70) status = "HIGH_RISK";
        else if (res.overallScore >= 45) status = "WATCH";
        else if (res.overallScore >= 30) status = "MONITOR";
        return {
          ...b,
          overallRiskScore: res.overallScore,
          currentHazardScore: res.hazardScore,
          evacuationPriority: res.evacuationPriority,
          evacuationStatus: status,
          estimatedTrappedCount: res.estimatedTrapped,
        };
      }),
    );
    setActiveIncident((prev) => ({
      ...prev,
      type: params.hazardType,
      estimatedExposedPopulation: results.exposedPopulationTotal,
      vulnerableCount: results.vulnerablePersonsCount,
    }));
    setRoads((prev) =>
      prev.map((r) => (r.id === "rd-03" ? { ...r, status: params.riverGaugeHeightM > 3.8 ? "FLOODED" : "OPEN" } : r)),
    );
  };

  const handleDispatchTeam = (building: Building, teamId: string) => {
    setRescueTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, status: "ON_SITE_RESCUE", lat: building.lat + 0.0005, lng: building.lng + 0.0005 } : t)),
    );
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      role: userRole,
      officerName: "District Operations Desk",
      action: "RESCUE_DISPATCH",
      newState: "DISPATCHED",
      reason: `Dispatched unit ${teamId} to ${building.name} (${building.code}). Trapped: ${building.estimatedTrappedCount ?? 0}.`,
      dataReference: building.code,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    setSelectedBuilding(null);
    playAlertSiren();
  };

  const handleReportVictim = (buildingId: string, count: number) => {
    setBuildings((prev) =>
      prev.map((b) =>
        b.id === buildingId
          ? {
              ...b,
              estimatedTrappedCount: Math.max(0, (b.estimatedTrappedCount ?? count) - count),
              evacuationStatus: Math.max(0, (b.estimatedTrappedCount ?? count) - count) === 0 ? "SAFE" : b.evacuationStatus,
            }
          : b,
      ),
    );
    setShelters((prev) => prev.map((s, i) => (i === 0 ? { ...s, currentOccupancy: Math.min(s.capacity, s.currentOccupancy + count) } : s)));
  };

  const handleTriggerSOS = (details: { name: string; phone: string; trappedCount: number; urgency: string; notes: string }) => {
    const sos: SOSRequest = {
      id: `sos-${Date.now()}`,
      citizenName: details.name,
      phone: details.phone,
      lat: 17.3762 + (Math.random() - 0.5) * 0.004,
      lng: 78.479 + (Math.random() - 0.5) * 0.004,
      trappedCount: details.trappedCount,
      medicalUrgency: "FLOOD_RISING",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "PENDING_TRIAGE",
      notes: details.notes,
      batteryLevel: 68,
      networkType: "LORA",
    };
    setSosRequests((prev) => [sos, ...prev]);
    playAlertSiren();
  };

  const handleDispatchAlert = (alertData: any) => {
    const next: PublicAlert = {
      id: `alt-${Date.now()}`,
      title: alertData.headline || "EMERGENCY HAZARD ALERT",
      hazardType: "FLOOD",
      urgency: "CRITICAL",
      targetDistrict: "Sector 4 River Basin",
      targetRadiusKm: 1.4,
      centerLat: 17.3765,
      centerLng: 78.4795,
      languages: {
        en: {
          headline: alertData.headline || "Flash Flood Alert",
          body: alertData.instruction || "Evacuate lowlands.",
          safeAction: "Move to North Highland Shelter",
        },
      },
      channels: ["SMS", "PUSH", "VOICE_BROADCAST", "SACHET_CAP"],
      sentTimestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      metrics: { targetedHouseholds: 3420, delivered: 3380, acknowledged: 2950, failed: 40 },
      recommendedSafeShelter: "North Highland Shelter 1",
    };
    setAlerts((prev) => [next, ...prev]);
    playAlertSiren();
  };

  const highRiskCount = buildings.filter((b) => b.overallRiskScore >= 70).length;
  const overallRisk = Math.min(96, Math.round(50 + (highRiskCount / buildings.length) * 45));

  return (
    <div className="min-h-screen bg-paper text-[var(--ink)] flex flex-col selection:bg-[var(--accent)] selection:text-white">
      <MotionCursor />

      <CommandHeader
        operationalMode={operationalMode}
        setOperationalMode={setOperationalMode}
        severityLevel={severityLevel}
        userRole={userRole}
        setUserRole={setUserRole}
        activeView={activeView}
        setActiveView={setActiveView}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onOpenAlertModal={() => setIsAlertModalOpen(true)}
        onToggleWallMode={() => setIsWallMode(true)}
        unreadAlertCount={alerts.length}
        overallRisk={overallRisk}
      />

      {/* subtle top rule + view */}
      <main className="flex-1 px-3 sm:px-4 lg:px-5 py-4 sm:py-5 flex flex-col max-w-[1600px] w-full mx-auto">
        {/* View switch — soft crossfade, not a flash */}
        <div key={activeView} className="flex-1 flex flex-col" style={{ animation: "fadeUp .36s var(--ease-out) both" }}>
          {activeView === "COMMAND_MAP" && (
            <Suspense fallback={<div className="min-h-[560px] grid place-items-center rounded-[16px] border border-[var(--line)] bg-white text-[12px] text-[var(--ink-3)]">Loading map…</div>}>
              <div className="min-h-[560px] flex flex-col">
                {new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('map') !== 'globe' ? (
                  <GISCommandMap
                    buildings={buildings}
                    sensors={sensors}
                    gateways={gateways}
                    shelters={shelters}
                    hospitals={hospitals}
                    rescueTeams={rescueTeams}
                    ambulances={ambulances}
                    roads={roads}
                    sosRequests={sosRequests}
                    operationalMode={operationalMode}
                    redZoneRadiusMeters={redZoneRadius}
                    onSelectBuilding={(b) => setSelectedBuilding(b)}
                    onSelectSensor={(s) => setSelectedSensor(s)}
                    onSelectShelter={() => setActiveView("RELOCATION_LAB")}
                    onSelectTeam={() => setActiveView("FIELD_OFFICER")}
                    selectedBuildingId={selectedBuilding?.id}
                    selectedSensorId={selectedSensor?.id}
                  />
                ) : (
                  <GISGlobeMap
                    buildings={buildings}
                    sensors={sensors}
                    gateways={gateways}
                    shelters={shelters}
                    hospitals={hospitals}
                    rescueTeams={rescueTeams}
                    ambulances={ambulances}
                    roads={roads}
                    sosRequests={sosRequests}
                    operationalMode={operationalMode}
                    redZoneRadiusMeters={redZoneRadius}
                    onSelectBuilding={(b) => setSelectedBuilding(b)}
                    onSelectSensor={(s) => setSelectedSensor(s)}
                    onSelectShelter={() => setActiveView("RELOCATION_LAB")}
                    onSelectTeam={() => setActiveView("FIELD_OFFICER")}
                    selectedBuildingId={selectedBuilding?.id}
                    selectedSensorId={selectedSensor?.id}
                  />
                )}
              </div>
            </Suspense>
          )}
          {activeView === "SIMULATION_LAB" && (
            <SimulationLab buildings={buildings} shelters={shelters} sensors={sensors} onApplySimulation={handleApplySimulation} onBroadcastSimAlert={() => setIsAlertModalOpen(true)} />
          )}
          {activeView === "COPILOT" && <ResqCopilot buildings={buildings} shelters={shelters} sensors={sensors} activeIncident={activeIncident} overallRisk={overallRisk} />}
          {activeView === "FIELD_OFFICER" && (
            <FieldOfficerApp
              teams={rescueTeams}
              buildings={buildings}
              roads={roads}
              onReportVictim={handleReportVictim}
              onReportRoadBlock={(roadId, reason) => setRoads((prev) => prev.map((r) => (r.id === roadId ? { ...r, status: "BLOCKED", blockageReason: reason } : r)))}
            />
          )}
          {activeView === "CITIZEN_PORTAL" && <CitizenApp shelters={shelters} alerts={alerts} onTriggerSOS={handleTriggerSOS} />}
          {activeView === "RELOCATION_LAB" && <RelocationEngineView shelters={shelters} buildings={buildings} />}
          {activeView === "ANALYTICS" && <AnalyticsDashboard sensors={sensors} buildings={buildings} />}
        </div>
      </main>

      {/* Bottom status — calm, not a ticker */}
      <footer className="sticky bottom-0 z-30 border-t border-[var(--line)] bg-[rgba(255,255,255,.86)] backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-5 h-[44px] flex items-center justify-between gap-4 text-[11px]">
          <div className="hidden lg:flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--ink-2)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--ok)]" />
              {rescueTeams.filter((t) => t.status === "AVAILABLE" || t.status === "ON_SITE_RESCUE").length} teams active
            </span>
            <span className="text-[var(--ink-3)]">
              {ambulances.length} medical units · {buildings.filter((b) => (b.estimatedTrappedCount ?? 0) > 0).length} sites with trapped persons
            </span>
          </div>

          <div className="flex-1 lg:flex-none flex items-center gap-2 min-w-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[var(--ink-3)] whitespace-nowrap">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              Live telemetry
            </span>
            <span className="hidden sm:inline text-[var(--ink-5)]">·</span>
            <span className="truncate text-[var(--ink-2)]">
              Sensor GW-42 water +12 cm/hr · AI red-zone { (redZoneRadius/1000).toFixed(1)} km · Shelters 42% intake · Sentinel-2 SAR synced
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <span className="text-[var(--ink-4)]">Readiness</span>
            <span className="inline-flex gap-1">
              <i className="h-1.5 w-4 rounded-full bg-[var(--ok)] block" />
              <i className="h-1.5 w-4 rounded-full bg-[var(--ok)] block" />
              <i className="h-1.5 w-4 rounded-full bg-[var(--ok)] block" />
              <i className="h-1.5 w-4 rounded-full bg-[var(--warn)] block" />
              <i className="h-1.5 w-4 rounded-full bg-[var(--line-strong)] block" />
            </span>
            <span className="hidden xl:inline text-[var(--ink-3)] border-l border-[var(--line)] pl-3">
              Satellite sync <strong className="text-[var(--ink)]">92%</strong> <span className="text-[var(--ink-4)]">· 24 ms</span>
            </span>
          </div>
        </div>
      </footer>

      {selectedBuilding && (
        <BuildingModal building={selectedBuilding} shelters={shelters} rescueTeams={rescueTeams} onClose={() => setSelectedBuilding(null)} onDispatchTeam={handleDispatchTeam} />
      )}
      {isAlertModalOpen && <AlertBroadcastModal onClose={() => setIsAlertModalOpen(false)} onDispatchAlert={handleDispatchAlert} />}
      {isWallMode && <WallDisplayMode buildings={buildings} sensors={sensors} shelters={shelters} teams={rescueTeams} incident={activeIncident} overallRisk={overallRisk} onExitWallMode={() => setIsWallMode(false)} />}
    </div>
  );
}
