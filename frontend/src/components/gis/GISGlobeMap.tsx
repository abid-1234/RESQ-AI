import React, { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Building,
  SensorNode,
  CommunityGateway,
  Shelter,
  Hospital,
  RescueTeam,
  Ambulance,
  RoadSegment,
  SOSRequest,
  OperationalMode,
} from "../../types";
import { Building2, Radio, Home, ShieldAlert, Truck, AlertTriangle, Layers, Navigation, Compass, Search } from "lucide-react";
import { indiaHazardSeeds, type IndiaHazardSeed } from "../../data/indiaHazardSeeds";

interface Props {
  buildings: Building[];
  sensors: SensorNode[];
  gateways: CommunityGateway[];
  shelters: Shelter[];
  hospitals: Hospital[];
  rescueTeams: RescueTeam[];
  ambulances: Ambulance[];
  roads: RoadSegment[];
  sosRequests: SOSRequest[];
  operationalMode: OperationalMode;
  redZoneRadiusMeters: number;
  onSelectBuilding: (b: Building) => void;
  onSelectSensor: (s: SensorNode) => void;
  onSelectShelter: (s: Shelter) => void;
  onSelectTeam: (t: RescueTeam) => void;
  selectedBuildingId?: string;
  selectedSensorId?: string;
}

const FALLBACK_HAZARD: [number, number] = [17.3765, 78.4795];
const INDIA_CENTER: [number, number] = [22.0, 78.5];

function circleGeoJSON(center: [number, number], radiusM: number, points = 64): GeoJSON.Feature<GeoJSON.Polygon> {
  const [lat, lng] = center;
  const coords: [number, number][] = [];
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dx = (radiusM * Math.cos(angle)) / 111320 / Math.cos((lat * Math.PI) / 180);
    const dy = (radiusM * Math.sin(angle)) / 111320;
    coords.push([lng + dx, lat + dy]);
  }
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [coords] } };
}

const GLOBE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
      paint: { "raster-opacity": 0.98 } as any,
    },
  ],
} as any;

const SEVERITY_COLOR: Record<string, { halo: string; fill: string; outline: string }> = {
  LEVEL_2_WATCH:          { halo: "#EAB308", fill: "#EAB308", outline: "#CA8A04" },
  LEVEL_3_WARNING:        { halo: "#F59E0B", fill: "#F97316", outline: "#EA580C" },
  LEVEL_4_CRITICAL:       { halo: "#DC2626", fill: "#DC2626", outline: "#B91C1C" },
  LEVEL_5_MASS_EMERGENCY: { halo: "#991B1B", fill: "#991B1B", outline: "#7F1D1D" },
  LEVEL_5_EXTREME:        { halo: "#991B1B", fill: "#991B1B", outline: "#7F1D1D" },
};
function severityColors(sev: string) {
  return SEVERITY_COLOR[sev] ?? SEVERITY_COLOR.LEVEL_3_WARNING;
}
// Single shared point source id (reused across all clusters for halo circles)
const CLUSTER_HALO_SOURCE = "hz-cluster-halos";
const GPS_ACC_IDS = ["gps-accuracy", "gps-accuracy-line"] as const;

function removeHazardArtifacts(map: maplibregl.Map) {
  for (const id of GPS_ACC_IDS) { if (map.getLayer(id)) try { map.removeLayer(id); } catch {} }
  for (const id of GPS_ACC_IDS) { if (map.getSource(id)) try { map.removeSource(id); } catch {} }
  // Cluster layers are per-seed ids: hz-c-<id>[-halo|-core|-fill|-outline]
  // Remove in bulk by iterating current style layers/sources
  try {
    const style: any = (map as any).getStyle?.();
    const layers: any[] = style?.layers ?? [];
    for (const l of [...layers]) {
      if (typeof l.id === "string" && l.id.startsWith("hz-c-")) {
        if (map.getLayer(l.id)) try { map.removeLayer(l.id); } catch {}
      }
    }
  } catch {}
  try {
    const style: any = (map as any).getStyle?.();
    const sources: Record<string, any> = style?.sources ?? {};
    for (const sid of Object.keys(sources)) {
      if (sid === CLUSTER_HALO_SOURCE || sid.startsWith("hz-c-") || sid === "hz-cluster-halos") {
        if (map.getSource(sid)) try { map.removeSource(sid); } catch {}
      }
    }
  } catch {}
  // Legacy single-zone ids (from prior build) — clean up if present
  for (const id of ["hz-halos","hz-yellow-halo","hz-orange-halo","hz-red-halo","hz-red-core","hz-single-halo","hz-single-yellow-halo","hz-single-orange-halo","hz-single-red-halo","hz-single-red-core","hz-yellow","hz-orange","hz-red","hz-outline","hz-yellow-line","hz-orange-line"] as const) {
    if ((map as any).getLayer?.(id)) try { map.removeLayer(id as string); } catch {}
  }
  for (const id of ["hz-halos","hz-yellow-halo","hz-orange-halo","hz-red-halo","hz-red-core","hz-single-halo","hz-yellow","hz-orange","hz-red","hz-outline","gps-accuracy","gps-accuracy-line","hz-yellow-line","hz-orange-line"] as const) {
    if ((map as any).getSource?.(id)) try { map.removeSource(id as string); } catch {}
  }
}

function drawHazardZones(
  map: maplibregl.Map,
  seeds: IndiaHazardSeed[],
  gpsAccuracyM: number | null,
  isAnchoredToUser: boolean,
  showRedZone: boolean,
) {
  try { removeHazardArtifacts(map); } catch (e) { console.warn("[hazard] removeHazardArtifacts", e); try { removeHazardArtifacts(map); } catch {} }
  if (!showRedZone) return;
  if (!map.isStyleLoaded()) return;

  // GPS accuracy halo for the live-anchored seed (first entry when isAnchoredToUser)
  if (isAnchoredToUser && gpsAccuracyM != null && gpsAccuracyM > 0 && seeds.length) {
    const live = seeds[0];
    const accFC = circleGeoJSON(live.center, gpsAccuracyM);
    map.addSource("gps-accuracy", { type: "geojson", data: accFC as any });
    map.addLayer({ id: "gps-accuracy", type: "fill", source: "gps-accuracy", paint: { "fill-color": "#2563EB", "fill-opacity": 0.08 } } as any);
    map.addLayer({ id: "gps-accuracy-line", type: "line", source: "gps-accuracy", paint: { "line-color": "#2563EB", "line-width": 1.2, "line-opacity": 0.35, "line-dasharray": [4, 3] } } as any);
  }

  if (!seeds.length) return;

  // ── Pixel halos: one shared Point FeatureCollection, one circle layer per severity
  // Visible at India overview (z~4.2) where meter polygons are sub-pixel. Scale with map zoom via interpolate.
  const haloFeatures: GeoJSON.Feature<GeoJSON.Point>[] = seeds.map((s) => ({
    type: "Feature",
    properties: { id: s.id, severity: s.severity, radiusM: s.radiusM, label: s.label, state: s.state },
    geometry: { type: "Point", coordinates: [s.center[1], s.center[0]] },
  }));
  const haloFC: GeoJSON.FeatureCollection<GeoJSON.Point> = { type: "FeatureCollection", features: haloFeatures as any };
  map.addSource(CLUSTER_HALO_SOURCE, { type: "geojson", data: haloFC as any });

  // Group seeds by severity for batched circle layers with per-severity coloring
  const bySeverity = new Map<string, IndiaHazardSeed[]>();
  for (const s of seeds) {
    const k = s.severity;
    if (!bySeverity.has(k)) bySeverity.set(k, []);
    bySeverity.get(k)!.push(s);
  }
  // Create one halo circle layer per severity present; filter by severity property
  // Radius ramps with zoom so clusters stay legible at z4 and don't dominate at z10
  const haloRadiusExpr = (base: number) =>
    ["interpolate", ["linear"], ["zoom"], 3, base * 0.55, 4.2, base, 7, base * 1.15, 11, base * 1.6] as any;

  for (const [sev, group] of bySeverity) {
    const col = severityColors(sev);
    const isRed = sev === "LEVEL_4_CRITICAL" || sev === "LEVEL_5_MASS_EMERGENCY" || sev === "LEVEL_5_EXTREME";
    const isWarn = sev === "LEVEL_3_WARNING";
    // Outer halo size encodes severity tier
    const outerR = isRed ? 30 : isWarn ? 22 : 16;
    const innerR = isRed ? 12 : isWarn ? 9 : 7;
    const safeSev = String(sev).replace(/"/g, "");
    // Outer soft halo
    map.addLayer({
      id: `hz-c-${safeSev}-halo`,
      type: "circle",
      source: CLUSTER_HALO_SOURCE,
      filter: ["==", ["get", "severity"], sev] as any,
      paint: {
        "circle-radius": haloRadiusExpr(outerR),
        "circle-color": col.halo,
        "circle-opacity": isRed ? 0.22 : 0.16,
        "circle-blur": 0.42,
        "circle-stroke-width": 1,
        "circle-stroke-color": col.halo,
        "circle-stroke-opacity": 0.18,
      } as any,
    });
    // Inner core
    map.addLayer({
      id: `hz-c-${safeSev}-core`,
      type: "circle",
      source: CLUSTER_HALO_SOURCE,
      filter: ["==", ["get", "severity"], sev] as any,
      paint: {
        "circle-radius": haloRadiusExpr(innerR),
        "circle-color": col.halo,
        "circle-opacity": 1,
        "circle-stroke-width": 1.6,
        "circle-stroke-color": "#FFFFFF",
        "circle-stroke-opacity": 1,
      } as any,
    });
  }
  // White dot at center for all
  map.addLayer({
    id: "hz-c-dot",
    type: "circle",
    source: CLUSTER_HALO_SOURCE,
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 2, 7, 2.5, 11, 3.5] as any,
      "circle-color": "#FFFFFF",
      "circle-opacity": 1,
    } as any,
  });

  // ── Meter polygons: true geographic circles per seed, visible at district zoom (z≥7)
  // Yellow advisory (×1.8) + orange (×1.3) + red core (×1.0) + outline per cluster
  for (const s of seeds) {
    const col = severityColors(s.severity);
    const sid = s.id.replace(/[^a-z0-9_-]/gi, "_");
    // Skip polygon fills for the smallest LEVEL_2 at overview — still has halo
    const yellowFC = circleGeoJSON(s.center, s.radiusM * 1.8);
    const orangeFC = circleGeoJSON(s.center, s.radiusM * 1.3);
    const redFC = circleGeoJSON(s.center, s.radiusM * 1.0);

    map.addSource(`hz-c-${sid}-yellow`, { type: "geojson", data: yellowFC as any });
    map.addLayer({ id: `hz-c-${sid}-yellow`, type: "fill", source: `hz-c-${sid}-yellow`, paint: { "fill-color": col.fill, "fill-opacity": 0.06 } } as any);
    map.addSource(`hz-c-${sid}-orange`, { type: "geojson", data: orangeFC as any });
    map.addLayer({ id: `hz-c-${sid}-orange`, type: "fill", source: `hz-c-${sid}-orange`, paint: { "fill-color": col.fill, "fill-opacity": 0.09 } } as any);
    map.addSource(`hz-c-${sid}-red`, { type: "geojson", data: redFC as any });
    map.addLayer({ id: `hz-c-${sid}-red`, type: "fill", source: `hz-c-${sid}-red`, paint: { "fill-color": col.fill, "fill-opacity": s.severity.includes("LEVEL_5") ? 0.26 : s.severity === "LEVEL_4_CRITICAL" ? 0.20 : 0.12 } } as any);
    map.addSource(`hz-c-${sid}-outline`, { type: "geojson", data: redFC as any });
    map.addLayer({ id: `hz-c-${sid}-outline`, type: "line", source: `hz-c-${sid}-outline`, paint: { "line-color": col.outline, "line-width": s.severity.includes("LEVEL_5") ? 2.0 : 1.4, "line-opacity": 0.85 } } as any);
  }

  // Ensure halo dots stay above fills
  try {
    for (const sev of bySeverity.keys()) {
      const safeSev = String(sev).replace(/"/g, "");
      if (map.getLayer(`hz-c-${safeSev}-halo`)) map.moveLayer(`hz-c-${safeSev}-halo`);
      if (map.getLayer(`hz-c-${safeSev}-core`)) map.moveLayer(`hz-c-${safeSev}-core`);
    }
    if (map.getLayer("hz-c-dot")) map.moveLayer("hz-c-dot");
  } catch (e) { console.warn("[hazard] moveLayer halos", e); }
}

export const GISGlobeMap: React.FC<Props> = (props) => {
  const {
    buildings,
    sensors,
    shelters,
    rescueTeams,
    sosRequests,
    redZoneRadiusMeters,
    onSelectBuilding,
    onSelectSensor,
    onSelectShelter,
    onSelectTeam,
  } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showBuildings, setShowBuildings] = React.useState(true);
  const [showSensors, setShowSensors] = React.useState(true);
  const [showShelters, setShowShelters] = React.useState(true);
  const [showTeams, setShowTeams] = React.useState(true);
  const [showSOS, setShowSOS] = React.useState(true);
  const [showRedZone, setShowRedZone] = React.useState(true);
  const [statusText, setStatusText] = React.useState("India overview");
  const [hazardSeeds, setHazardSeeds] = React.useState<IndiaHazardSeed[]>(() => indiaHazardSeeds);
  const [mapReady, setMapReady] = React.useState(false);
  // Single anchored highlight for flyTo / "District view" — kept for backwards compat
  const hazardCenter: [number, number] = hazardSeeds[0]?.center ?? FALLBACK_HAZARD;

  // Init globe — spherical at low zoom, mercator at high zoom (kept per request)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    setMapReady(false);
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: GLOBE_STYLE,
      center: [INDIA_CENTER[1], INDIA_CENTER[0]],
      zoom: 4.2,
      pitch: 0,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "bottom-right");

    map.on("load", () => {
      try { (map as any).setProjection?.({ type: "globe" }); } catch {}
      try {
        (map as any).setFog?.({
          color: "#E8EEF6",
          "high-color": "#0B1220",
          "horizon-blend": 0.14,
          "space-color": "#060A14",
          "star-intensity": 0.9,
        } as any);
      } catch {}
      try { (map as any).setSky?.({ "sky-color": "#0B1220", "sky-horizon-blend": 0.5 } as any); } catch {}
      // Do not draw here — the dedicated hazard effect (dep: showRedZone/hazardCenter/mapReady)
      // is the single source of truth, otherwise the initial closure freezes showRedZone=true
      // and clicks before load appear "not working".
      setMapReady(true);
    });
    if (map.isStyleLoaded()) setMapReady(true);
    map.on("zoom", () => {
      const z = map.getZoom();
      try {
        if (z > 5.2) (map as any).setProjection?.({ type: "mercator" });
        else (map as any).setProjection?.({ type: "globe" });
      } catch {}
    });
    return () => {
      setMapReady(false);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pan-India clusters — re-draw when seeds/toggle/accuracy change.
  // redZoneRadiusMeters scales the simulation origin (hz-gps) only; other seeds keep their seed radius.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const run = () => {
      try {
        // Scale the live/GPS seed radius to match simulation slider; preserve other seeds
        const scaled: IndiaHazardSeed[] = hazardSeeds.map((s, i) =>
          i === 0 ? { ...s, radiusM: redZoneRadiusMeters } : s,
        );
        drawHazardZones(map, scaled, null, false, showRedZone);
      } catch (e) {
        console.error(e);
      }
    };
    if (map.isStyleLoaded()) run();
    else map.once("load", run);
  }, [redZoneRadiusMeters, showRedZone, hazardSeeds, mapReady]);

  // Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const markers: maplibregl.Marker[] = [];
    const add = (lng: number, lat: number, el: HTMLElement, onClick?: () => void) => {
      const m = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
      if (onClick) el.addEventListener("click", onClick);
      markers.push(m);
    };
    if (showBuildings) {
      buildings.forEach((b) => {
        if (searchQuery && !b.name.toLowerCase().includes(searchQuery.toLowerCase()) && !b.code.toLowerCase().includes(searchQuery.toLowerCase())) return;
        const isSel = props.selectedBuildingId === b.id;
        let bg = "#334155";
        if (b.evacuationStatus === "COLLAPSED") bg = "#7F1D1D";
        else if ((b as any).evacuationStatus === "EVACUATE" || b.evacuationStatus === "CRITICAL") bg = "#DC2626";
        else if (b.evacuationStatus === "HIGH_RISK") bg = "#D97706";
        else if (b.evacuationStatus === "SAFE") bg = "#059669";
        const el = document.createElement("div");
        el.style.cssText = `width:${isSel ? 26 : 20}px;height:${isSel ? 26 : 20}px;background:${bg};border:2px solid ${isSel ? "#12151A" : "#fff"};border-radius:6px;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 8px rgba(16,24,40,.18);cursor:pointer;color:#fff;font:800 9px 'JetBrains Mono',monospace`;
        el.textContent = `${b.floors}F`;
        add(b.lng, b.lat, el, () => onSelectBuilding(b));
      });
    }
    if (showSensors) {
      sensors.forEach((s) => {
        let c = "#334155";
        if (s.status === "CRITICAL") c = "#DC2626";
        else if (s.status === "ANOMALY") c = "#D97706";
        else if (s.status === "OFFLINE") c = "#94A3B8";
        const isSel = props.selectedSensorId === s.id;
        const el = document.createElement("div");
        el.style.cssText = `width:${isSel ? 22 : 18}px;height:${isSel ? 22 : 18}px;background:#fff;border:2px solid ${c};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 6px rgba(16,24,40,.14);cursor:pointer`;
        const dot = document.createElement("div");
        dot.style.cssText = `width:6px;height:6px;background:${c};border-radius:50%`;
        el.appendChild(dot);
        add(s.lng, s.lat, el, () => onSelectSensor(s));
      });
    }
    if (showShelters) {
      shelters.forEach((s) => {
        const occ = Math.round((s.currentOccupancy / s.capacity) * 100);
        let bc = "#059669";
        if (occ > 90) bc = "#DC2626";
        else if (occ > 70) bc = "#D97706";
        const el = document.createElement("div");
        el.style.cssText = `background:#fff;border:1.5px solid ${bc};border-radius:10px;padding:3px 8px;display:flex;align-items:center;gap:6px;box-shadow:0 1px 8px rgba(16,24,40,.12);white-space:nowrap;cursor:pointer;font:700 10px 'Space Grotesk',sans-serif`;
        el.innerHTML = `⌂ <span>${s.name.split(" ")[0]} <span style="color:${bc};font-family:JetBrains Mono,monospace">${s.currentOccupancy}/${s.capacity}</span></span>`;
        add(s.lng, s.lat, el, () => onSelectShelter(s));
      });
    }
    if (showTeams) {
      rescueTeams.forEach((t) => {
        const el = document.createElement("div");
        el.style.cssText = `background:#0F172A;border:1px solid #1E293B;border-radius:8px;padding:3px 8px;color:#fff;font:700 10px 'Space Grotesk',sans-serif;white-space:nowrap;cursor:pointer`;
        el.textContent = `▸ ${t.department}`;
        add(t.lng, t.lat, el, () => onSelectTeam(t));
      });
    }
    if (showSOS) {
      sosRequests.forEach((s) => {
        const el = document.createElement("div");
        el.style.cssText = `width:24px;height:24px;background:#DC2626;border:2px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(220,38,38,.45);color:#fff;font:800 9px 'Space Grotesk',sans-serif;cursor:pointer`;
        el.textContent = "SOS";
        add(s.lng, s.lat, el);
      });
    }
    return () => markers.forEach((m) => m.remove());
  }, [buildings, sensors, shelters, rescueTeams, sosRequests, showBuildings, showSensors, showShelters, showTeams, showSOS, searchQuery, props.selectedBuildingId, props.selectedSensorId]);

  const Pill: React.FC<{ active: boolean; onClick: () => void; icon: React.ElementType; label: string }> = ({ active, onClick, icon: Icon, label }) => (
    <button
      data-cursor="hover"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${active ? "bg-[var(--accent)] border-[var(--accent)] text-white" : "bg-white border-[var(--line)] text-[var(--ink-2)]"}`}
    >
      <Icon className={`h-3 w-3 ${active ? "text-white/90" : "text-[var(--ink-3)]"}`} />
      {label}
    </button>
  );

  const handleLocate = () => {
    mapRef.current?.flyTo({ center: [INDIA_CENTER[1], INDIA_CENTER[0]], zoom: 4.2, duration: 800 });
    setStatusText("India overview");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill active={showBuildings} onClick={() => setShowBuildings(!showBuildings)} icon={Building2} label="Buildings" />
          <Pill active={showRedZone} onClick={() => setShowRedZone((v) => !v)} icon={ShieldAlert} label="Hazard zone" />
          <Pill active={showSensors} onClick={() => setShowSensors(!showSensors)} icon={Radio} label="Sensors" />
          <Pill active={showShelters} onClick={() => setShowShelters(!showShelters)} icon={Home} label="Shelters" />
          <Pill active={showTeams} onClick={() => setShowTeams(!showTeams)} icon={Truck} label="Teams" />
          <Pill active={showSOS} onClick={() => setShowSOS(!showSOS)} icon={AlertTriangle} label="SOS" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <label className="relative hidden sm:flex items-center">
            <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[var(--ink-3)]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search structure…"
              className="h-8 w-[220px] rounded-full border border-[var(--line)] bg-white pl-8 pr-3 text-[12px] outline-none focus:border-[var(--line-strong)]"
            />
          </label>
          <span className="hidden lg:inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium bg-white border-[var(--line)] text-[var(--ink-3)]">
            {statusText}
          </span>
          <button
            data-cursor="hover"
            onClick={() => mapRef.current?.flyTo({ center: [INDIA_CENTER[1], INDIA_CENTER[0]], zoom: 4.2, duration: 700 })}
            className="grid h-8 w-8 place-items-center rounded-full border border-[var(--line)] bg-white text-[var(--ink-2)]"
            title="India overview"
          >
            <Navigation className="h-3.5 w-3.5" />
          </button>
          <button
            data-cursor="hover"
            onClick={() => mapRef.current?.flyTo({ center: [hazardCenter[1], hazardCenter[0]], zoom: 11, duration: 700 })}
            className="grid h-8 w-8 place-items-center rounded-full border border-[var(--line)] bg-white text-[var(--ink-2)]"
            title="District view"
          >
            <Layers className="h-3.5 w-3.5" />
          </button>
          <button
            data-cursor="hover"
            onClick={handleLocate}
            className="grid h-8 w-8 place-items-center rounded-full border text-[var(--ink-2)] bg-white border-[var(--line)]"
            title="Locate me"
          >
            <Compass className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div
        className="resq-globe-shell relative overflow-hidden rounded-[18px] border border-[var(--line)] shadow-sm"
        style={{
          borderRadius: 18,
          boxShadow: "0 0 0 1px rgba(148,163,184,.16), 0 16px 48px rgba(15,23,42,.18), 0 1px 3px rgba(15,23,42,.08)",
          background: "radial-gradient(ellipse 120% 100% at 50% 0%, #0F172A 0%, #020617 55%, #000000 100%)",
        }}
      >
        <div
          className="resq-globe-starfield"
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            backgroundImage:
              "radial-gradient(1.4px 1.4px at 14% 22%, rgba(255,255,255,.92) 0, transparent 100%)," +
              "radial-gradient(1px 1px at 28% 62%, rgba(255,255,255,.58) 0, transparent 100%)," +
              "radial-gradient(1.15px 1.15px at 44% 18%, rgba(255,255,255,.72) 0, transparent 100%)," +
              "radial-gradient(1px 1px at 52% 84%, rgba(255,255,255,.42) 0, transparent 100%)," +
              "radial-gradient(1.25px 1.25px at 66% 36%, rgba(255,255,255,.66) 0, transparent 100%)," +
              "radial-gradient(1px 1px at 78% 72%, rgba(255,255,255,.50) 0, transparent 100%)," +
              "radial-gradient(1.3px 1.3px at 88% 28%, rgba(255,255,255,.78) 0, transparent 100%)," +
              "radial-gradient(1px 1px at 92% 58%, rgba(255,255,255,.46) 0, transparent 100%)," +
              "radial-gradient(1px 1px at 8% 78%, rgba(255,255,255,.40) 0, transparent 100%)," +
              "radial-gradient(1px 1px at 36% 48%, rgba(255,255,255,.34) 0, transparent 100%)," +
              "radial-gradient(ellipse 90% 55% at 50% 0%, rgba(37,99,235,.10) 0%, transparent 62%)," +
              "radial-gradient(ellipse 120% 80% at 50% 100%, rgba(2,6,23,.9) 0%, transparent 70%)",
            opacity: 0.95,
          }}
        />
        <div ref={containerRef} className="h-[560px] min-h-[520px] w-full relative z-[1]" style={{ background: "transparent", borderRadius: 18, overflow: "hidden" }} />
      </div>
    </div>
  );
};
export default GISGlobeMap;
