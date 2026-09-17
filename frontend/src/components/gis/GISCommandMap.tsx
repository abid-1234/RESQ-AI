import React, { useEffect, useRef, useState } from 'react';
import { 
  Building, 
  SensorNode, 
  CommunityGateway, 
  Shelter, 
  Hospital, 
  RescueTeam, 
  Ambulance, 
  RoadSegment, 
  MapIntelligenceMode, 
  SOSRequest, 
  OperationalMode 
} from '../../types';
import { 
  Layers, 
  Eye, 
  Navigation, 
  ShieldAlert, 
  Building2, 
  Radio, 
  Home, 
  Activity, 
  AlertTriangle, 
  Compass, 
  Truck, 
  Cross,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import L from 'leaflet';
import { indiaHazardSeeds, type IndiaHazardSeed } from '../../data/indiaHazardSeeds';

interface GISCommandMapProps {
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
  onSelectBuilding: (building: Building) => void;
  onSelectSensor: (sensor: SensorNode) => void;
  onSelectShelter: (shelter: Shelter) => void;
  onSelectTeam: (team: RescueTeam) => void;
  selectedBuildingId?: string;
  selectedSensorId?: string;
}

export const GISCommandMap: React.FC<GISCommandMapProps> = ({
  buildings,
  sensors,
  gateways,
  shelters,
  hospitals,
  rescueTeams,
  ambulances,
  roads,
  sosRequests,
  operationalMode,
  redZoneRadiusMeters,
  onSelectBuilding,
  onSelectSensor,
  onSelectShelter,
  onSelectTeam,
  selectedBuildingId,
  selectedSensorId
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const [locationStatus, setLocationStatus] = useState('India overview — 16 hazard clusters');

  // Active intelligence visualization mode
  const [intelMode, setIntelMode] = useState<MapIntelligenceMode>('LIVE_DISASTER');
  
  // Layer toggles
  const [showBuildings, setShowBuildings] = useState(true);
  const [showSensors, setShowSensors] = useState(true);
  const [showGateways, setShowGateways] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);
  const [showRescueTeams, setShowRescueTeams] = useState(true);
  const [showRoads, setShowRoads] = useState(true);
  const [showSOS, setShowSOS] = useState(true);
  const [showRedZone, setShowRedZone] = useState(true);
  const [radarScanActive, setRadarScanActive] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const SEV_COLOR: Record<string, { stroke: string; fill: string }> = {
    LEVEL_2_WATCH: { stroke: "#CA8A04", fill: "#EAB308" },
    LEVEL_3_WARNING: { stroke: "#EA580C", fill: "#F59E0B" },
    LEVEL_4_CRITICAL: { stroke: "#B91C1C", fill: "#DC2626" },
    LEVEL_5_MASS_EMERGENCY: { stroke: "#7F1D1D", fill: "#991B1B" },
    LEVEL_5_EXTREME: { stroke: "#7F1D1D", fill: "#991B1B" },
  };
  const sevColor = (sev: string) => SEV_COLOR[sev] ?? SEV_COLOR.LEVEL_3_WARNING;
  const [hazardSeeds, setHazardSeeds] = useState<IndiaHazardSeed[]>(() => indiaHazardSeeds);
  const centerLat = 22.0;
  const centerLng = 78.5;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    });

    // Public OpenStreetMap tiles do not require an API key.
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Layers when state changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Pan-India hazard clusters — 16 seeds; first seed is GPS-anchored and
    // scales with redZoneRadiusMeters (simulation slider). Others keep seed radius.
    if (showRedZone) {
      hazardSeeds.forEach((seed, idx) => {
        const c = sevColor(seed.severity);
        const r = idx === 0 ? redZoneRadiusMeters : seed.radiusM;
        const isPrimary = idx === 0;
        L.circle(seed.center as [number, number], { radius: r * 1.8, color: c.stroke, weight: 1, dashArray: '6,6', fillColor: c.fill, fillOpacity: 0.05 }).addTo(layerGroup);
        L.circle(seed.center as [number, number], { radius: r * 1.3, color: c.stroke, weight: 1.4, fillColor: c.fill, fillOpacity: 0.09 }).addTo(layerGroup);
        const core = L.circle(seed.center as [number, number], { radius: r * 1.0, color: c.stroke, weight: isPrimary ? 2.2 : 1.6, fillColor: c.fill, fillOpacity: seed.severity.includes('LEVEL_5') ? 0.28 : seed.severity === 'LEVEL_4_CRITICAL' ? 0.22 : 0.13 }).addTo(layerGroup);
        core.bindTooltip(
          `<div style="font-family: inherit; font-size: 11px;"><strong style="color:${c.stroke};">${seed.label}</strong><br/>${seed.state} · ${seed.hazard} · ${seed.severity}<br/>Radius: ${r}m</div>`,
          { permanent: false, direction: 'top', className: 'tactical-tooltip' },
        );
      });
    }

    // 2. Road Network Lines
    if (showRoads) {
      roads.forEach(road => {
        let roadColor = '#10b981'; // Green: Open
        let dashArray = undefined;
        let weight = 4;

        if (road.status === 'FLOODED') {
          roadColor = '#ef4444';
          dashArray = '8, 8';
          weight = 5;
        } else if (road.status === 'BLOCKED' || road.status === 'DAMAGED') {
          roadColor = '#f59e0b';
          dashArray = '6, 6';
        } else if (road.status === 'EMERGENCY_ONLY') {
          roadColor = '#06b6d4';
          dashArray = '4, 4';
          weight = 5;
        }

        const polyline = L.polyline(road.coordinates, {
          color: roadColor,
          weight,
          dashArray,
          opacity: 0.85
        }).addTo(layerGroup);

        polyline.bindPopup(`
          <div class="p-2 text-xs">
            <h4 class="font-tactical font-bold text-slate-100 mb-1">${road.name}</h4>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${
                road.status === 'FLOODED' ? 'bg-red-950 text-red-400 border border-red-800' :
                road.status === 'EMERGENCY_ONLY' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' :
                road.status === 'BLOCKED' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                'bg-emerald-950 text-emerald-400 border border-emerald-800'
              }">${road.status}</span>
              <span class="text-slate-400 font-mono-code">${road.speedLimitKmh} km/h</span>
            </div>
            ${road.blockageReason ? `<p class="text-slate-300 text-[11px] mt-1">${road.blockageReason}</p>` : ''}
          </div>
        `);
      });
    }

    // 3. Buildings Layer (Digital Twins)
    if (showBuildings) {
      buildings.forEach(b => {
        // Filter by search if active
        if (searchQuery && !b.name.toLowerCase().includes(searchQuery.toLowerCase()) && !b.code.toLowerCase().includes(searchQuery.toLowerCase())) {
          return;
        }

        let markerColor = '#3b82f6';
        let borderColor = '#60a5fa';
        let glowClass = '';

        if (b.evacuationStatus === 'COLLAPSED') {
          markerColor = '#7f1d1d';
          borderColor = '#ef4444';
          glowClass = 'animate-ping';
        } else if (b.evacuationStatus === 'CRITICAL' || b.evacuationStatus === 'EVACUATE') {
          markerColor = '#dc2626';
          borderColor = '#f87171';
        } else if (b.evacuationStatus === 'HIGH_RISK') {
          markerColor = '#ea580c';
          borderColor = '#fb923c';
        } else if (b.evacuationStatus === 'WATCH') {
          markerColor = '#d97706';
          borderColor = '#fbbf24';
        } else if (b.evacuationStatus === 'MONITOR') {
          markerColor = '#0284c7';
          borderColor = '#38bdf8';
        } else if (b.evacuationStatus === 'SAFE') {
          markerColor = '#059669';
          borderColor = '#34d399';
        }

        const isSelected = selectedBuildingId === b.id;

        // Custom Tactical HTML Marker for Buildings
        const iconHtml = `
          <div style="
            position: relative;
            width: ${isSelected ? '28px' : '20px'};
            height: ${isSelected ? '28px' : '20px'};
            background: ${markerColor};
            border: 2px solid ${isSelected ? '#ffffff' : borderColor};
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 12px ${markerColor};
            cursor: pointer;
            transition: all 0.2s;
          ">
            <span style="font-size: 9px; font-weight: 800; color: #ffffff; font-family: monospace;">${b.floors}F</span>
            ${b.estimatedTrappedCount && b.estimatedTrappedCount > 0 ? `
              <span style="
                position: absolute;
                top: -8px;
                right: -8px;
                background: #ef4444;
                color: #ffffff;
                font-size: 8px;
                font-weight: bold;
                padding: 1px 4px;
                border-radius: 9999px;
                border: 1px solid #ffffff;
              ">${b.estimatedTrappedCount}</span>
            ` : ''}
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-building-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const marker = L.marker([b.lat, b.lng], { icon: customIcon }).addTo(layerGroup);

        marker.on('click', () => {
          onSelectBuilding(b);
        });

        marker.bindTooltip(`
          <div style="font-family: inherit; font-size: 11px; padding: 2px;">
            <strong style="color: #38bdf8;">${b.name}</strong><br/>
            <span style="color: #cbd5e1;">Risk Score:</span> <strong style="color: ${markerColor};">${b.overallRiskScore}%</strong> |
            <span style="color: #cbd5e1;">Occupancy:</span> <strong>${b.estimatedOccupancy}</strong><br/>
            <span style="color: #f87171;">Vulnerable:</span> ${b.vulnerableGroups.children + b.vulnerableGroups.elderly + b.vulnerableGroups.disabled} persons<br/>
            <span style="color: #94a3b8; font-size: 10px;">Click to view Digital Twin Card</span>
          </div>
        `, { direction: 'top', offset: [0, -10] });
      });
    }

    // 4. IoT Sensor Nodes Layer
    if (showSensors) {
      sensors.forEach(sensor => {
        let sensorColor = '#06b6d4'; // Cyan
        if (sensor.status === 'CRITICAL') sensorColor = '#ef4444';
        else if (sensor.status === 'ANOMALY') sensorColor = '#f59e0b';
        else if (sensor.status === 'OFFLINE') sensorColor = '#64748b';

        const isSelected = selectedSensorId === sensor.id;

        const iconHtml = `
          <div style="
            width: ${isSelected ? '24px' : '18px'};
            height: ${isSelected ? '24px' : '18px'};
            background: rgba(15, 23, 42, 0.95);
            border: 2px solid ${sensorColor};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 10px ${sensorColor};
            cursor: pointer;
          ">
            <div style="
              width: 6px;
              height: 6px;
              background: ${sensorColor};
              border-radius: 50%;
              ${sensor.status === 'CRITICAL' ? 'animation: pulse 1s infinite;' : ''}
            "></div>
          </div>
        `;

        const sensorIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-sensor-marker',
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });

        const marker = L.marker([sensor.lat, sensor.lng], { icon: sensorIcon }).addTo(layerGroup);

        marker.on('click', () => {
          onSelectSensor(sensor);
        });

        marker.bindTooltip(`
          <div style="font-family: inherit; font-size: 11px;">
            <strong style="color: ${sensorColor}; font-mono-code">${sensor.nodeCode}</strong><br/>
            <span>${sensor.name}</span><br/>
            <strong>Reading: ${sensor.currentReading.value} ${sensor.currentReading.unit}</strong><br/>
            <span style="color: #94a3b8; font-size: 10px;">Battery: ${sensor.batteryPercentage}% | Sig: ${sensor.signalStrengthDbm}dBm</span>
          </div>
        `, { direction: 'top', offset: [0, -10] });
      });
    }

    // 5. Community Gateways
    if (showGateways) {
      gateways.forEach(gw => {
        const iconHtml = `
          <div style="
            width: 24px;
            height: 24px;
            background: #4f46e5;
            border: 2px solid #a5b4fc;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 12px rgba(99, 102, 241, 0.6);
            color: #ffffff;
            font-size: 12px;
          ">
            📡
          </div>
        `;

        const gwIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-gw-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([gw.lat, gw.lng], { icon: gwIcon }).addTo(layerGroup);
        marker.bindPopup(`
          <div class="p-2 text-xs">
            <h4 class="font-tactical font-bold text-indigo-300">${gw.name} (${gw.code})</h4>
            <p class="text-slate-300 text-[11px] mb-1.5">${gw.locationName}</p>
            <div class="grid grid-cols-2 gap-1 text-[10px] text-slate-300 font-mono-code">
              <div>Backhaul: <span class="text-cyan-400">${gw.backhaulType}</span></div>
              <div>Connected: <span class="text-emerald-400">${gw.connectedSensorsCount} sensors</span></div>
              <div>Battery: <span class="text-amber-400">${gw.batteryPercentage}%</span></div>
              <div>Status: <span class="text-emerald-400">${gw.status}</span></div>
            </div>
          </div>
        `);
      });
    }

    // 6. Shelters Layer
    if (showShelters) {
      shelters.forEach(s => {
        const occPercent = Math.round((s.currentOccupancy / s.capacity) * 100);
        let badgeColor = '#10b981';
        if (occPercent > 90) badgeColor = '#ef4444';
        else if (occPercent > 70) badgeColor = '#f59e0b';

        const iconHtml = `
          <div style="
            background: rgba(15, 23, 42, 0.95);
            border: 2px solid ${badgeColor};
            border-radius: 8px;
            padding: 3px 6px;
            display: flex;
            align-items: center;
            gap: 4px;
            box-shadow: 0 0 10px ${badgeColor}66;
            cursor: pointer;
            white-space: nowrap;
          ">
            <span style="font-size: 11px;">⛺</span>
            <div style="text-align: left;">
              <div style="font-size: 9px; font-weight: bold; color: #f8fafc;">${s.name.split(' ')[0]}</div>
              <div style="font-size: 8px; color: ${badgeColor}; font-family: monospace;">${s.currentOccupancy}/${s.capacity} (${occPercent}%)</div>
            </div>
          </div>
        `;

        const shelterIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-shelter-marker',
          iconSize: [80, 26],
          iconAnchor: [40, 13]
        });

        const marker = L.marker([s.lat, s.lng], { icon: shelterIcon }).addTo(layerGroup);
        marker.on('click', () => onSelectShelter(s));
      });
    }

    // 7. Hospitals Layer
    if (showHospitals) {
      hospitals.forEach(h => {
        const iconHtml = `
          <div style="
            width: 26px;
            height: 26px;
            background: #dc2626;
            border: 2px solid #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 12px rgba(220, 38, 38, 0.7);
            color: #ffffff;
            font-size: 13px;
            font-weight: bold;
          ">
            🏥
          </div>
        `;

        const hospIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-hosp-marker',
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        const marker = L.marker([h.lat, h.lng], { icon: hospIcon }).addTo(layerGroup);
        marker.bindPopup(`
          <div class="p-2 text-xs">
            <h4 class="font-tactical font-bold text-red-400">${h.name}</h4>
            <div class="mt-1 space-y-1 text-[11px] text-slate-300">
              <div>Total Beds: <strong>${h.totalBeds}</strong> (Occupied: ${h.occupiedBeds})</div>
              <div>ICU Available: <strong class="text-emerald-400">${h.icuBedsAvailable}</strong></div>
              <div>ER Load: <strong class="text-amber-400">${h.emergencyRoomStatus}</strong></div>
              <div>Trauma Level: <strong>Level ${h.traumaCenterLevel}</strong></div>
              <div>Contact: <a href="tel:${h.contact}" class="text-cyan-400">${h.contact}</a></div>
            </div>
          </div>
        `);
      });
    }

    // 8. Rescue Teams Layer
    if (showRescueTeams) {
      rescueTeams.forEach(t => {
        const iconHtml = `
          <div style="
            background: #0284c7;
            border: 2px solid #38bdf8;
            border-radius: 6px;
            padding: 2px 6px;
            display: flex;
            align-items: center;
            gap: 3px;
            box-shadow: 0 0 10px rgba(56, 189, 248, 0.6);
            color: #ffffff;
            font-size: 10px;
            font-weight: bold;
            cursor: pointer;
            white-space: nowrap;
          ">
            <span>🚤</span>
            <span>${t.department}</span>
          </div>
        `;

        const teamIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-team-marker',
          iconSize: [70, 22],
          iconAnchor: [35, 11]
        });

        const marker = L.marker([t.lat, t.lng], { icon: teamIcon }).addTo(layerGroup);
        marker.on('click', () => onSelectTeam(t));
      });
    }

    // 9. Ambulances Layer
    ambulances.forEach(a => {
      const iconHtml = `
        <div style="
          width: 22px;
          height: 22px;
          background: #f59e0b;
          border: 2px solid #ffffff;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.6);
          font-size: 11px;
        ">
          🚑
        </div>
      `;

      const ambIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-amb-marker',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      L.marker([a.lat, a.lng], { icon: ambIcon }).addTo(layerGroup);
    });

    // 10. SOS Beacons Layer
    if (showSOS) {
      sosRequests.forEach(sos => {
        const iconHtml = `
          <div style="
            width: 26px;
            height: 26px;
            background: #ef4444;
            border: 2px solid #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 16px rgba(239, 68, 68, 0.9);
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          ">
            <span style="font-size: 11px; font-weight: bold; color: #ffffff;">SOS</span>
          </div>
        `;

        const sosIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-sos-marker',
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        const marker = L.marker([sos.lat, sos.lng], { icon: sosIcon }).addTo(layerGroup);
        marker.bindPopup(`
          <div class="p-2 text-xs">
            <div class="flex items-center justify-between mb-1">
              <span class="px-1.5 py-0.5 rounded bg-red-600 text-white font-bold text-[10px]">SOS BEACON</span>
              <span class="text-slate-400 font-mono-code text-[10px]">${sos.timestamp}</span>
            </div>
            <h4 class="font-tactical font-bold text-slate-100">${sos.citizenName} (${sos.phone})</h4>
            <div class="mt-1 space-y-1 text-slate-300 text-[11px]">
              <div>Trapped Count: <strong class="text-red-400">${sos.trappedCount} persons</strong></div>
              <div>Urgency: <strong class="text-amber-400">${sos.medicalUrgency}</strong></div>
              <div>Battery: <strong>${sos.batteryLevel}%</strong> | Net: <strong>${sos.networkType}</strong></div>
              <p class="text-slate-200 bg-slate-900/90 p-1.5 rounded mt-1 border border-slate-800">${sos.notes}</p>
            </div>
          </div>
        `);
      });
    }

  }, [
    buildings,
    sensors,
    gateways,
    shelters,
    hospitals,
    rescueTeams,
    ambulances,
    roads,
    sosRequests,
    showBuildings,
    showSensors,
    showGateways,
    showShelters,
    showHospitals,
    showRescueTeams,
    showRoads,
    showSOS,
    showRedZone,
    redZoneRadiusMeters,
    hazardSeeds,
    selectedBuildingId,
    selectedSensorId,
    searchQuery
  ]);

  // Recenter map handler — India overview at zoom 6 to show all clusters
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([centerLat, centerLng], 6, { animate: true });
      setLocationStatus('India overview — 16 hazard clusters');
    }
  };

  const handleLocateUser = () => {
    if (!mapInstanceRef.current) {
      return;
    }
    mapInstanceRef.current.setView([centerLat, centerLng], 6, { animate: true });
    setLocationStatus('India overview — 16 hazard clusters');
  };

  return (
    <div className="relative w-full h-full min-h-[540px] rounded-lg overflow-hidden border border-[rgba(255,255,255,0.1)] bg-[#05070A] flex flex-col shadow-2xl">
      {/* Top Map HUD Controls & Mode Switcher */}
      <div className="absolute top-3 left-3 z-[400] flex flex-wrap items-center gap-2 max-w-[calc(100%-24px)]">
        {/* Layer Filters Dropdown / Pills */}
        <div className="flex items-center gap-1 bg-[rgba(10,14,20,0.85)] backdrop-blur-md p-1 rounded border border-[rgba(255,255,255,0.1)] text-xs shadow-xl font-mono-code">
          <button
            id="filter-toggle-buildings"
            onClick={() => setShowBuildings(!showBuildings)}
            className={`px-2 py-1 rounded transition-colors flex items-center gap-1.5 ${
              showBuildings ? 'bg-[#00D1FF]/20 text-[#00D1FF] border border-[#00D1FF]/40 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Building2 className="w-3 h-3" />
            <span>[X] Buildings</span>
          </button>

          <button
            id="filter-toggle-redzone"
            onClick={() => setShowRedZone((v) => !v)}
            className={`px-2 py-1 rounded transition-colors flex items-center gap-1.5 ${
              showRedZone ? 'bg-[#FF3D00]/20 text-[#FF3D00] border border-[#FF3D00]/40 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            <span>[X] Hazard Zone</span>
          </button>

          <button
            id="filter-toggle-sensors"
            onClick={() => setShowSensors(!showSensors)}
            className={`px-2 py-1 rounded transition-colors flex items-center gap-1.5 ${
              showSensors ? 'bg-[#00D1FF]/20 text-[#00D1FF] border border-[#00D1FF]/40 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Radio className="w-3 h-3" />
            <span>[X] IoT Sensors</span>
          </button>

          <button
            id="filter-toggle-shelters"
            onClick={() => setShowShelters(!showShelters)}
            className={`px-2 py-1 rounded transition-colors flex items-center gap-1.5 ${
              showShelters ? 'bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/40 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Home className="w-3 h-3" />
            <span>[X] Shelters</span>
          </button>

          <button
            id="filter-toggle-rescue"
            onClick={() => setShowRescueTeams(!showRescueTeams)}
            className={`px-2 py-1 rounded transition-colors flex items-center gap-1.5 ${
              showRescueTeams ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Truck className="w-3 h-3" />
            <span>Rescue Units</span>
          </button>

          <button
            id="filter-toggle-sos"
            onClick={() => setShowSOS(!showSOS)}
            className={`px-2 py-1 rounded transition-colors flex items-center gap-1.5 ${
              showSOS ? 'bg-[#FF3D00]/25 text-[#FF3D00] border border-[#FF3D00]/50 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>SOS</span>
          </button>
        </div>

        {/* Search Input for Quick Building / Zone lookup */}
        <div className="relative flex items-center">
          <input
            id="gis-map-search-input"
            type="text"
            placeholder="Search Sector / Structure..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 px-2.5 py-1 pl-7 bg-[rgba(10,14,20,0.85)] backdrop-blur-md border border-[rgba(255,255,255,0.1)] rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#00D1FF]"
          />
          <Search className="w-3 h-3 text-slate-400 absolute left-2 pointer-events-none" />
        </div>
      </div>

      {/* Top Right: GIS Map Tools */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-2">
        <span className="rounded bg-[rgba(10,14,20,0.85)] px-2 py-1 text-[10px] text-slate-300 shadow-xl" role="status">{locationStatus}</span>
        <button
          id="btn-recenter-map"
          onClick={handleRecenter}
          className="p-1.5 bg-[rgba(10,14,20,0.85)] backdrop-blur-md border border-[rgba(255,255,255,0.1)] rounded text-slate-300 hover:text-[#00D1FF] hover:border-[#00D1FF]/50 shadow-xl transition-all"
          title="Recenter Map on Active Incident"
        >
          <Navigation className="w-3.5 h-3.5" />
        </button>

        <button
          id="btn-locate-user"
          onClick={handleLocateUser}
          className="p-1.5 bg-[rgba(10,14,20,0.85)] backdrop-blur-md border border-[rgba(255,255,255,0.1)] rounded text-slate-300 hover:text-[#00D1FF] hover:border-[#00D1FF]/50 shadow-xl transition-all"
          title="Locate me using browser GPS"
        >
          <Compass className="w-3.5 h-3.5" />
        </button>

        <button
          id="btn-radar-toggle"
          onClick={() => setRadarScanActive(!radarScanActive)}
          className={`p-1.5 bg-[rgba(10,14,20,0.85)] backdrop-blur-md border rounded shadow-xl transition-all ${
            radarScanActive ? 'text-[#00D1FF] border-[#00D1FF]/50 bg-[#00D1FF]/10' : 'text-slate-400 border-[rgba(255,255,255,0.1)]'
          }`}
          title="Toggle Radar Sweep Effect"
        >
          <Activity className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Left: Map Legend Card */}
      <div className="absolute bottom-4 left-4 z-[400] bg-[rgba(10,14,20,0.9)] backdrop-blur-md border border-[rgba(255,255,255,0.1)] rounded p-2.5 text-[11px] shadow-2xl max-w-xs pointer-events-auto">
        <div className="panel-title pb-1.5 mb-1.5 border-b border-[rgba(255,255,255,0.08)]">
          <span>MAP LAYERS & SYMBOLS</span>
          <span className="text-[10px] font-mono-code text-[#00D1FF]">EPSG:4326</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-slate-300 font-mono-code text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF3D00]" />
            <span>Critical Evac</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FFB800]" />
            <span>High Risk Watch</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-[#00D1FF] bg-[#00D1FF]/40" />
            <span>IoT Sensor Probe</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-[#00E676]" />
            <span>Shelter Safe Haven</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#00E676]" />
            <span>Open Evac Route</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#FF3D00]" style={{ borderBottom: '2px dashed #FF3D00' }} />
            <span>Flooded Road</span>
          </div>
        </div>
      </div>

      {/* Main Leaflet Map Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[560px] flex-1 z-0 relative">
        {/* Optional Radar Sweep Scanning Animation Overlay */}
        {radarScanActive && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-[350] opacity-25">
            <div className="w-[1200px] h-[1200px] absolute -top-[300px] -left-[200px] rounded-full border border-cyan-500/20 bg-gradient-to-tr from-transparent via-cyan-500/10 to-transparent animate-radar-sweep origin-center" />
          </div>
        )}
      </div>
    </div>
  );
};
