import{a as n,j as t}from"./motion-CXasLgV5.js";import{g as re,r as ne}from"./leaflet-zdHhRoWp.js";import{i as ie,S as le}from"./indiaHazardSeeds-VeFJUe9n.js";import{B as ce,S as de,R as pe,H as fe,T as xe,a as ue,N as me,C as be,A as he}from"./index-iUtrxKgF.js";import"./charts-CbnM2mNP.js";var ge=ne();const a=re(ge),Re=({buildings:k,sensors:$,gateways:E,shelters:N,hospitals:C,rescueTeams:j,ambulances:F,roads:L,sosRequests:R,operationalMode:ve,redZoneRadiusMeters:A,onSelectBuilding:V,onSelectSensor:P,onSelectShelter:Y,onSelectTeam:U,selectedBuildingId:T,selectedSensorId:D})=>{const g=n.useRef(null),c=n.useRef(null),z=n.useRef(null),[W,I]=n.useState("India overview — 16 hazard clusters"),[ye,Se]=n.useState("LIVE_DISASTER"),[x,X]=n.useState(!0),[u,K]=n.useState(!0),[O,we]=n.useState(!0),[m,Z]=n.useState(!0),[B,ke]=n.useState(!0),[b,Q]=n.useState(!0),[H,$e]=n.useState(!0),[h,q]=n.useState(!0),[v,J]=n.useState(!0),[y,ee]=n.useState(!0),[f,te]=n.useState(""),_={LEVEL_2_WATCH:{stroke:"#CA8A04",fill:"#EAB308"},LEVEL_3_WARNING:{stroke:"#EA580C",fill:"#F59E0B"},LEVEL_4_CRITICAL:{stroke:"#B91C1C",fill:"#DC2626"},LEVEL_5_MASS_EMERGENCY:{stroke:"#7F1D1D",fill:"#991B1B"},LEVEL_5_EXTREME:{stroke:"#7F1D1D",fill:"#991B1B"}},se=l=>_[l]??_.LEVEL_3_WARNING,[G,Ee]=n.useState(()=>ie),S=22,w=78.5;n.useEffect(()=>{if(!g.current||c.current)return;const l=a.map(g.current,{center:[S,w],zoom:14,zoomControl:!1,attributionControl:!1});a.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(l),a.control.zoom({position:"bottomright"}).addTo(l);const i=a.layerGroup().addTo(l);return z.current=i,c.current=l,()=>{l.remove(),c.current=null}},[]),n.useEffect(()=>{const l=c.current,i=z.current;!l||!i||(i.clearLayers(),v&&G.forEach((e,o)=>{const s=se(e.severity),r=o===0?A:e.radiusM,d=o===0;a.circle(e.center,{radius:r*1.8,color:s.stroke,weight:1,dashArray:"6,6",fillColor:s.fill,fillOpacity:.05}).addTo(i),a.circle(e.center,{radius:r*1.3,color:s.stroke,weight:1.4,fillColor:s.fill,fillOpacity:.09}).addTo(i),a.circle(e.center,{radius:r*1,color:s.stroke,weight:d?2.2:1.6,fillColor:s.fill,fillOpacity:e.severity.includes("LEVEL_5")?.28:e.severity==="LEVEL_4_CRITICAL"?.22:.13}).addTo(i).bindTooltip(`<div style="font-family: inherit; font-size: 11px;"><strong style="color:${s.stroke};">${e.label}</strong><br/>${e.state} · ${e.hazard} · ${e.severity}<br/>Radius: ${r}m</div>`,{permanent:!1,direction:"top",className:"tactical-tooltip"})}),H&&L.forEach(e=>{let o="#10b981",s,r=4;e.status==="FLOODED"?(o="#ef4444",s="8, 8",r=5):e.status==="BLOCKED"||e.status==="DAMAGED"?(o="#f59e0b",s="6, 6"):e.status==="EMERGENCY_ONLY"&&(o="#06b6d4",s="4, 4",r=5),a.polyline(e.coordinates,{color:o,weight:r,dashArray:s,opacity:.85}).addTo(i).bindPopup(`
          <div class="p-2 text-xs">
            <h4 class="font-tactical font-bold text-slate-100 mb-1">${e.name}</h4>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${e.status==="FLOODED"?"bg-red-950 text-red-400 border border-red-800":e.status==="EMERGENCY_ONLY"?"bg-cyan-950 text-cyan-400 border border-cyan-800":e.status==="BLOCKED"?"bg-amber-950 text-amber-400 border border-amber-800":"bg-emerald-950 text-emerald-400 border border-emerald-800"}">${e.status}</span>
              <span class="text-slate-400 font-mono-code">${e.speedLimitKmh} km/h</span>
            </div>
            ${e.blockageReason?`<p class="text-slate-300 text-[11px] mt-1">${e.blockageReason}</p>`:""}
          </div>
        `)}),x&&k.forEach(e=>{if(f&&!e.name.toLowerCase().includes(f.toLowerCase())&&!e.code.toLowerCase().includes(f.toLowerCase()))return;let o="#3b82f6",s="#60a5fa";e.evacuationStatus==="COLLAPSED"?(o="#7f1d1d",s="#ef4444"):e.evacuationStatus==="CRITICAL"||e.evacuationStatus==="EVACUATE"?(o="#dc2626",s="#f87171"):e.evacuationStatus==="HIGH_RISK"?(o="#ea580c",s="#fb923c"):e.evacuationStatus==="WATCH"?(o="#d97706",s="#fbbf24"):e.evacuationStatus==="MONITOR"?(o="#0284c7",s="#38bdf8"):e.evacuationStatus==="SAFE"&&(o="#059669",s="#34d399");const r=T===e.id,d=`
          <div style="
            position: relative;
            width: ${r?"28px":"20px"};
            height: ${r?"28px":"20px"};
            background: ${o};
            border: 2px solid ${r?"#ffffff":s};
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 12px ${o};
            cursor: pointer;
            transition: all 0.2s;
          ">
            <span style="font-size: 9px; font-weight: 800; color: #ffffff; font-family: monospace;">${e.floors}F</span>
            ${e.estimatedTrappedCount&&e.estimatedTrappedCount>0?`
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
              ">${e.estimatedTrappedCount}</span>
            `:""}
          </div>
        `,p=a.divIcon({html:d,className:"custom-building-marker",iconSize:[20,20],iconAnchor:[10,10]}),M=a.marker([e.lat,e.lng],{icon:p}).addTo(i);M.on("click",()=>{V(e)}),M.bindTooltip(`
          <div style="font-family: inherit; font-size: 11px; padding: 2px;">
            <strong style="color: #38bdf8;">${e.name}</strong><br/>
            <span style="color: #cbd5e1;">Risk Score:</span> <strong style="color: ${o};">${e.overallRiskScore}%</strong> |
            <span style="color: #cbd5e1;">Occupancy:</span> <strong>${e.estimatedOccupancy}</strong><br/>
            <span style="color: #f87171;">Vulnerable:</span> ${e.vulnerableGroups.children+e.vulnerableGroups.elderly+e.vulnerableGroups.disabled} persons<br/>
            <span style="color: #94a3b8; font-size: 10px;">Click to view Digital Twin Card</span>
          </div>
        `,{direction:"top",offset:[0,-10]})}),u&&$.forEach(e=>{let o="#06b6d4";e.status==="CRITICAL"?o="#ef4444":e.status==="ANOMALY"?o="#f59e0b":e.status==="OFFLINE"&&(o="#64748b");const s=D===e.id,r=`
          <div style="
            width: ${s?"24px":"18px"};
            height: ${s?"24px":"18px"};
            background: rgba(15, 23, 42, 0.95);
            border: 2px solid ${o};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 10px ${o};
            cursor: pointer;
          ">
            <div style="
              width: 6px;
              height: 6px;
              background: ${o};
              border-radius: 50%;
              ${e.status==="CRITICAL"?"animation: pulse 1s infinite;":""}
            "></div>
          </div>
        `,d=a.divIcon({html:r,className:"custom-sensor-marker",iconSize:[18,18],iconAnchor:[9,9]}),p=a.marker([e.lat,e.lng],{icon:d}).addTo(i);p.on("click",()=>{P(e)}),p.bindTooltip(`
          <div style="font-family: inherit; font-size: 11px;">
            <strong style="color: ${o}; font-mono-code">${e.nodeCode}</strong><br/>
            <span>${e.name}</span><br/>
            <strong>Reading: ${e.currentReading.value} ${e.currentReading.unit}</strong><br/>
            <span style="color: #94a3b8; font-size: 10px;">Battery: ${e.batteryPercentage}% | Sig: ${e.signalStrengthDbm}dBm</span>
          </div>
        `,{direction:"top",offset:[0,-10]})}),O&&E.forEach(e=>{const s=a.divIcon({html:`
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
        `,className:"custom-gw-marker",iconSize:[24,24],iconAnchor:[12,12]});a.marker([e.lat,e.lng],{icon:s}).addTo(i).bindPopup(`
          <div class="p-2 text-xs">
            <h4 class="font-tactical font-bold text-indigo-300">${e.name} (${e.code})</h4>
            <p class="text-slate-300 text-[11px] mb-1.5">${e.locationName}</p>
            <div class="grid grid-cols-2 gap-1 text-[10px] text-slate-300 font-mono-code">
              <div>Backhaul: <span class="text-cyan-400">${e.backhaulType}</span></div>
              <div>Connected: <span class="text-emerald-400">${e.connectedSensorsCount} sensors</span></div>
              <div>Battery: <span class="text-amber-400">${e.batteryPercentage}%</span></div>
              <div>Status: <span class="text-emerald-400">${e.status}</span></div>
            </div>
          </div>
        `)}),m&&N.forEach(e=>{const o=Math.round(e.currentOccupancy/e.capacity*100);let s="#10b981";o>90?s="#ef4444":o>70&&(s="#f59e0b");const r=`
          <div style="
            background: rgba(15, 23, 42, 0.95);
            border: 2px solid ${s};
            border-radius: 8px;
            padding: 3px 6px;
            display: flex;
            align-items: center;
            gap: 4px;
            box-shadow: 0 0 10px ${s}66;
            cursor: pointer;
            white-space: nowrap;
          ">
            <span style="font-size: 11px;">⛺</span>
            <div style="text-align: left;">
              <div style="font-size: 9px; font-weight: bold; color: #f8fafc;">${e.name.split(" ")[0]}</div>
              <div style="font-size: 8px; color: ${s}; font-family: monospace;">${e.currentOccupancy}/${e.capacity} (${o}%)</div>
            </div>
          </div>
        `,d=a.divIcon({html:r,className:"custom-shelter-marker",iconSize:[80,26],iconAnchor:[40,13]});a.marker([e.lat,e.lng],{icon:d}).addTo(i).on("click",()=>Y(e))}),B&&C.forEach(e=>{const s=a.divIcon({html:`
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
        `,className:"custom-hosp-marker",iconSize:[26,26],iconAnchor:[13,13]});a.marker([e.lat,e.lng],{icon:s}).addTo(i).bindPopup(`
          <div class="p-2 text-xs">
            <h4 class="font-tactical font-bold text-red-400">${e.name}</h4>
            <div class="mt-1 space-y-1 text-[11px] text-slate-300">
              <div>Total Beds: <strong>${e.totalBeds}</strong> (Occupied: ${e.occupiedBeds})</div>
              <div>ICU Available: <strong class="text-emerald-400">${e.icuBedsAvailable}</strong></div>
              <div>ER Load: <strong class="text-amber-400">${e.emergencyRoomStatus}</strong></div>
              <div>Trauma Level: <strong>Level ${e.traumaCenterLevel}</strong></div>
              <div>Contact: <a href="tel:${e.contact}" class="text-cyan-400">${e.contact}</a></div>
            </div>
          </div>
        `)}),b&&j.forEach(e=>{const o=`
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
            <span>${e.department}</span>
          </div>
        `,s=a.divIcon({html:o,className:"custom-team-marker",iconSize:[70,22],iconAnchor:[35,11]});a.marker([e.lat,e.lng],{icon:s}).addTo(i).on("click",()=>U(e))}),F.forEach(e=>{const s=a.divIcon({html:`
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
      `,className:"custom-amb-marker",iconSize:[22,22],iconAnchor:[11,11]});a.marker([e.lat,e.lng],{icon:s}).addTo(i)}),h&&R.forEach(e=>{const s=a.divIcon({html:`
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
        `,className:"custom-sos-marker",iconSize:[26,26],iconAnchor:[13,13]});a.marker([e.lat,e.lng],{icon:s}).addTo(i).bindPopup(`
          <div class="p-2 text-xs">
            <div class="flex items-center justify-between mb-1">
              <span class="px-1.5 py-0.5 rounded bg-red-600 text-white font-bold text-[10px]">SOS BEACON</span>
              <span class="text-slate-400 font-mono-code text-[10px]">${e.timestamp}</span>
            </div>
            <h4 class="font-tactical font-bold text-slate-100">${e.citizenName} (${e.phone})</h4>
            <div class="mt-1 space-y-1 text-slate-300 text-[11px]">
              <div>Trapped Count: <strong class="text-red-400">${e.trappedCount} persons</strong></div>
              <div>Urgency: <strong class="text-amber-400">${e.medicalUrgency}</strong></div>
              <div>Battery: <strong>${e.batteryLevel}%</strong> | Net: <strong>${e.networkType}</strong></div>
              <p class="text-slate-200 bg-slate-900/90 p-1.5 rounded mt-1 border border-slate-800">${e.notes}</p>
            </div>
          </div>
        `)}))},[k,$,E,N,C,j,F,L,R,x,u,O,m,B,b,H,h,v,A,G,T,D,f]);const oe=()=>{c.current&&(c.current.setView([S,w],6,{animate:!0}),I("India overview — 16 hazard clusters"))},ae=()=>{c.current&&(c.current.setView([S,w],6,{animate:!0}),I("India overview — 16 hazard clusters"))};return t.jsxs("div",{className:"relative w-full h-full min-h-[540px] rounded-lg overflow-hidden border border-[rgba(255,255,255,0.1)] bg-[#05070A] flex flex-col shadow-2xl",children:[t.jsxs("div",{className:"absolute top-3 left-3 z-[400] flex flex-wrap items-center gap-2 max-w-[calc(100%-24px)]",children:[t.jsxs("div",{className:"flex items-center gap-1 bg-[rgba(10,14,20,0.85)] backdrop-blur-md p-1 rounded border border-[rgba(255,255,255,0.1)] text-xs shadow-xl font-mono-code",children:[t.jsxs("button",{id:"filter-toggle-buildings",onClick:()=>X(!x),className:`px-2 py-1 rounded transition-colors flex items-center gap-1.5 ${x?"bg-[#00D1FF]/20 text-[#00D1FF] border border-[#00D1FF]/40 font-bold":"text-slate-500 hover:text-slate-300"}`,children:[t.jsx(ce,{className:"w-3 h-3"}),t.jsx("span",{children:"[X] Buildings"})]}),t.jsxs("button",{id:"filter-toggle-redzone",onClick:()=>J(l=>!l),className:`px-2 py-1 rounded transition-colors flex items-center gap-1.5 ${v?"bg-[#FF3D00]/20 text-[#FF3D00] border border-[#FF3D00]/40 font-bold":"text-slate-500 hover:text-slate-300"}`,children:[t.jsx(de,{className:"w-3 h-3"}),t.jsx("span",{children:"[X] Hazard Zone"})]}),t.jsxs("button",{id:"filter-toggle-sensors",onClick:()=>K(!u),className:`px-2 py-1 rounded transition-colors flex items-center gap-1.5 ${u?"bg-[#00D1FF]/20 text-[#00D1FF] border border-[#00D1FF]/40 font-bold":"text-slate-500 hover:text-slate-300"}`,children:[t.jsx(pe,{className:"w-3 h-3"}),t.jsx("span",{children:"[X] IoT Sensors"})]}),t.jsxs("button",{id:"filter-toggle-shelters",onClick:()=>Z(!m),className:`px-2 py-1 rounded transition-colors flex items-center gap-1.5 ${m?"bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/40 font-bold":"text-slate-500 hover:text-slate-300"}`,children:[t.jsx(fe,{className:"w-3 h-3"}),t.jsx("span",{children:"[X] Shelters"})]}),t.jsxs("button",{id:"filter-toggle-rescue",onClick:()=>Q(!b),className:`px-2 py-1 rounded transition-colors flex items-center gap-1.5 ${b?"bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold":"text-slate-500 hover:text-slate-300"}`,children:[t.jsx(xe,{className:"w-3 h-3"}),t.jsx("span",{children:"Rescue Units"})]}),t.jsxs("button",{id:"filter-toggle-sos",onClick:()=>q(!h),className:`px-2 py-1 rounded transition-colors flex items-center gap-1.5 ${h?"bg-[#FF3D00]/25 text-[#FF3D00] border border-[#FF3D00]/50 font-bold":"text-slate-500 hover:text-slate-300"}`,children:[t.jsx(ue,{className:"w-3 h-3"}),t.jsx("span",{children:"SOS"})]})]}),t.jsxs("div",{className:"relative flex items-center",children:[t.jsx("input",{id:"gis-map-search-input",type:"text",placeholder:"Search Sector / Structure...",value:f,onChange:l=>te(l.target.value),className:"w-48 px-2.5 py-1 pl-7 bg-[rgba(10,14,20,0.85)] backdrop-blur-md border border-[rgba(255,255,255,0.1)] rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#00D1FF]"}),t.jsx(le,{className:"w-3 h-3 text-slate-400 absolute left-2 pointer-events-none"})]})]}),t.jsxs("div",{className:"absolute top-3 right-3 z-[400] flex items-center gap-2",children:[t.jsx("span",{className:"rounded bg-[rgba(10,14,20,0.85)] px-2 py-1 text-[10px] text-slate-300 shadow-xl",role:"status",children:W}),t.jsx("button",{id:"btn-recenter-map",onClick:oe,className:"p-1.5 bg-[rgba(10,14,20,0.85)] backdrop-blur-md border border-[rgba(255,255,255,0.1)] rounded text-slate-300 hover:text-[#00D1FF] hover:border-[#00D1FF]/50 shadow-xl transition-all",title:"Recenter Map on Active Incident",children:t.jsx(me,{className:"w-3.5 h-3.5"})}),t.jsx("button",{id:"btn-locate-user",onClick:ae,className:"p-1.5 bg-[rgba(10,14,20,0.85)] backdrop-blur-md border border-[rgba(255,255,255,0.1)] rounded text-slate-300 hover:text-[#00D1FF] hover:border-[#00D1FF]/50 shadow-xl transition-all",title:"Locate me using browser GPS",children:t.jsx(be,{className:"w-3.5 h-3.5"})}),t.jsx("button",{id:"btn-radar-toggle",onClick:()=>ee(!y),className:`p-1.5 bg-[rgba(10,14,20,0.85)] backdrop-blur-md border rounded shadow-xl transition-all ${y?"text-[#00D1FF] border-[#00D1FF]/50 bg-[#00D1FF]/10":"text-slate-400 border-[rgba(255,255,255,0.1)]"}`,title:"Toggle Radar Sweep Effect",children:t.jsx(he,{className:"w-3.5 h-3.5"})})]}),t.jsxs("div",{className:"absolute bottom-4 left-4 z-[400] bg-[rgba(10,14,20,0.9)] backdrop-blur-md border border-[rgba(255,255,255,0.1)] rounded p-2.5 text-[11px] shadow-2xl max-w-xs pointer-events-auto",children:[t.jsxs("div",{className:"panel-title pb-1.5 mb-1.5 border-b border-[rgba(255,255,255,0.08)]",children:[t.jsx("span",{children:"MAP LAYERS & SYMBOLS"}),t.jsx("span",{className:"text-[10px] font-mono-code text-[#00D1FF]",children:"EPSG:4326"})]}),t.jsxs("div",{className:"grid grid-cols-2 gap-x-3 gap-y-1.5 text-slate-300 font-mono-code text-[10px]",children:[t.jsxs("div",{className:"flex items-center gap-1.5",children:[t.jsx("span",{className:"w-2 h-2 rounded-full bg-[#FF3D00]"}),t.jsx("span",{children:"Critical Evac"})]}),t.jsxs("div",{className:"flex items-center gap-1.5",children:[t.jsx("span",{className:"w-2 h-2 rounded-full bg-[#FFB800]"}),t.jsx("span",{children:"High Risk Watch"})]}),t.jsxs("div",{className:"flex items-center gap-1.5",children:[t.jsx("span",{className:"w-2 h-2 rounded-full border border-[#00D1FF] bg-[#00D1FF]/40"}),t.jsx("span",{children:"IoT Sensor Probe"})]}),t.jsxs("div",{className:"flex items-center gap-1.5",children:[t.jsx("span",{className:"w-2 h-2 rounded bg-[#00E676]"}),t.jsx("span",{children:"Shelter Safe Haven"})]}),t.jsxs("div",{className:"flex items-center gap-1.5",children:[t.jsx("span",{className:"w-3 h-0.5 bg-[#00E676]"}),t.jsx("span",{children:"Open Evac Route"})]}),t.jsxs("div",{className:"flex items-center gap-1.5",children:[t.jsx("span",{className:"w-3 h-0.5 bg-[#FF3D00]",style:{borderBottom:"2px dashed #FF3D00"}}),t.jsx("span",{children:"Flooded Road"})]})]})]}),t.jsx("div",{ref:g,className:"w-full h-full min-h-[560px] flex-1 z-0 relative",children:y&&t.jsx("div",{className:"absolute inset-0 pointer-events-none overflow-hidden z-[350] opacity-25",children:t.jsx("div",{className:"w-[1200px] h-[1200px] absolute -top-[300px] -left-[200px] rounded-full border border-cyan-500/20 bg-gradient-to-tr from-transparent via-cyan-500/10 to-transparent animate-radar-sweep origin-center"})})})]})};export{Re as GISCommandMap};
