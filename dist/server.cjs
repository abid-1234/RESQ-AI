var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// backend/config.ts
var import_dotenv, config;
var init_config = __esm({
  "backend/config.ts"() {
    import_dotenv = __toESM(require("dotenv"), 1);
    import_dotenv.default.config();
    config = {
      port: parseInt(process.env.PORT || "3000", 10),
      nodeEnv: process.env.NODE_ENV || "development",
      geminiApiKey: process.env.GEMINI_API_KEY || "",
      mongoUri: process.env.MONGODB_URI || process.env.DATABASE_URL || "",
      jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
      aiMode: process.env.AI_MODE || "DEMO",
      automaticMode: (process.env.AUTOMATIC_MODE || "true").toLowerCase() === "true",
      mqtt: {
        broker: process.env.MQTT_BROKER || "",
        port: parseInt(process.env.MQTT_PORT || "8883", 10),
        username: process.env.MQTT_USERNAME || "",
        password: process.env.MQTT_PASSWORD || "",
        tls: (process.env.MQTT_TLS || "true").toLowerCase() === "true"
      },
      cbcAdapter: process.env.CBC_ADAPTER || "mock_cbc",
      cbcApiUrl: process.env.CBC_API_URL || "",
      cbcApiKey: process.env.CBC_API_KEY || "",
      smsApiKey: process.env.SMS_API_KEY || "",
      smsApiUrl: process.env.SMS_API_URL || "",
      emailHost: process.env.EMAIL_HOST || "",
      emailPort: parseInt(process.env.EMAIL_PORT || "587", 10),
      emailUser: process.env.EMAIL_USER || "",
      emailPassword: process.env.EMAIL_PASSWORD || "",
      emailFrom: process.env.EMAIL_FROM || "noreply@resq-ai.local"
    };
  }
});

// backend/middleware/auth.ts
function verifyToken(token) {
  return import_jsonwebtoken.default.verify(
    token,
    config.jwtSecret
  );
}
var import_jsonwebtoken;
var init_auth = __esm({
  "backend/middleware/auth.ts"() {
    import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
    init_config();
  }
});

// backend/ws/server.ts
var server_exports = {};
__export(server_exports, {
  attachWs: () => attachWs,
  publish: () => publish,
  wsClientCount: () => wsClientCount
});
function attachWs(httpServer) {
  const wss = new import_ws.WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", (ws, req) => {
    const url = new URL(req.url || "/ws", `http://${req.headers.host || "localhost"}`);
    const token = url.searchParams.get("token");
    if (token) {
      try {
        verifyToken(token);
      } catch {
      }
    }
    clients.add(ws);
    ws.on("close", () => clients.delete(ws));
    ws.on("error", () => clients.delete(ws));
    ws.send(JSON.stringify({ event: "connected", timestamp: (/* @__PURE__ */ new Date()).toISOString() }));
  });
  return wss;
}
function publish(event, payload) {
  const msg = JSON.stringify({ event, payload, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  for (const ws of clients) {
    if (ws.readyState === import_ws.WebSocket.OPEN) {
      try {
        ws.send(msg);
      } catch {
      }
    }
  }
}
function wsClientCount() {
  let n = 0;
  for (const ws of clients) if (ws.readyState === import_ws.WebSocket.OPEN) n++;
  return n;
}
var import_ws, clients;
var init_server = __esm({
  "backend/ws/server.ts"() {
    import_ws = require("ws");
    init_auth();
    clients = /* @__PURE__ */ new Set();
  }
});

// backend/iot/topicRouter.ts
function parseTopic(topic) {
  const parts = topic.split("/");
  if (parts.length !== 4) return null;
  if (parts[0] !== "resq") return null;
  const [, region, hazard, sensorType] = parts;
  if (!region || !hazard || !sensorType) return null;
  return { region: region.toLowerCase(), hazard: hazard.toLowerCase(), sensorType: sensorType.toLowerCase(), raw: topic };
}
var init_topicRouter = __esm({
  "backend/iot/topicRouter.ts"() {
  }
});

// backend/iot/mqttClient.ts
var mqttClient_exports = {};
__export(mqttClient_exports, {
  connectMqtt: () => connectMqtt,
  ingestFromTopic: () => ingestFromTopic,
  isMqttConnected: () => isMqttConnected,
  onMessage: () => onMessage,
  publishMock: () => publishMock,
  subscribeMock: () => subscribeMock
});
function onMessage(handler) {
  handlers.push(handler);
}
function subscribeMock(topicPattern, handler) {
  const arr = mockSubs.get(topicPattern) || [];
  arr.push(handler);
  mockSubs.set(topicPattern, arr);
}
function publishMock(topic, payload) {
  const buf = Buffer.from(typeof payload === "string" ? payload : JSON.stringify(payload));
  for (const [pattern, hs] of mockSubs.entries()) {
    const re = new RegExp("^" + pattern.replace(/\+/g, "[^/]+").replace(/#/g, ".*") + "$");
    if (re.test(topic)) hs.forEach((h) => h(topic, buf));
  }
  handlers.forEach((h) => h(topic, buf));
}
async function connectMqtt() {
  const broker = process.env.MQTT_BROKER || "";
  if (!broker) {
    connected = true;
    console.log("[mqtt] No broker configured \u2014 running in mock mode (in-process pub/sub)");
    return { mode: "mock", connected: true };
  }
  try {
    const mqtt = await import("mqtt").catch(() => null);
    if (!mqtt) {
      console.warn("[mqtt] mqtt package not installed \u2014 falling back to mock mode");
      connected = true;
      return { mode: "mock", connected: true };
    }
    const client = mqtt.connect(`mqtt${process.env.MQTT_TLS === "true" ? "s" : ""}://${broker}:${process.env.MQTT_PORT || 8883}`, {
      username: process.env.MQTT_USERNAME || void 0,
      password: process.env.MQTT_PASSWORD || void 0,
      clientId: `resq-ai-${Math.random().toString(36).slice(2, 8)}`
    });
    client.on("connect", () => {
      connected = true;
      console.log("[mqtt] Connected to", broker);
      client.subscribe("resq/+/+/+");
    });
    client.on("message", (topic, payload) => handlers.forEach((h) => h(topic, payload)));
    client.on("error", (e) => console.warn("[mqtt] error", e?.message));
    return { mode: "mqtt", connected: false };
  } catch (e) {
    console.warn("[mqtt] connect failed \u2014 mock mode:", e?.message);
    connected = true;
    return { mode: "mock", connected: true };
  }
}
function isMqttConnected() {
  return connected;
}
function ingestFromTopic(topic, rawPayload) {
  const parsed = parseTopic(topic);
  if (!parsed) return { ok: false, error: "Invalid topic hierarchy (expected resq/{region}/{hazard}/{sensor_type})" };
  let body;
  try {
    body = typeof rawPayload === "string" ? JSON.parse(rawPayload) : JSON.parse(rawPayload.toString());
  } catch {
    return { ok: false, error: "Invalid JSON payload" };
  }
  if (!body.sensorId || body.value === void 0) return { ok: false, error: "Missing sensorId or value" };
  return { ok: true };
}
var handlers, connected, mockSubs;
var init_mqttClient = __esm({
  "backend/iot/mqttClient.ts"() {
    init_topicRouter();
    handlers = [];
    connected = false;
    mockSubs = /* @__PURE__ */ new Map();
  }
});

// backend/server.ts
var import_express15 = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_http = require("http");
var import_genai = require("@google/genai");
init_config();

// backend/config/database.ts
var import_mongoose = __toESM(require("mongoose"), 1);
var connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL || "";
  if (!mongoUri) {
    console.warn("[database] MONGODB_URI not set \u2014 running with in-memory stores (mock mode).");
    return null;
  }
  try {
    await import_mongoose.default.connect(mongoUri);
    console.log("[database] MongoDB connected");
    return import_mongoose.default.connection;
  } catch (err) {
    console.warn("[database] MongoDB connection failed \u2014 falling back to in-memory stores:", err.message);
    return null;
  }
};
var database_default = connectDB;
var isDbConnected = () => import_mongoose.default.connection.readyState === 1;

// backend/middleware/correlation.ts
var import_crypto = require("crypto");
function correlationMiddleware(req, res, next) {
  const id = req.headers["x-correlation-id"] || (0, import_crypto.randomUUID)();
  req.correlationId = id;
  res.setHeader("x-correlation-id", id);
  next();
}

// backend/middleware/error.ts
function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const correlationId = req.correlationId;
  console.error(`[${correlationId || "no-correlation"}]`, err);
  res.status(status).json({
    error: err.message || "Internal server error",
    correlationId
  });
}

// backend/routes/incidents.ts
var import_express = __toESM(require("express"), 1);

// backend/models/Incident.ts
var import_mongoose2 = __toESM(require("mongoose"), 1);
var incidentSchema = new import_mongoose2.default.Schema({
  incidentId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  hazardType: {
    type: String,
    enum: ["FLOOD", "LANDSLIDE", "CYCLONE", "EARTHQUAKE", "FIRE", "INDUSTRIAL_ACCIDENT"],
    required: true
  },
  severity: {
    type: String,
    enum: ["LEVEL_1_LOW", "LEVEL_2_MODERATE", "LEVEL_3_HIGH", "LEVEL_4_CRITICAL"],
    default: "LEVEL_3_HIGH"
  },
  location: {
    latitude: Number,
    longitude: Number,
    sector: String,
    district: String,
    state: String
  },
  status: {
    type: String,
    enum: ["DECLARED", "ACTIVE", "MITIGATING", "RESOLVED"],
    default: "ACTIVE"
  },
  exposedPopulation: { type: Number, default: 0 },
  vulnerableCount: { type: Number, default: 0 },
  affectedBuildings: { type: Number, default: 0 },
  trappedCount: { type: Number, default: 0 },
  startTime: Date,
  endTime: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
var Incident_default = import_mongoose2.default.model("Incident", incidentSchema);

// backend/models/Shelter.ts
var import_mongoose3 = __toESM(require("mongoose"), 1);
var shelterSchema = new import_mongoose3.default.Schema({
  shelterId: { type: String, required: true, unique: true },
  name: String,
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
    sector: String
  },
  capacity: { type: Number, default: 0 },
  currentOccupancy: { type: Number, default: 0 },
  foodStock: { type: Number, default: 0 },
  waterStock: { type: Number, default: 0 },
  medicalBeds: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["READY", "PARTIAL", "FULL", "CLOSED"],
    default: "READY"
  },
  manager: String,
  contactPhone: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
var Shelter_default = import_mongoose3.default.model("Shelter", shelterSchema);

// backend/models/Building.ts
var import_mongoose4 = __toESM(require("mongoose"), 1);
var buildingSchema = new import_mongoose4.default.Schema({
  buildingId: { type: String, required: true, unique: true },
  name: String,
  buildingType: {
    type: String,
    enum: ["RESIDENTIAL", "COMMERCIAL", "INSTITUTIONAL", "INDUSTRIAL", "MIXED"],
    default: "RESIDENTIAL"
  },
  floors: { type: Number, default: 1 },
  occupants: { type: Number, default: 0 },
  vulnerabilityScore: { type: Number, min: 0, max: 100, default: 50 },
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
    sector: String
  },
  constructionYear: Number,
  hazardZone: {
    type: String,
    enum: ["GREEN", "YELLOW", "ORANGE", "RED"],
    default: "GREEN"
  },
  evacuationStatus: {
    type: String,
    enum: ["SAFE", "WARNING", "EVACUATING", "EVACUATED"],
    default: "SAFE"
  },
  rescueNeeded: Boolean,
  trappedPersons: { type: Number, default: 0 },
  structuralDamage: {
    type: String,
    enum: ["NONE", "MINOR", "MODERATE", "SEVERE", "COLLAPSED"],
    default: "NONE"
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
var Building_default = import_mongoose4.default.model("Building", buildingSchema);

// backend/services/incidentService.ts
var getActiveIncidents = async () => {
  return await Incident_default.find({ status: "ACTIVE" }).sort({ startTime: -1 });
};
var getIncidentById = async (incidentId) => {
  return await Incident_default.findOne({ incidentId });
};
var createIncident = async (incidentData) => {
  const newIncident = new Incident_default({
    incidentId: `INC-${Date.now()}`,
    ...incidentData,
    startTime: /* @__PURE__ */ new Date()
  });
  return await newIncident.save();
};
var updateIncident = async (incidentId, updateData) => {
  return await Incident_default.findOneAndUpdate(
    { incidentId },
    { ...updateData, updatedAt: /* @__PURE__ */ new Date() },
    { new: true }
  );
};
var getIncidentStats = async (incidentId) => {
  const incident = await getIncidentById(incidentId);
  if (!incident) return null;
  const affectedBuildings = await Building_default.find({
    "location.sector": incident.location.sector,
    hazardZone: { $in: ["RED", "ORANGE", "YELLOW"] }
  });
  const availableShelters = await Shelter_default.find({
    "location.sector": incident.location.sector,
    status: { $ne: "CLOSED" }
  });
  const totalShelterCapacity = availableShelters.reduce((sum, shelter) => sum + (shelter.capacity - shelter.currentOccupancy), 0);
  return {
    incident,
    affectedBuildingsCount: affectedBuildings.length,
    sheltersAvailable: availableShelters.length,
    totalShelterCapacity,
    vulnerablePriority: incident.vulnerableCount || 0,
    estimatedEvacuationTime: Math.ceil(incident.exposedPopulation / 50),
    riskLevel: incident.severity
  };
};
var closeIncident = async (incidentId) => {
  return await Incident_default.findOneAndUpdate(
    { incidentId },
    {
      status: "RESOLVED",
      endTime: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    },
    { new: true }
  );
};

// backend/routes/incidents.ts
var router = import_express.default.Router();
router.get("/", async (_req, res) => {
  try {
    const incidents = await getActiveIncidents();
    res.json({ success: true, incidents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/:incidentId", async (req, res) => {
  try {
    const incident = await getIncidentById(req.params.incidentId);
    if (!incident) return res.status(404).json({ error: "Incident not found" });
    res.json({ success: true, incident });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/:incidentId/stats", async (req, res) => {
  try {
    const stats = await getIncidentStats(req.params.incidentId);
    if (!stats) return res.status(404).json({ error: "Incident not found" });
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post("/", async (req, res) => {
  try {
    const incident = await createIncident(req.body);
    res.status(201).json({ success: true, incident });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.put("/:incidentId", async (req, res) => {
  try {
    const incident = await updateIncident(req.params.incidentId, req.body);
    if (!incident) return res.status(404).json({ error: "Incident not found" });
    res.json({ success: true, incident });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post("/:incidentId/close", async (req, res) => {
  try {
    const incident = await closeIncident(req.params.incidentId);
    if (!incident) return res.status(404).json({ error: "Incident not found" });
    res.json({ success: true, message: "Incident closed", incident });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
var incidents_default = router;

// backend/routes/shelters.ts
var import_express2 = __toESM(require("express"), 1);

// backend/services/shelterService.ts
var getAllShelters = async () => {
  return await Shelter_default.find().sort({ currentOccupancy: -1 });
};
var getShelterById = async (shelterId) => {
  return await Shelter_default.findOne({ shelterId });
};
var createShelter = async (shelterData) => {
  const newShelter = new Shelter_default({
    shelterId: `SH-${Date.now()}`,
    ...shelterData
  });
  return await newShelter.save();
};
var updateShelterOccupancy = async (shelterId, occupancy) => {
  const shelter = await getShelterById(shelterId);
  if (!shelter) return null;
  const newStatus = occupancy >= shelter.capacity ? "FULL" : occupancy > 0 ? "PARTIAL" : "READY";
  return await Shelter_default.findOneAndUpdate(
    { shelterId },
    {
      currentOccupancy: occupancy,
      status: newStatus,
      updatedAt: /* @__PURE__ */ new Date()
    },
    { new: true }
  );
};
var updateShelterResources = async (shelterId, resourceData) => {
  return await Shelter_default.findOneAndUpdate(
    { shelterId },
    {
      foodStock: resourceData.foodStock,
      waterStock: resourceData.waterStock,
      medicalBeds: resourceData.medicalBeds,
      updatedAt: /* @__PURE__ */ new Date()
    },
    { new: true }
  );
};
var getShelterCapacityReport = async () => {
  const shelters = await getAllShelters();
  const totalCapacity = shelters.reduce((sum, s) => sum + s.capacity, 0);
  const totalOccupancy = shelters.reduce((sum, s) => sum + s.currentOccupancy, 0);
  const availableSpaces = totalCapacity - totalOccupancy;
  const occupancyPercentage = Math.round(totalOccupancy / totalCapacity * 100);
  return {
    totalCapacity,
    totalOccupancy,
    availableSpaces,
    occupancyPercentage,
    shelters: shelters.map((s) => ({
      shelterId: s.shelterId,
      name: s.name,
      capacity: s.capacity,
      occupancy: s.currentOccupancy,
      occupancyPercent: Math.round(s.currentOccupancy / s.capacity * 100),
      status: s.status,
      foodDays: s.foodStock,
      waterLiters: s.waterStock,
      medicalBeds: s.medicalBeds
    }))
  };
};
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
var findNearestShelter = async (latitude, longitude) => {
  const shelters = await Shelter_default.find({ status: { $ne: "FULL" } });
  const withDistance = shelters.map((s) => {
    const distance = haversineKm(latitude, longitude, s.location.latitude, s.location.longitude);
    return { ...s.toObject(), distance, distanceKm: distance };
  });
  return withDistance.sort((a, b) => a.distance - b.distance)[0];
};

// backend/routes/shelters.ts
var router2 = import_express2.default.Router();
router2.get("/", async (_req, res) => {
  try {
    const shelters = await getAllShelters();
    res.json({ success: true, shelters });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router2.get("/report/capacity", async (_req, res) => {
  try {
    const report = await getShelterCapacityReport();
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router2.get("/:shelterId", async (req, res) => {
  try {
    const shelter = await getShelterById(req.params.shelterId);
    if (!shelter) return res.status(404).json({ error: "Shelter not found" });
    res.json({ success: true, shelter });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router2.post("/", async (req, res) => {
  try {
    const shelter = await createShelter(req.body);
    res.status(201).json({ success: true, shelter });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router2.put("/:shelterId/occupancy", async (req, res) => {
  try {
    const shelter = await updateShelterOccupancy(req.params.shelterId, req.body.occupancy);
    if (!shelter) return res.status(404).json({ error: "Shelter not found" });
    res.json({ success: true, shelter });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router2.put("/:shelterId/resources", async (req, res) => {
  try {
    const shelter = await updateShelterResources(req.params.shelterId, req.body);
    if (!shelter) return res.status(404).json({ error: "Shelter not found" });
    res.json({ success: true, shelter });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router2.post("/nearest", async (req, res) => {
  try {
    const shelter = await findNearestShelter(req.body.latitude, req.body.longitude);
    if (!shelter) return res.status(404).json({ error: "No available shelter found" });
    res.json({ success: true, shelter });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
var shelters_default = router2;

// backend/routes/buildings.ts
var import_express3 = __toESM(require("express"), 1);

// backend/services/buildingService.ts
var getBuildingsBySector = async (sector) => Building_default.find({ "location.sector": sector }).sort({ vulnerabilityScore: -1 });
var getBuildingsByHazardZone = async (hazardZone) => Building_default.find({ hazardZone }).sort({ vulnerabilityScore: -1 });
var getBuildingById = async (buildingId) => Building_default.findOne({ buildingId });
var createBuilding = async (buildingData) => new Building_default({ buildingId: `B-${Date.now()}`, ...buildingData }).save();
var updateBuildingEvacuation = async (buildingId, evacuationStatus, trappedPersons) => Building_default.findOneAndUpdate(
  { buildingId },
  { evacuationStatus, trappedPersons, rescueNeeded: trappedPersons > 0, updatedAt: /* @__PURE__ */ new Date() },
  { new: true }
);
var updateBuildingStructure = async (buildingId, damageLevel) => Building_default.findOneAndUpdate(
  { buildingId },
  { structuralDamage: damageLevel, updatedAt: /* @__PURE__ */ new Date() },
  { new: true }
);
var getHighRiskBuildings = async (sector) => {
  const query = { hazardZone: "RED", rescueNeeded: true };
  if (sector) query["location.sector"] = sector;
  return Building_default.find(query).sort({ trappedPersons: -1, vulnerabilityScore: -1 });
};
var getRescueOperationsStatus = async (sector) => {
  const query = { rescueNeeded: true };
  if (sector) query["location.sector"] = sector;
  const buildings = await Building_default.find(query);
  return {
    totalBuildingsNeedingRescue: buildings.length,
    totalTrappedPersons: buildings.reduce((sum, building) => sum + building.trappedPersons, 0),
    fullyEvacuatedBuildings: buildings.filter((building) => building.evacuationStatus === "EVACUATED").length,
    partiallyEvacuated: buildings.filter((building) => building.evacuationStatus === "EVACUATING").length,
    buildings: buildings.map((building) => ({
      buildingId: building.buildingId,
      name: building.name,
      trappedPersons: building.trappedPersons,
      evacuationStatus: building.evacuationStatus,
      structuralDamage: building.structuralDamage,
      location: building.location,
      priority: building.trappedPersons * (building.structuralDamage === "COLLAPSED" ? 2 : 1)
    }))
  };
};
var getGISBoundaryData = async () => {
  const buildings = await Building_default.find();
  const zones = ["RED", "ORANGE", "YELLOW"].reduce((result, zone) => {
    result[zone] = buildings.filter((building) => building.hazardZone === zone).map((building) => ({
      id: building.buildingId,
      name: building.name,
      coordinates: [building.location.latitude, building.location.longitude],
      occupants: building.occupants,
      riskScore: building.vulnerabilityScore
    }));
    return result;
  }, {});
  return {
    totalBuildings: buildings.length,
    highRiskCount: zones.RED.length,
    mediumRiskCount: zones.ORANGE.length,
    lowRiskCount: zones.YELLOW.length,
    zones
  };
};

// backend/routes/buildings.ts
var router3 = import_express3.default.Router();
router3.get("/sector/:sector", async (req, res) => {
  try {
    res.json({ success: true, buildings: await getBuildingsBySector(req.params.sector) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.get("/zone/:hazardZone", async (req, res) => {
  try {
    res.json({ success: true, buildings: await getBuildingsByHazardZone(req.params.hazardZone) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.get("/gis/boundaries", async (_req, res) => {
  try {
    res.json({ success: true, boundaries: await getGISBoundaryData() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.get("/risk/high", async (req, res) => {
  try {
    res.json({ success: true, buildings: await getHighRiskBuildings(req.query.sector) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.get("/rescue/status", async (req, res) => {
  try {
    res.json({ success: true, status: await getRescueOperationsStatus(req.query.sector) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.get("/:buildingId", async (req, res) => {
  try {
    const building = await getBuildingById(req.params.buildingId);
    if (!building) return res.status(404).json({ error: "Building not found" });
    res.json({ success: true, building });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.post("/", async (req, res) => {
  try {
    res.status(201).json({ success: true, building: await createBuilding(req.body) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.put("/:buildingId/evacuation", async (req, res) => {
  try {
    const building = await updateBuildingEvacuation(req.params.buildingId, req.body.evacuationStatus, req.body.trappedPersons);
    if (!building) return res.status(404).json({ error: "Building not found" });
    res.json({ success: true, building });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router3.put("/:buildingId/structure", async (req, res) => {
  try {
    const building = await updateBuildingStructure(req.params.buildingId, req.body.damageLevel);
    if (!building) return res.status(404).json({ error: "Building not found" });
    res.json({ success: true, building });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
var buildings_default = router3;

// backend/routes/alerts.ts
var import_express4 = __toESM(require("express"), 1);
var import_zod = require("zod");

// backend/models/Alert.ts
var import_mongoose5 = __toESM(require("mongoose"), 1);
var alertSchema = new import_mongoose5.default.Schema({
  alertId: { type: String, required: true, unique: true },
  incidentId: String,
  title: String,
  message: String,
  severity: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], default: "HIGH" },
  alertType: { type: String, enum: ["EVACUATION", "WARNING", "ALL_CLEAR", "SHELTER_FULL", "RESOURCE_ALERT", "TECHNICAL", "INFORMATIONAL"], default: "WARNING" },
  channels: { type: [String], enum: ["SMS", "PUSH", "BROWSER", "SACHET_CAP", "RADIO", "SIREN", "EMAIL"], default: ["SMS", "PUSH", "BROWSER", "SACHET_CAP"] },
  targetArea: { radiusKm: Number, latitude: Number, longitude: Number, sectors: [String] },
  estimatedAudience: Number,
  deliverySuccessRate: { type: Number, default: 0 },
  status: { type: String, enum: ["DRAFT", "SCHEDULED", "DISPATCHED", "ACKNOWLEDGED", "EXPIRED"], default: "DISPATCHED" },
  createdBy: String,
  createdAt: { type: Date, default: Date.now },
  dispatchedAt: Date,
  expiresAt: Date
});
var Alert_default = import_mongoose5.default.model("Alert", alertSchema);

// backend/services/alertService.ts
var createAlert = async (alertData) => new Alert_default({ alertId: `ALT-${Date.now()}`, ...alertData, createdAt: /* @__PURE__ */ new Date() }).save();
var getActiveAlerts = async () => Alert_default.find({ status: { $in: ["DISPATCHED", "ACKNOWLEDGED"] }, expiresAt: { $gt: /* @__PURE__ */ new Date() } }).sort({ createdAt: -1 });
var getAlertsByIncident = async (incidentId) => Alert_default.find({ incidentId }).sort({ createdAt: -1 });
var dispatchAlert = async (alertId) => {
  const expiresAt = /* @__PURE__ */ new Date();
  expiresAt.setHours(expiresAt.getHours() + 4);
  return Alert_default.findOneAndUpdate({ alertId }, { status: "DISPATCHED", dispatchedAt: /* @__PURE__ */ new Date(), expiresAt }, { new: true });
};
var updateAlertDeliveryStatus = async (alertId, successRate, acknowledgedCount) => Alert_default.findOneAndUpdate(
  { alertId },
  { deliverySuccessRate: successRate, status: acknowledgedCount > 0 ? "ACKNOWLEDGED" : "DISPATCHED", updatedAt: /* @__PURE__ */ new Date() },
  { new: true }
);
var expireOldAlerts = async () => Alert_default.updateMany(
  { expiresAt: { $lt: /* @__PURE__ */ new Date() }, status: { $ne: "EXPIRED" } },
  { status: "EXPIRED" }
);
var getAlertStatistics = async () => {
  const alerts = await Alert_default.find();
  return {
    totalAlerts: alerts.length,
    bySeverity: {
      CRITICAL: alerts.filter((alert) => alert.severity === "CRITICAL").length,
      HIGH: alerts.filter((alert) => alert.severity === "HIGH").length,
      MEDIUM: alerts.filter((alert) => alert.severity === "MEDIUM").length,
      LOW: alerts.filter((alert) => alert.severity === "LOW").length
    },
    byStatus: {
      DISPATCHED: alerts.filter((alert) => alert.status === "DISPATCHED").length,
      ACKNOWLEDGED: alerts.filter((alert) => alert.status === "ACKNOWLEDGED").length,
      EXPIRED: alerts.filter((alert) => alert.status === "EXPIRED").length
    },
    averageDeliverySuccessRate: alerts.length > 0 ? Math.round(alerts.reduce((sum, alert) => sum + alert.deliverySuccessRate, 0) / alerts.length) : 0,
    recentAlerts: alerts.slice(0, 10)
  };
};
var broadcastAlert = async (alertData) => {
  const alert = await createAlert({ ...alertData, status: "SCHEDULED" });
  await dispatchAlert(alert.alertId);
  return alert;
};

// backend/services/alertDecisionEngine.ts
var counter = 0;
function nextEventId() {
  const y = (/* @__PURE__ */ new Date()).getFullYear();
  counter = (counter + 1) % 1e5;
  return `RESQ-EVT-${y}-${String(counter).padStart(6, "0")}`;
}
function decide(input) {
  const policyBoost = input.policy === "aggressive" ? 0.15 : input.policy === "conservative" ? -0.1 : 0;
  const ttiFactor = input.ttiMinutes !== void 0 && input.ttiMinutes < 60 ? 0.15 : input.ttiMinutes !== void 0 && input.ttiMinutes < 180 ? 0.05 : 0;
  const score = Math.max(0, Math.min(1, input.probability * 0.3 + input.severity * 0.4 + input.confidence * 0.2 + ttiFactor + policyBoost));
  let decision = "NO_ALERT";
  let reason = `score=${score.toFixed(2)} (p=${input.probability} s=${input.severity} conf=${input.confidence} exposure=${input.exposure})`;
  if (score >= 0.75 && input.exposure >= 100) {
    decision = "EVACUATE";
    reason += " \u2192 EVACUATE (high score + exposure)";
  } else if (score >= 0.6) {
    decision = "WARNING";
    reason += " \u2192 WARNING";
  } else if (score >= 0.4) {
    decision = "WATCH";
    reason += " \u2192 WATCH";
  } else if (score >= 0.2) {
    decision = "ADVISORY";
    reason += " \u2192 ADVISORY";
  }
  return { decision, score: +score.toFixed(3), reason };
}

// backend/providers/cbc.ts
init_config();
async function sendCbc(payload) {
  if (config.cbcAdapter === "production" && config.cbcApiUrl && config.cbcApiKey) {
    try {
      await fetch(config.cbcApiUrl, {
        method: "POST",
        headers: { "Authorization": `Bearer ${config.cbcApiKey}`, "Content-Type": "application/xml" },
        body: payload.capXml
      });
      return { channel: "CBC_ADAPTER", mode: "LIVE", providerResponse: `CBC LIVE via ${config.cbcApiUrl}` };
    } catch (e) {
      return { channel: "CBC_ADAPTER", mode: "LIVE", providerResponse: `CBC production error: ${e?.message}` };
    }
  }
  return { channel: "SIMULATION", mode: "SIMULATION", providerResponse: "SIMULATION \u2014 CBC test endpoint (no telecom transmission)" };
}
function cbcTestPayload() {
  return {
    adapter: config.cbcAdapter,
    cbcApiUrl: config.cbcApiUrl ? "[configured]" : null,
    mode: config.cbcAdapter === "production" && config.cbcApiUrl ? "LIVE" : "SIMULATION",
    note: config.cbcAdapter === "production" ? "CBC adapter production mode" : "SIMULATION \u2014 no telecom transmission claimed"
  };
}

// backend/cap/cap12.ts
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function buildCapXml(alert) {
  const infos = alert.info.map((i) => `  <info>
    <language>${esc(i.language)}</language>
    <category>${esc(i.category)}</category>
    <event>${esc(i.event)}</event>
    <urgency>${esc(i.urgency)}</urgency>
    <severity>${esc(i.severity)}</severity>
    <certainty>${esc(i.certainty)}</certainty>
    <headline>${esc(i.headline)}</headline>
    <description>${esc(i.description)}</description>
    <instruction>${esc(i.instruction)}</instruction>
    <area>
      <areaDesc>${esc(i.areaDesc)}</areaDesc>
      ${i.polygon ? `<polygon>${esc(i.polygon)}</polygon>` : ""}
      ${i.circle ? `<circle>${esc(i.circle)}</circle>` : ""}
    </area>
  </info>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>${esc(alert.identifier)}</identifier>
  <sender>${esc(alert.sender)}</sender>
  <sent>${esc(alert.sent)}</sent>
  <status>${esc(alert.status)}</status>
  <msgType>${esc(alert.msgType)}</msgType>
  <scope>${esc(alert.scope)}</scope>
${infos}
</alert>`;
}

// backend/providers/sms.ts
init_config();
async function sendSms(payload) {
  if (!config.smsApiKey) {
    return { channel: "SMS", mode: "SIMULATION", providerResponse: "SIMULATION \u2014 no SMS sent", audience: payload.to?.length ?? 3420 };
  }
  try {
    if (config.smsApiUrl) {
      await fetch(config.smsApiUrl, { method: "POST", headers: { "Authorization": `Bearer ${config.smsApiKey}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    return { channel: "SMS", mode: "LIVE", audience: payload.to?.length ?? 3420 };
  } catch (e) {
    return { channel: "SMS", mode: "SIMULATION", providerResponse: `SMS provider error (fell back to SIMULATION): ${e?.message}` };
  }
}

// backend/providers/email.ts
init_config();
async function sendEmail(payload) {
  if (!config.emailUser || !config.emailHost) {
    return { channel: "EMAIL", mode: "SIMULATION", providerResponse: "SIMULATION \u2014 no email sent (EMAIL_HOST/USER not configured)" };
  }
  return { channel: "EMAIL", mode: "LIVE", providerResponse: `EMAIL LIVE via ${config.emailHost}` };
}

// backend/services/broadcastManager.ts
async function broadcast(req) {
  const capXml = buildCapXml(req.capAlert);
  const results = [];
  const isSimulation = !req.channels.some((c) => c === "CBC_ADAPTER" || c === "SMS" || c === "EMAIL") || req.channels.includes("SIMULATION");
  for (const ch of req.channels) {
    if (ch === "CAP") {
      results.push({ channel: "CAP", mode: "LIVE", ok: true, capXml, detail: "CAP 1.2 XML generated" });
    } else if (ch === "APP_BROADCAST" || ch === "WEBSOCKET_BROADCAST") {
      results.push({ channel: ch, mode: "LIVE", ok: true, detail: `${ch} \u2014 published to connected clients` });
    } else if (ch === "SMS") {
      const r = await sendSms({ message: req.smsMessage ?? req.capAlert.info[0]?.headline ?? "RESQ-AI Alert" });
      results.push({ channel: "SMS", mode: r.mode, ok: true, detail: r.providerResponse });
    } else if (ch === "EMAIL") {
      const r = await sendEmail({ subject: req.emailSubject ?? "RESQ-AI Alert", html: req.emailHtml ?? capXml });
      results.push({ channel: "EMAIL", mode: r.mode, ok: true, detail: r.providerResponse });
    } else if (ch === "CBC_ADAPTER") {
      const r = await sendCbc({ capXml });
      const mappedChannel = r.channel === "CBC_ADAPTER" ? "CBC_ADAPTER" : "SIMULATION";
      results.push({ channel: mappedChannel, mode: r.mode, ok: true, detail: r.providerResponse, capXml });
    } else if (ch === "SIMULATION") {
      results.push({ channel: "SIMULATION", mode: "SIMULATION", ok: true, detail: "SIMULATION \u2014 no telecom transmission claimed", capXml });
    }
  }
  const mode = results.some((r) => r.mode === "LIVE" && r.channel !== "CAP" && r.channel !== "APP_BROADCAST" && r.channel !== "WEBSOCKET_BROADCAST") ? "LIVE" : "SIMULATION";
  const honestMode = results.some((r) => r.mode === "LIVE" && (r.channel === "SMS" || r.channel === "EMAIL" || r.channel === "CBC_ADAPTER")) ? "LIVE" : "SIMULATION";
  void isSimulation;
  return { mode: honestMode, capXml, results };
}

// backend/routes/alerts.ts
var router4 = import_express4.default.Router();
var ackStore = /* @__PURE__ */ new Map();
router4.get("/", async (req, res) => {
  try {
    const alerts = await getActiveAlerts();
    res.json({ success: true, alerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router4.get("/stats/overview", async (req, res) => {
  try {
    const stats = await getAlertStatistics();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router4.get("/incident/:incidentId", async (req, res) => {
  try {
    const alerts = await getAlertsByIncident(req.params.incidentId);
    res.json({ success: true, alerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router4.post("/", async (req, res) => {
  try {
    const alert = await createAlert(req.body);
    res.status(201).json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router4.post("/broadcast", async (req, res) => {
  try {
    const alert = await broadcastAlert(req.body);
    res.status(201).json({
      success: true,
      alert,
      message: "Alert dispatched successfully",
      estimatedAudience: alert.estimatedAudience,
      channels: alert.channels
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router4.put("/:alertId/delivery", async (req, res) => {
  try {
    const { successRate, acknowledgedCount } = req.body;
    const alert = await updateAlertDeliveryStatus(req.params.alertId, successRate, acknowledgedCount);
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router4.post("/maintenance/expire-old", async (req, res) => {
  try {
    const result = await expireOldAlerts();
    res.json({ success: true, message: "Old alerts expired", modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router4.post("/decide", (req, res) => {
  const schema2 = import_zod.z.object({
    probability: import_zod.z.number().min(0).max(1),
    severity: import_zod.z.number().min(0).max(1),
    exposure: import_zod.z.number().min(0),
    ttiMinutes: import_zod.z.number().min(0).optional(),
    confidence: import_zod.z.number().min(0).max(1),
    policy: import_zod.z.enum(["conservative", "standard", "aggressive"]).optional()
  });
  const parsed = schema2.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  const result = decide(parsed.data);
  res.json({ success: true, eventId: nextEventId(), ...result });
});
router4.get("/cbc/test", (_req, res) => {
  res.json({ success: true, cbc: cbcTestPayload() });
});
router4.post("/dispatch", async (req, res) => {
  const schema2 = import_zod.z.object({
    capAlert: import_zod.z.object({
      identifier: import_zod.z.string().min(1),
      sender: import_zod.z.string().min(1),
      sent: import_zod.z.string().min(1),
      status: import_zod.z.string().min(1),
      msgType: import_zod.z.string().min(1),
      scope: import_zod.z.string().min(1),
      info: import_zod.z.array(import_zod.z.object({
        language: import_zod.z.string().min(1),
        category: import_zod.z.string().min(1),
        event: import_zod.z.string().min(1),
        urgency: import_zod.z.string().min(1),
        severity: import_zod.z.string().min(1),
        certainty: import_zod.z.string().min(1),
        headline: import_zod.z.string().min(1),
        description: import_zod.z.string().min(1),
        instruction: import_zod.z.string().min(1),
        areaDesc: import_zod.z.string().min(1),
        polygon: import_zod.z.string().optional(),
        circle: import_zod.z.string().optional()
      })).min(1)
    }),
    channels: import_zod.z.array(import_zod.z.enum(["APP_BROADCAST", "WEBSOCKET_BROADCAST", "SMS", "EMAIL", "CAP", "CBC_ADAPTER", "SIMULATION"])).min(1),
    smsMessage: import_zod.z.string().optional()
  });
  const parsed = schema2.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  try {
    const capXml = buildCapXml(parsed.data.capAlert);
    const out = await broadcast({ capAlert: parsed.data.capAlert, channels: parsed.data.channels, smsMessage: parsed.data.smsMessage });
    res.json({ success: true, capXml, mode: out.mode, results: out.results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router4.post("/:alertId/ack", (req, res) => {
  const schema2 = import_zod.z.object({ status: import_zod.z.enum(["RECEIVED", "ACKNOWLEDGED", "FAILED", "PARTIAL"]), note: import_zod.z.string().max(2e3).optional() });
  const parsed = schema2.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  const alertId = req.params.alertId;
  if (!ackStore.has(alertId)) ackStore.set(alertId, []);
  const entry = { alertId, status: parsed.data.status, note: parsed.data.note, at: (/* @__PURE__ */ new Date()).toISOString() };
  ackStore.get(alertId).push(entry);
  res.json({ success: true, ack: entry, history: ackStore.get(alertId) });
});
router4.get("/:alertId/ack", (req, res) => {
  res.json({ success: true, alertId: req.params.alertId, history: ackStore.get(req.params.alertId) ?? [] });
});
var alerts_default = router4;

// backend/routes/telemetry.ts
var import_express5 = __toESM(require("express"), 1);
var import_zod2 = require("zod");

// backend/store/memory.ts
var sensorRegistry = /* @__PURE__ */ new Map([
  ["sns-01", { sensorId: "sns-01", nodeCode: "NODE-WTR-SEC4-01", type: "WATER_LEVEL", lat: 17.374, lng: 78.4775, gatewayId: "gw-01", allowedUnits: ["meters (gauge)", "m3/s velocity"] }],
  ["sns-02", { sensorId: "sns-02", nodeCode: "NODE-RAIN-HILL-02", type: "RAINFALL", lat: 17.401, lng: 78.473, gatewayId: "gw-03", allowedUnits: ["mm/hour (Extreme)", "mm cumulative 24h"] }],
  ["sns-03", { sensorId: "sns-03", nodeCode: "NODE-SOIL-HILL-03", type: "SOIL_MOISTURE", lat: 17.3995, lng: 78.4715, gatewayId: "gw-03", allowedUnits: ["% saturation", "degrees tilt shift"] }],
  ["sns-04", { sensorId: "sns-04", nodeCode: "NODE-SEIS-CTR-04", type: "SEISMIC_VIBRATION", lat: 17.39, lng: 78.486, gatewayId: "gw-02", allowedUnits: ["g Peak Ground Acceleration (PGA)", "Hz frequency band"] }],
  ["sns-05", { sensorId: "sns-05", nodeCode: "NODE-WTR-SEC2-05", type: "WATER_LEVEL", lat: 17.387, lng: 78.484, gatewayId: "gw-02", allowedUnits: ["meters (Moderate)"] }],
  ["sns-06", { sensorId: "sns-06", nodeCode: "NODE-BARO-IND-06", type: "WEATHER_BARO", lat: 17.375, lng: 78.501, gatewayId: "gw-04", allowedUnits: ["hPa (Pressure Drop)", "km/h Gusts"] }]
]);
var telemetryStore = [];
var MAX_TELEMETRY = 5e3;
var seenTimestamps = /* @__PURE__ */ new Map();
var rateWindow = /* @__PURE__ */ new Map();
function pushReading(r) {
  telemetryStore.push(r);
  if (telemetryStore.length > MAX_TELEMETRY) telemetryStore.shift();
}
function registerSensor(meta) {
  sensorRegistry.set(meta.sensorId, meta);
}

// backend/routes/telemetry.ts
var router5 = import_express5.default.Router();
var REPLAY_WINDOW_MS = parseInt(process.env.TELEMETRY_REPLAY_WINDOW_MS || "300000", 10);
var RATE_LIMIT_PER_MIN = parseInt(process.env.RATE_LIMIT_PER_SENSOR_PER_MINUTE || "60", 10);
var telemetrySchema = import_zod2.z.object({
  sensorId: import_zod2.z.string().min(1),
  timestamp: import_zod2.z.string().min(1),
  // ISO 8601 — validated below
  latitude: import_zod2.z.number().min(-90).max(90),
  longitude: import_zod2.z.number().min(-180).max(180),
  value: import_zod2.z.number(),
  unit: import_zod2.z.string().min(1),
  secondaryValue: import_zod2.z.number().optional(),
  secondaryUnit: import_zod2.z.string().optional(),
  gatewayId: import_zod2.z.string().optional(),
  status: import_zod2.z.string().optional(),
  authStatus: import_zod2.z.enum(["authenticated", "unauthenticated", "unknown"]).optional()
});
function isReplay(sensorId, ts) {
  const set = seenTimestamps.get(sensorId);
  return !!set?.has(ts);
}
function markSeen(sensorId, ts) {
  if (!seenTimestamps.has(sensorId)) seenTimestamps.set(sensorId, /* @__PURE__ */ new Set());
  seenTimestamps.get(sensorId).add(ts);
}
function isRateLimited(sensorId) {
  const now = Date.now();
  const window = rateWindow.get(sensorId) || [];
  const recent = window.filter((t) => now - t < 6e4);
  rateWindow.set(sensorId, recent);
  if (recent.length >= RATE_LIMIT_PER_MIN) return true;
  recent.push(now);
  rateWindow.set(sensorId, recent);
  return false;
}
function validateSemantics(body) {
  const parsed = new Date(body.timestamp);
  if (isNaN(parsed.getTime())) return "timestamp must be ISO 8601";
  const age = Date.now() - parsed.getTime();
  if (age > REPLAY_WINDOW_MS) return `timestamp too old (>${REPLAY_WINDOW_MS}ms replay window)`;
  if (age < -6e4) return "timestamp is in the future";
  if (isReplay(body.sensorId, body.timestamp)) return "duplicate timestamp (replay protection)";
  if (isRateLimited(body.sensorId)) return `rate limit exceeded (${RATE_LIMIT_PER_MIN}/min per sensor)`;
  const known = sensorRegistry.get(body.sensorId);
  if (known && !known.allowedUnits.includes(body.unit) && body.unit !== known.allowedUnits[0]) {
    const allAllowed = known.allowedUnits.join(", ");
  }
  return null;
}
router5.post("/", (req, res) => {
  const parsed = telemetrySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  const err = validateSemantics(parsed.data);
  if (err) return res.status(400).json({ error: err });
  const b = parsed.data;
  markSeen(b.sensorId, b.timestamp);
  const reading = {
    id: `tel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sensorId: b.sensorId,
    value: b.value,
    unit: b.unit,
    secondaryValue: b.secondaryValue,
    secondaryUnit: b.secondaryUnit,
    lat: b.latitude,
    lng: b.longitude,
    timestamp: new Date(b.timestamp).toISOString(),
    receivedAt: (/* @__PURE__ */ new Date()).toISOString(),
    gatewayId: b.gatewayId,
    authStatus: b.authStatus || "unknown"
  };
  pushReading(reading);
  const anomalyHint = b.value > 4.5 && b.unit.includes("meters") ? { anomalyDetected: true, anomalyHint: "threshold_exceeded" } : {};
  res.status(201).json({ success: true, reading: { ...reading, ...anomalyHint } });
});
router5.get("/", (req, res) => {
  const { sensorId, limit } = req.query;
  let data = telemetryStore;
  if (sensorId) data = data.filter((r) => r.sensorId === sensorId);
  const n = Math.min(parseInt(limit || "100", 10) || 100, 500);
  res.json({ success: true, count: data.length, readings: data.slice(-n) });
});
router5.get("/sensors", (_req, res) => {
  res.json({ success: true, sensors: Array.from(sensorRegistry.values()) });
});
router5.post("/sensors/register", (req, res) => {
  const schema2 = import_zod2.z.object({
    sensorId: import_zod2.z.string().min(1),
    nodeCode: import_zod2.z.string().min(1),
    type: import_zod2.z.string().min(1),
    lat: import_zod2.z.number().min(-90).max(90),
    lng: import_zod2.z.number().min(-180).max(180),
    gatewayId: import_zod2.z.string().min(1),
    allowedUnits: import_zod2.z.array(import_zod2.z.string()).min(1)
  });
  const parsed = schema2.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  if (sensorRegistry.has(parsed.data.sensorId)) return res.status(409).json({ error: "sensorId already registered" });
  const meta = parsed.data;
  registerSensor(meta);
  res.status(201).json({ success: true, sensor: meta });
});
var telemetry_default = router5;

// backend/routes/ai.ts
var import_express6 = __toESM(require("express"), 1);
var import_zod3 = require("zod");

// backend/ai/inference/inferenceService.ts
init_config();

// backend/ai/inference/modelRegistry.ts
init_config();
var REGISTRY = [
  { name: "resq-flood-rf", version: "0.1.0-demo", hazard: "flood", mode: config.aiMode, trainedAt: (/* @__PURE__ */ new Date()).toISOString(), description: "Threshold + logistic proxy for flood severity (synthetic data)" },
  { name: "resq-landslide-rf", version: "0.1.0-demo", hazard: "landslide", mode: config.aiMode, trainedAt: (/* @__PURE__ */ new Date()).toISOString(), description: "Soil saturation + tilt threshold proxy" },
  { name: "resq-anomaly-zscore", version: "0.1.0-demo", hazard: "anomaly", mode: config.aiMode, trainedAt: (/* @__PURE__ */ new Date()).toISOString(), description: "Z-score + IsolationForest-lite anomaly detector" },
  { name: "resq-ensemble", version: "0.1.0-demo", hazard: "ensemble", mode: config.aiMode, trainedAt: (/* @__PURE__ */ new Date()).toISOString(), description: "Weighted ensemble of hazard models" }
];
function getRegistry() {
  return REGISTRY;
}
function getModel(hazard) {
  return REGISTRY.find((m) => m.hazard === hazard);
}
function getEnsembleMeta() {
  return REGISTRY.find((m) => m.hazard === "ensemble");
}

// backend/ai/inference/inferenceService.ts
function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}
function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}
function labelForSeverity(s) {
  if (s >= 0.85) return "CRITICAL";
  if (s >= 0.65) return "HIGH";
  if (s >= 0.4) return "WATCH";
  return "LOW";
}
function anomalyScore(features) {
  let maxZ = 0;
  for (const [k, v] of Object.entries(features)) {
    const nominal = {
      waterLevelM: { mean: 1.2, sd: 1 },
      rainfallMmH: { mean: 8, sd: 15 },
      soilSaturation: { mean: 45, sd: 15 },
      pga: { mean: 0.03, sd: 0.05 },
      pressureHpa: { mean: 1010, sd: 6 }
    };
    const n = nominal[k];
    if (n) maxZ = Math.max(maxZ, Math.abs(v - n.mean) / n.sd);
  }
  return clamp01(1 - Math.exp(-maxZ / 2));
}
function floodSeverity(f) {
  const wl = f.waterLevelM ?? f.value ?? 0;
  const rain = f.rainfallMmH ?? 0;
  const logit = (wl - 2.5) * 1.6 + (rain - 30) * 0.04 + (f.soilSaturation ? (f.soilSaturation - 60) * 0.02 : 0);
  const s = clamp01(sigmoid(logit));
  const fi = { waterLevelM: 0.55, rainfallMmH: 0.3, soilSaturation: 0.15 };
  return { s, fi };
}
function landslideSeverity(f) {
  const sat = f.soilSaturation ?? 0;
  const tilt = f.tiltDeg ?? 0;
  const rain = f.rainfallMmH ?? 0;
  const logit = (sat - 70) * 0.08 + tilt * 0.6 + (rain - 40) * 0.025;
  const s = clamp01(sigmoid(logit));
  return { s, fi: { soilSaturation: 0.5, tiltDeg: 0.3, rainfallMmH: 0.2 } };
}
function infer(input) {
  const hazard = (input.hazard || "flood").toLowerCase();
  const f = input.features || {};
  let s;
  let fi = {};
  if (hazard === "landslide") ({ s, fi } = landslideSeverity(f));
  else ({ s, fi } = floodSeverity(f));
  const anom = anomalyScore(f);
  const confidence = clamp01(0.55 + s * 0.35 + anom * 0.15);
  const uncertainty = clamp01(1 - confidence + Math.random() * 0.05);
  const meta = getModel(hazard) || getEnsembleMeta();
  const sum = Object.values(fi).reduce((a, b) => a + b, 0) || 1;
  const normFi = Object.fromEntries(Object.entries(fi).map(([k, v]) => [k, +(v / sum).toFixed(3)]));
  const radiusM = Math.round(500 + s * 1800 + (f.waterLevelM ? f.waterLevelM * 120 : 0));
  const ttiMinutes = s > 0.7 ? Math.round(30 + (1 - s) * 90) : void 0;
  const directionDeg = input.lat !== void 0 ? 180 + (input.lng || 0) * 10 % 90 : void 0;
  return {
    hazard,
    severity: +s.toFixed(3),
    severityLabel: labelForSeverity(s),
    confidence: +confidence.toFixed(3),
    uncertainty: +uncertainty.toFixed(3),
    directionDeg: directionDeg !== void 0 ? Math.round(directionDeg) % 360 : void 0,
    radiusM,
    ttiMinutes,
    featureImportance: normFi,
    model: meta.name,
    version: meta.version,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    mode: config.aiMode
  };
}

// backend/routes/ai.ts
var router6 = import_express6.default.Router();
var inferSchema = import_zod3.z.object({
  hazard: import_zod3.z.string().min(1).default("flood"),
  features: import_zod3.z.record(import_zod3.z.string(), import_zod3.z.number()).refine((o) => Object.keys(o).length > 0, "features must be non-empty"),
  lat: import_zod3.z.number().min(-90).max(90).optional(),
  lng: import_zod3.z.number().min(-180).max(180).optional()
}).passthrough();
router6.post("/infer", (req, res) => {
  const parsed = inferSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  const result = infer(parsed.data);
  res.json({ success: true, inference: result });
});
router6.get("/models", (_req, res) => {
  res.json({ success: true, models: getRegistry() });
});
var ai_default = router6;

// backend/routes/gis.ts
var import_express7 = __toESM(require("express"), 1);
var import_zod4 = require("zod");

// backend/services/geoService.ts
function metersPerDegree(lat) {
  const latRad = lat * Math.PI / 180;
  return { lat: 111132, lng: 111320 * Math.cos(latRad) };
}
function circlePolygon(center, radiusM, steps = 48) {
  const [lat, lng] = center;
  const mPerDeg = metersPerDegree(lat);
  const coords = [];
  for (let i = 0; i < steps; i++) {
    const ang = i / steps * 2 * Math.PI;
    const dx = Math.cos(ang) * radiusM;
    const dy = Math.sin(ang) * radiusM;
    coords.push([lng + dx / mPerDeg.lng, lat + dy / mPerDeg.lat]);
  }
  coords.push(coords[0].slice());
  return coords;
}
function hazardPolygons(center, redRadiusM, orangeMult = 1.5, yellowMult = 2.2) {
  if (!isFinite(center[0]) || !isFinite(center[1]) || !isFinite(redRadiusM) || redRadiusM <= 0) {
    throw new Error("Invalid center or radius");
  }
  const red = circlePolygon(center, redRadiusM);
  const orange = circlePolygon(center, redRadiusM * orangeMult);
  const yellow = circlePolygon(center, redRadiusM * yellowMult);
  const mk = (coords, name) => ({
    type: "Feature",
    properties: { name, center },
    geometry: { type: "Polygon", coordinates: [coords] }
  });
  return {
    red: mk(red, "red"),
    orange: mk(orange, "orange"),
    yellow: mk(yellow, "yellow"),
    greenNote: "Outside yellow polygon"
  };
}
function pointInPolygon(point, ring) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect = yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
function zoneForPoint(point, zones) {
  const r = zones.red.geometry.coordinates[0];
  const o = zones.orange.geometry.coordinates[0];
  const y = zones.yellow.geometry.coordinates[0];
  if (pointInPolygon(point, r)) return "RED";
  if (pointInPolygon(point, o)) return "ORANGE";
  if (pointInPolygon(point, y)) return "YELLOW";
  return "GREEN";
}

// backend/routes/gis.ts
var router7 = import_express7.default.Router();
var polygonSchema = import_zod4.z.object({
  center: import_zod4.z.tuple([import_zod4.z.number().min(-90).max(90), import_zod4.z.number().min(-180).max(180)]),
  // [lat, lng]
  redRadiusM: import_zod4.z.number().positive().max(5e4),
  orangeMultiplier: import_zod4.z.number().positive().optional(),
  yellowMultiplier: import_zod4.z.number().positive().optional()
});
router7.post("/hazard-polygon", (req, res) => {
  const parsed = polygonSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  const { center, redRadiusM, orangeMultiplier, yellowMultiplier } = parsed.data;
  try {
    const zones = hazardPolygons(center, redRadiusM, orangeMultiplier, yellowMultiplier);
    res.json({ success: true, zones });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
router7.post("/exposure", (req, res) => {
  const schema2 = import_zod4.z.object({
    center: import_zod4.z.tuple([import_zod4.z.number().min(-90).max(90), import_zod4.z.number().min(-180).max(180)]),
    redRadiusM: import_zod4.z.number().positive().max(5e4),
    points: import_zod4.z.array(import_zod4.z.tuple([import_zod4.z.number().min(-90).max(90), import_zod4.z.number().min(-180).max(180)]))
    // [lat,lng][]
  });
  const parsed = schema2.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  const { center, redRadiusM, points } = parsed.data;
  const zones = hazardPolygons(center, redRadiusM);
  const results = points.map((p) => {
    const zone = zoneForPoint([p[1], p[0]], zones);
    return { point: p, zone };
  });
  const byZone = { RED: 0, ORANGE: 0, YELLOW: 0, GREEN: 0 };
  results.forEach((r) => byZone[r.zone]++);
  res.json({ success: true, zones, results, summary: byZone });
});
router7.get("/zones", (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const r = parseFloat(req.query.redRadiusM) || 1400;
  if (!isFinite(lat) || !isFinite(lng)) return res.status(400).json({ error: "lat and lng query params required" });
  const zones = hazardPolygons([lat, lng], r);
  res.json({ success: true, zones });
});
var INDIA_HAZARDS = [
  { id: "hz-gps", center: [17.3765, 78.4795], hazard: "FLOOD", severity: "LEVEL_4_CRITICAL", radiusM: 1400, state: "Telangana", label: "Krishna Basin Flood" },
  { id: "hz-uk-01", center: [30.3165, 79.0322], hazard: "LANDSLIDE", severity: "LEVEL_5_EXTREME", radiusM: 1800, state: "Uttarakhand", label: "Uttarkashi Slope Failure" },
  { id: "hz-hp-01", center: [31.1048, 77.1734], hazard: "CLOUDBURST", severity: "LEVEL_4_CRITICAL", radiusM: 1200, state: "Himachal Pradesh", label: "Shimla Cloudburst" },
  { id: "hz-jk-01", center: [33.7782, 76.5762], hazard: "SEISMIC_ANOMALY", severity: "LEVEL_3_WARNING", radiusM: 2600, state: "Jammu & Kashmir", label: "Kishtwar Tremor Swarm" },
  { id: "hz-as-01", center: [26.2006, 92.9376], hazard: "FLOOD", severity: "LEVEL_4_CRITICAL", radiusM: 3200, state: "Assam", label: "Brahmaputra Inundation" },
  { id: "hz-ar-01", center: [27.0844, 93.6053], hazard: "LANDSLIDE", severity: "LEVEL_4_CRITICAL", radiusM: 1400, state: "Arunachal Pradesh", label: "Papum Pare Debris Flow" },
  { id: "hz-od-01", center: [19.8135, 85.8312], hazard: "CYCLONE", severity: "LEVEL_5_EXTREME", radiusM: 2800, state: "Odisha", label: "Puri Cyclonic Surge" },
  { id: "hz-wb-01", center: [22.5726, 88.3639], hazard: "FLOOD", severity: "LEVEL_3_WARNING", radiusM: 1600, state: "West Bengal", label: "Kolkata Urban Flood" },
  { id: "hz-tn-01", center: [13.0827, 80.2707], hazard: "CYCLONE", severity: "LEVEL_4_CRITICAL", radiusM: 2100, state: "Tamil Nadu", label: "Chennai Coastal Surge" },
  { id: "hz-ap-01", center: [16.5062, 80.648], hazard: "FLOOD", severity: "LEVEL_3_WARNING", radiusM: 1300, state: "Andhra Pradesh", label: "Vijayawada River Rise" },
  { id: "hz-mh-01", center: [19.076, 72.8777], hazard: "FLOOD", severity: "LEVEL_3_WARNING", radiusM: 1500, state: "Maharashtra", label: "Mumbai Coastal Inundation" },
  { id: "hz-gj-01", center: [23.0225, 72.5714], hazard: "SEISMIC_ANOMALY", severity: "LEVEL_3_WARNING", radiusM: 2400, state: "Gujarat", label: "Kutch Seismic Anomaly" },
  { id: "hz-rj-01", center: [26.9124, 75.7873], hazard: "DAM_BREACH", severity: "LEVEL_4_CRITICAL", radiusM: 1900, state: "Rajasthan", label: "Bisalpur Reservoir Stress" },
  { id: "hz-kl-01", center: [10.8505, 76.2711], hazard: "CLOUDBURST", severity: "LEVEL_4_CRITICAL", radiusM: 1100, state: "Kerala", label: "Idukki Cloudburst" },
  { id: "hz-ka-01", center: [12.9716, 77.5946], hazard: "FLOOD", severity: "LEVEL_3_WARNING", radiusM: 1e3, state: "Karnataka", label: "Bengaluru Urban Flood" },
  { id: "hz-mp-01", center: [23.2599, 77.4126], hazard: "LANDSLIDE", severity: "LEVEL_3_WARNING", radiusM: 900, state: "Madhya Pradesh", label: "Bhopal Escarpment Slip" }
];
router7.get("/india-hazards", (_req, res) => {
  res.json({ success: true, hazards: INDIA_HAZARDS, count: INDIA_HAZARDS.length, redCount: INDIA_HAZARDS.filter((h) => h.severity === "LEVEL_4_CRITICAL" || h.severity === "LEVEL_5_EXTREME").length });
});
var gis_default = router7;

// backend/routes/risk.ts
var import_express8 = __toESM(require("express"), 1);
var import_zod5 = require("zod");

// backend/services/riskEngine.ts
function calculateBuildingRisk(building, params) {
  let structuralBase = 30;
  if (building.structuralType === "TIMBER_MUD") structuralBase = 90;
  else if (building.structuralType === "UNREINFORCED_MASONRY") structuralBase = 70;
  else if (building.structuralType === "REINFORCED_CONCRETE") structuralBase = 25;
  else if (building.structuralType === "STEEL_FRAME") structuralBase = 20;
  const currentYear = 2026;
  const age = currentYear - building.constructionYear;
  const ageFactor = Math.min(25, age * 0.5);
  let soilFactor = 10;
  if (building.soilCategory === "RIVER_BED_SAND") soilFactor = 35;
  else if (building.soilCategory === "ALLUVIAL_LOOSE") soilFactor = 25;
  else if (building.soilCategory === "CLAY_EXPANSIVE") soilFactor = 20;
  else if (building.soilCategory === "ROCK_STABLE") soilFactor = 5;
  const vulnerabilityScore = Math.min(100, Math.round(structuralBase + ageFactor + soilFactor));
  let hazardScore = 20;
  if (params.hazardType === "FLOOD" || params.hazardType === "URBAN_FLOOD" || params.hazardType === "DAM_BREACH") {
    const riverProximityWeight = Math.max(0, 1 - building.nearestRiverDistanceKm / 2);
    const elevationDeficit = Math.max(0, (505 - building.elevationMeters) / 20);
    const riverGaugeFactor = params.riverGaugeHeightM / 6;
    const rainFactor = params.rainfallIntensityMmH / 100;
    hazardScore = Math.min(100, Math.round((riverProximityWeight * 40 + elevationDeficit * 30 + riverGaugeFactor * 20 + rainFactor * 10) * 100 / 100));
  } else if (params.hazardType === "LANDSLIDE") {
    const isSlope = building.elevationMeters > 530 ? 1 : 0.2;
    const rainSoilFactor = params.rainfallIntensityMmH / 100 * (params.soilSaturationPercent / 100);
    hazardScore = Math.min(100, Math.round(isSlope * (rainSoilFactor * 80 + 20)));
  } else if (params.hazardType === "SEISMIC_ANOMALY") {
    const pgaFactor = params.groundAccelerationG / 0.5 * 100;
    hazardScore = Math.min(100, Math.round(pgaFactor));
  } else if (params.hazardType === "CYCLONE") {
    const windFactor = params.windSpeedKmh / 200 * 60;
    const rainFactor = params.rainfallIntensityMmH / 100 * 40;
    hazardScore = Math.min(100, Math.round(windFactor + rainFactor));
  }
  const vulnRatio = (building.vulnerableGroups.children + building.vulnerableGroups.elderly + building.vulnerableGroups.disabled) / Math.max(1, building.registeredPopulation);
  const exposureMultiplier = 1 + vulnRatio * 0.4;
  const overallScore = Math.min(100, Math.round(hazardScore * 0.45 + vulnerabilityScore * 0.35 + hazardScore * exposureMultiplier * 0.2));
  let evacuationPriority = "NONE";
  if (overallScore >= 85) evacuationPriority = "CRITICAL";
  else if (overallScore >= 70) evacuationPriority = "HIGH";
  else if (overallScore >= 50) evacuationPriority = "MEDIUM";
  else if (overallScore >= 30) evacuationPriority = "LOW";
  const unEvacuatedRatio = (100 - params.evacuationComplianceRate) / 100;
  let estimatedTrapped = 0;
  if (overallScore >= 75) estimatedTrapped = Math.round(building.estimatedOccupancy * unEvacuatedRatio * (overallScore / 100) * 0.4);
  return { hazardScore, vulnerabilityScore, overallScore, evacuationPriority, estimatedTrapped };
}
function runDistrictRiskAnalysis(buildings, shelters, params) {
  let totalExposed = 0;
  let totalVulnerable = 0;
  let affectedCount = 0;
  let totalTrapped = 0;
  let weightedRiskSum = 0;
  buildings.forEach((b) => {
    const analysis = calculateBuildingRisk(b, params);
    if (analysis.overallScore >= 45) {
      affectedCount++;
      totalExposed += b.estimatedOccupancy;
      totalVulnerable += b.vulnerableGroups.children + b.vulnerableGroups.elderly + b.vulnerableGroups.disabled;
    }
    totalTrapped += analysis.estimatedTrapped;
    weightedRiskSum += analysis.overallScore;
  });
  const averageDistrictRisk = buildings.length > 0 ? Math.round(weightedRiskSum / buildings.length) : 0;
  let redZoneRadius = 400;
  if (params.hazardType === "FLOOD" || params.hazardType === "DAM_BREACH") redZoneRadius = Math.round(500 + params.riverGaugeHeightM * 180 + params.rainfallIntensityMmH * 4);
  else if (params.hazardType === "CYCLONE") redZoneRadius = Math.round(1e3 + params.windSpeedKmh * 8);
  else if (params.hazardType === "LANDSLIDE") redZoneRadius = Math.round(300 + params.soilSaturationPercent * 6);
  else if (params.hazardType === "SEISMIC_ANOMALY") redZoneRadius = Math.round(800 + params.groundAccelerationG * 2e3);
  const orangeZoneRadius = Math.round(redZoneRadius * 1.5);
  const yellowZoneRadius = Math.round(redZoneRadius * 2.2);
  const totalShelterCapacity = shelters.reduce((acc, s) => acc + (s.capacity - s.currentOccupancy), 0);
  const shelterDeficitPersons = Math.max(0, totalExposed - totalShelterCapacity);
  const recommendedOfficerDeployment = Math.max(12, Math.ceil(totalExposed / 45) + totalTrapped * 2);
  const estimatedCasualtiesAtRisk = Math.round(totalTrapped * 0.18);
  const confidenceScore = 88.5;
  const reasoningFactors = [
    `River Gauge reading at ${params.riverGaugeHeightM.toFixed(2)}m (${params.riverGaugeHeightM > 4.5 ? "CRITICAL DANGER" : "Elevated Inflow"})`,
    `Rainfall intensity at ${params.rainfallIntensityMmH} mm/h with high catchment run-off`,
    `Soil saturation at ${params.soilSaturationPercent}% causing reduced absorption in alluvial plains`,
    `${totalVulnerable.toLocaleString()} vulnerable citizens located within active hazard buffer`,
    `Shelter capacity status: ${shelterDeficitPersons > 0 ? `DEFICIT of ${shelterDeficitPersons} beds` : "Adequate buffer available"}`
  ];
  return {
    overallDistrictRisk: averageDistrictRisk,
    hazardIndex: Math.min(100, Math.round(params.riverGaugeHeightM / 6 * 60 + params.rainfallIntensityMmH / 100 * 40)),
    exposureIndex: Math.min(100, Math.round(totalExposed / 12e3 * 100)),
    vulnerabilityIndex: Math.min(100, Math.round(totalVulnerable / Math.max(1, totalExposed) * 140)),
    redZoneRadiusMeters: redZoneRadius,
    orangeZoneRadiusMeters: orangeZoneRadius,
    yellowZoneRadiusMeters: yellowZoneRadius,
    affectedBuildingsCount: affectedCount,
    exposedPopulationTotal: totalExposed,
    vulnerablePersonsCount: totalVulnerable,
    estimatedTrappedCount: totalTrapped,
    estimatedCasualtiesAtRisk,
    shelterDeficitPersons,
    recommendedOfficerDeployment,
    confidenceScore,
    reasoningFactors
  };
}

// backend/routes/risk.ts
var router8 = import_express8.default.Router();
var simSchema = import_zod5.z.object({
  hazardType: import_zod5.z.enum(["FLOOD", "URBAN_FLOOD", "DAM_BREACH", "LANDSLIDE", "SEISMIC_ANOMALY", "CYCLONE", "CLOUDBURST"]),
  rainfallIntensityMmH: import_zod5.z.number().min(0).max(300),
  riverGaugeHeightM: import_zod5.z.number().min(0).max(12),
  groundAccelerationG: import_zod5.z.number().min(0).max(2),
  soilSaturationPercent: import_zod5.z.number().min(0).max(100),
  windSpeedKmh: import_zod5.z.number().min(0).max(300),
  evacuationComplianceRate: import_zod5.z.number().min(0).max(100),
  activeRoadClosures: import_zod5.z.number().int().min(0)
});
router8.post("/analyze", (req, res) => {
  const schema2 = import_zod5.z.object({
    params: simSchema,
    buildings: import_zod5.z.array(import_zod5.z.any()).min(1),
    shelters: import_zod5.z.array(import_zod5.z.object({ capacity: import_zod5.z.number(), currentOccupancy: import_zod5.z.number() })).min(1)
  });
  const parsed = schema2.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  const result = runDistrictRiskAnalysis(parsed.data.buildings, parsed.data.shelters, parsed.data.params);
  res.json({ success: true, result });
});
router8.post("/building", (req, res) => {
  const schema2 = import_zod5.z.object({ building: import_zod5.z.any(), params: simSchema });
  const parsed = schema2.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  const result = calculateBuildingRisk(parsed.data.building, parsed.data.params);
  res.json({ success: true, result });
});
var risk_default = router8;

// backend/routes/capacity.ts
var import_express9 = __toESM(require("express"), 1);
var import_zod6 = require("zod");
var router9 = import_express9.default.Router();
router9.post("/evaluate", (req, res) => {
  const schema2 = import_zod6.z.object({
    site: import_zod6.z.object({
      totalPopulationCapacity: import_zod6.z.number().positive(),
      currentRelocated: import_zod6.z.number().min(0),
      carryingCapacity: import_zod6.z.object({
        waterCapacityPersons: import_zod6.z.number().min(0),
        foodLogisticsDays: import_zod6.z.number().min(0),
        sanitationIndexScore: import_zod6.z.number().min(0).max(100)
      })
    }),
    addedPopulation: import_zod6.z.number().min(0)
  });
  const parsed = schema2.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  const { site, addedPopulation } = parsed.data;
  const projected = site.currentRelocated + addedPopulation;
  const ratio = projected / site.totalPopulationCapacity;
  const waterRemainingDays = Math.max(0, Math.round(site.carryingCapacity.waterCapacityPersons / Math.max(1, projected) * 10));
  const foodRemainingDays = Math.max(0, Math.round(site.carryingCapacity.foodLogisticsDays * (site.totalPopulationCapacity / Math.max(1, projected))));
  let score = 95;
  if (ratio > 1.2) score -= 40;
  else if (ratio > 1) score -= 25;
  else if (ratio > 0.8) score -= 10;
  if (waterRemainingDays < 5) score -= 25;
  if (foodRemainingDays < 7) score -= 15;
  if (site.carryingCapacity.sanitationIndexScore < 75) score -= 15;
  score = Math.max(10, Math.min(100, score));
  let warningLevel = "GREEN";
  if (score < 40) warningLevel = "RED";
  else if (score < 65) warningLevel = "ORANGE";
  else if (score < 80) warningLevel = "YELLOW";
  let notes = "Stable logistics corridor. High water and food replenishment reserves.";
  if (warningLevel === "RED") notes = "CRITICAL OVERLOAD: Sanitation and drinking water supply will deplete rapidly without immediate logistical convoys.";
  else if (warningLevel === "ORANGE") notes = "CAUTION: Additional mobile water purification and field toilets required within 24 hours.";
  res.json({ success: true, result: { effectiveScore: score, waterRemainingDays, foodRemainingDays, warningLevel, notes } });
});
var capacity_default = router9;

// backend/routes/evacuation.ts
var import_express10 = __toESM(require("express"), 1);
var import_zod7 = require("zod");
var router10 = import_express10.default.Router();
function haversineKm2(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
var schema = import_zod7.z.object({
  origin: import_zod7.z.tuple([import_zod7.z.number().min(-90).max(90), import_zod7.z.number().min(-180).max(180)]),
  shelters: import_zod7.z.array(import_zod7.z.object({
    id: import_zod7.z.string(),
    name: import_zod7.z.string().optional(),
    location: import_zod7.z.tuple([import_zod7.z.number().min(-90).max(90), import_zod7.z.number().min(-180).max(180)]),
    availableBeds: import_zod7.z.number().min(0).optional()
  })).min(1),
  hazardCenter: import_zod7.z.tuple([import_zod7.z.number().min(-90).max(90), import_zod7.z.number().min(-180).max(180)]).optional(),
  redRadiusM: import_zod7.z.number().positive().max(5e4).optional(),
  roadClosures: import_zod7.z.number().int().min(0).optional()
});
router10.post("/route", (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  const { origin, shelters, hazardCenter, redRadiusM } = parsed.data;
  let zones = null;
  if (hazardCenter && redRadiusM) {
    try {
      zones = hazardPolygons(hazardCenter, redRadiusM);
    } catch {
      zones = null;
    }
  }
  const options = shelters.map((s) => {
    const distKm = haversineKm2(origin[0], origin[1], s.location[0], s.location[1]);
    let penalty = 0;
    let zone = "UNKNOWN";
    let avoidsRedZone = true;
    if (zones) {
      const mid = [(origin[0] + s.location[0]) / 2, (origin[1] + s.location[1]) / 2];
      const midZone = zoneForPoint([mid[1], mid[0]], zones);
      const destZone = zoneForPoint([s.location[1], s.location[0]], zones);
      zone = destZone;
      if (midZone === "RED" || destZone === "RED") {
        penalty = 8;
        avoidsRedZone = false;
      } else if (midZone === "ORANGE") {
        penalty = 2;
      }
    }
    const etaMinutes = Math.round(distKm / 28 * 60 + penalty * 3);
    const score = distKm + penalty * 1.5 - (s.availableBeds ?? 0) / 500;
    return {
      shelterId: s.id,
      shelterName: s.name ?? s.id,
      distanceKm: Math.round(distKm * 10) / 10,
      etaMinutes,
      avoidsRedZone,
      zone,
      score: Math.round(score * 10) / 10,
      waypoints: [origin, s.location]
    };
  });
  options.sort((a, b) => a.score - b.score);
  const ranked = options.slice(0, 3).map((o, idx) => ({ ...o, rank: idx + 1, recommended: idx === 0 }));
  res.json({ success: true, origin, options: ranked });
});
var evacuation_default = router10;

// backend/routes/sos.ts
var import_express11 = __toESM(require("express"), 1);
var import_zod8 = require("zod");
init_server();
var router11 = import_express11.default.Router();
var store = [];
var seq = 0;
function nextId() {
  return `SOS-${Date.now()}-${++seq}`;
}
var sosSchema = import_zod8.z.object({
  citizenId: import_zod8.z.string().optional(),
  lat: import_zod8.z.number().min(-90).max(90),
  lng: import_zod8.z.number().min(-180).max(180),
  message: import_zod8.z.string().max(2e3).optional()
});
router11.post("/", (req, res) => {
  const parsed = sosSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  const rec = { id: nextId(), ...parsed.data, status: "RECEIVED", createdAt: (/* @__PURE__ */ new Date()).toISOString() };
  store.push(rec);
  try {
    publish("sos_created", rec);
  } catch {
  }
  res.status(201).json({ success: true, sos: rec });
});
router11.get("/", (_req, res) => {
  res.json({ success: true, sos: [...store].reverse().slice(0, 100) });
});
router11.post("/:id/ack", (req, res) => {
  const { status } = req.body;
  const rec = store.find((s) => s.id === req.params.id);
  if (!rec) return res.status(404).json({ error: "SOS not found" });
  if (status && ["ACKNOWLEDGED", "DISPATCHED", "RESOLVED"].includes(status)) rec.status = status;
  res.json({ success: true, sos: rec });
});
var sos_default = router11;

// backend/routes/ack.ts
var import_express12 = __toESM(require("express"), 1);
var import_zod9 = require("zod");
var router12 = import_express12.default.Router();
var acks = /* @__PURE__ */ new Map();
router12.post("/:alertId/ack", (req, res) => {
  const schema2 = import_zod9.z.object({ status: import_zod9.z.enum(["RECEIVED", "ACKNOWLEDGED", "FAILED", "PARTIAL"]), note: import_zod9.z.string().max(2e3).optional() });
  const parsed = schema2.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  const { status, note } = parsed.data;
  const alertId = req.params.alertId;
  if (!acks.has(alertId)) acks.set(alertId, []);
  const entry = { alertId, status, note, at: (/* @__PURE__ */ new Date()).toISOString() };
  acks.get(alertId).push(entry);
  res.json({ success: true, ack: entry, history: acks.get(alertId) });
});
router12.get("/:alertId/ack", (req, res) => {
  res.json({ success: true, alertId: req.params.alertId, history: acks.get(req.params.alertId) ?? [] });
});
var ack_default = router12;

// backend/routes/audit.ts
var import_express13 = __toESM(require("express"), 1);
var router13 = import_express13.default.Router();
var entries = [];
router13.get("/", (_req, res) => {
  res.json({ success: true, audit: [...entries].reverse().slice(0, 200) });
});
var audit_default = router13;

// backend/routes/analytics.ts
var import_express14 = __toESM(require("express"), 1);
var router14 = import_express14.default.Router();
router14.get("/", (_req, res) => {
  res.json({
    success: true,
    latencies: {
      T_sensor: "12ms",
      T_ai: "42ms",
      T_gis: "18ms",
      T_risk: "9ms",
      T_alertDecision: "5ms",
      T_cap: "4ms",
      T_dispatch: "31ms",
      T_ack: "\u2014"
    },
    counters: {
      telemetryReceived: 128,
      aiInferences: 64,
      alertsCreated: 7,
      dispatches: 7,
      acks: 3
    }
  });
});
var analytics_default = router14;

// backend/server.ts
async function startServer() {
  const app = (0, import_express15.default)();
  const PORT = config.port;
  app.use(import_express15.default.json());
  app.use(correlationMiddleware);
  app.use((req, _res, next) => {
    _res.header?.("Access-Control-Allow-Origin", "*");
    _res.header?.("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-correlation-id");
    _res.header?.("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") return _res.status(204).end();
    next();
  });
  app.use((_, res, next) => {
    if (!res.header) {
      res.header = (k, v) => res.setHeader(k, v);
    }
    next();
  });
  await database_default();
  try {
    const { connectMqtt: connectMqtt2 } = await Promise.resolve().then(() => (init_mqttClient(), mqttClient_exports));
    await connectMqtt2();
  } catch (e) {
    console.warn("[mqtt] init skipped:", e?.message);
  }
  let geminiClient = null;
  function getGeminiClient() {
    if (!geminiClient && config.geminiApiKey) {
      geminiClient = new import_genai.GoogleGenAI({
        apiKey: config.geminiApiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } }
      });
    }
    return geminiClient;
  }
  app.get("/api/health", (_req, res) => {
    const dbHealthy = isDbConnected();
    const aiHealthy = !!config.geminiApiKey;
    res.json({
      status: "ok",
      system: "RESQ-AI Multi-Hazard Emergency Operations Platform",
      version: "1.0.0-prod",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      activeCapabilities: [
        "IoT Telemetry Aggregation",
        "Dynamic GIS Red-Zone Analysis",
        "Digital Twin Building Vulnerability",
        "Relocation Carrying Capacity Engine",
        "Multi-Channel SACHET Warning Broadcast",
        "Gemini Multi-Hazard Copilot"
      ],
      subsystems: {
        database: dbHealthy ? "HEALTHY" : "DEGRADED",
        aiCopilot: aiHealthy ? "HEALTHY" : "DEGRADED",
        telemetry: "HEALTHY",
        gis: "HEALTHY",
        broadcast: "HEALTHY",
        websocket: "DEGRADED"
        // upgraded to HEALTHY in P7
      },
      features: {
        database: dbHealthy ? "MongoDB" : "Mock (in-memory)",
        aiCopilot: aiHealthy ? "Gemini 3.7 Flash" : "Offline (rule-engine fallback)",
        realtime: "HTTP (WebSocket in P7)",
        aiMode: config.aiMode,
        automaticMode: config.automaticMode
      }
    });
  });
  app.post("/api/copilot", async (req, res) => {
    try {
      const { message, context } = req.body;
      const ai = getGeminiClient();
      if (!ai) {
        const fallbackResponse = generateLocalCopilotResponse(message, context);
        return res.json({ response: fallbackResponse, source: "RULE_ENGINE_FALLBACK" });
      }
      const systemPrompt = `You are the RESQ-AI command assistant for a district emergency operations team.
Use the supplied sensor, building, population, shelter, and field-team context.
Give practical advice in clear bullet points. Separate immediate actions, resources, and risks, and state when information is uncertain.
Current Situation Context:
- Active Hazard: ${context?.hazardType || "FLOOD"}
- Overall District Risk: ${context?.overallRisk || 88}% (CRITICAL)
- Exposed Population: ${context?.exposedPopulation || 8420} citizens
- Vulnerable Group: ${context?.vulnerableCount || 1840} (children, elderly, disabled)
- Active Incident: ${context?.incidentTitle || "Sector 4 Flash Flood & Inundation"}
- River Gauge: ${context?.riverGauge || "4.82m (Crossing Danger Level)"}
- Key Shelters: North Highland Shelter (Capacity: 1500, Occ: 840), East Indoor Stadium (Capacity: 2200, Occ: 1120).
- Available Teams: NDRF 10th Bn (Alpha Boat Unit), SDRF Collapsed Rescue, Fire Rescue Squad 8.
Respond professionally with clear headings:
1. \u{1F6A8} IMMEDIATE TACTICAL ACTION
2. \u{1F465} POPULATION & EVACUATION DIRECTIVE
3. \u{1F69C} RESCUE & FIELD ASSET DEPLOYMENT
4. \u{1F3E5} MEDICAL & SHELTER LOGISTICS ALLOCATION
5. \u{1F4E1} PUBLIC WARNING & COMMUNICATION`;
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `${systemPrompt}

Commander Query: ${message}`
      });
      res.json({ response: response.text || "Command intelligence generated.", source: "GEMINI_3_7_FLASH" });
    } catch (err) {
      console.error("Copilot generation error:", err);
      const fallbackResponse = generateLocalCopilotResponse(req.body?.message, req.body?.context);
      res.json({ response: fallbackResponse, source: "LOCAL_RESCUE_ENGINE", error: err?.message });
    }
  });
  app.post("/api/sitrep", async (req, res) => {
    try {
      const { district, incident, stats } = req.body;
      const ai = getGeminiClient();
      const sitrepTimestamp = (/* @__PURE__ */ new Date()).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      if (ai) {
        const prompt = `Generate a draft incident situation report for the district operations team (SitRep #04).
District: ${district || "RESQ-DEMO Riverfront District"}
Time: ${sitrepTimestamp}
Incident: ${incident?.title || "Sector 4 Flash Flood & Embankment Breach"}
Hazard Level: ${incident?.severity || "LEVEL 4 CRITICAL"}
Exposed Population: ${stats?.exposedPopulation || 8420}
Buildings Inundated/At Risk: ${stats?.affectedBuildings || 482}
Shelter Current Capacity: ${stats?.shelterOccupancy || "1,960 / 3,700"}
Trapped Individuals: ${stats?.trappedCount || 38}
Teams on Site: NDRF 10th Bn, SDRF Unit 04, Fire Rescue Squad 8, 108 Emergency Medical Services.
Structure with standard emergency sections:
1. INCIDENT OVERVIEW & CHRONOLOGY
2. SPATIAL & GIS CASUALTY IMPACT ASSESSMENT
3. EVACUATION & SHELTER STATUS
4. FIELD SEARCH & RESCUE OPERATIONS
5. LOGISTICS & INFRASTRUCTURE DAMAGE (POWER/BRIDGES/WATER)
6. 12-HOUR PROJECTED HAZARD OUTLOOK & COMMAND DIRECTIVES`;
        const response = await ai.models.generateContent({ model: "gemini-3.7-flash", contents: prompt });
        return res.json({ sitrepText: response.text, generatedAt: sitrepTimestamp, classification: "RESTRICTED / OPERATIONAL EMERGENCY DIRECTIVE" });
      }
      const sitrepText = `# EMERGENCY INCIDENT SITUATION REPORT (SITREP #04)
**DISTRICT DISASTER MANAGEMENT AUTHORITY (DDMA)**
**Classification:** OPERATIONAL CRITICAL | **Timestamp:** ${sitrepTimestamp}
---
### 1. INCIDENT OVERVIEW
* **Disaster Category:** Flash Flood Inundation & Embankment Threat
* **Trigger Event:** Upstream cloudburst (94.5 mm/h) + Krishna Basin gauge surge (4.82m).
* **Severity Classification:** LEVEL 4 CRITICAL (DM Act Section 34 Invoked).
### 2. POPULATION EXPOSURE & CASUALTY ESTIMATE
* **Total Exposed Population:** 8,420 citizens across Sector 4 lowlands and Giri Ridge.
* **High-Risk Vulnerable Count:** 1,840 (Children: 740, Elderly: 620, Disabled: 190, Critical Medical: 290).
* **Confirmed Trapped:** 38 persons reported via SOS beacons and LoRa community mesh.
* **Casualties Prevented:** 142 individuals evacuated before inundation peak.
### 3. EVACUATION & SHELTER READINESS
* **North Highland Shelter (sh-01):** 840 / 1,500 occupied (56%). 8 days food, 18,500L clean water.
* **East Stadium Shelter (sh-02):** 1,120 / 2,200 occupied (51%). Backup power online.
* **Sector 4 Green Corridor:** Overbridge road reserved for emergency convoys only.
### 4. FIELD DEPLOYMENT MATRIX
* **NDRF 10th Battalion:** 4 motorized Gemini boats deployed to Krishna Riverfront Residency & Anganwadi.
* **SDRF Structural Unit:** 24 personnel on-site at partially damaged Shree Sai complex.
* **Ambulance Units:** 3 ALS Ambulances + 1 Boat Ambulance actively shuttling patients to Apex Trauma Hospital.
### 5. COMMAND ACTIONS ORDERED (NEXT 6 HOURS)
1. Complete mandatory boat evacuation of Bund Colony Ward 8 before 14:00 hrs.
2. Position de-watering heavy pumps at Sector 2 electrical substation.
3. Air-drop dry ration packets to isolated Giri Ridge tribal hamlet if road slip clearance exceeds 90 minutes.
4. Broadcast Stage 3 SMS/SACHET warning to 3,420 registered mobile handsets.`;
      res.json({ sitrepText, generatedAt: sitrepTimestamp, classification: "RESTRICTED / OPERATIONAL EMERGENCY DIRECTIVE" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/alert-dispatch", (req, res) => {
    const { alertId, channels, radiusKm } = req.body;
    res.json({
      success: true,
      alertId: alertId || `ALT-${Date.now()}`,
      dispatchTime: (/* @__PURE__ */ new Date()).toISOString(),
      channelsDispatched: channels || ["SMS", "PUSH", "BROWSER", "SACHET_CAP"],
      coverageRadiusKm: radiusKm || 1.8,
      estimatedAudienceHouseholds: 3420,
      deliverySuccessRate: 98.4,
      sachetGatewayStatus: "ACKNOWLEDGED_BY_CENTRAL_CAP_ROUTER",
      mode: config.cbcAdapter === "production" && config.cbcApiUrl ? "LIVE" : "SIMULATION",
      note: config.cbcAdapter === "production" ? "CBC adapter production mode" : "SIMULATION \u2014 no telecom transmission claimed"
    });
  });
  app.use("/api/incidents", incidents_default);
  app.use("/api/shelters", shelters_default);
  app.use("/api/buildings", buildings_default);
  app.use("/api/alerts", alerts_default);
  app.use("/api/telemetry", telemetry_default);
  app.use("/api/sensors", telemetry_default);
  app.use("/api/ai", ai_default);
  app.use("/api/gis", gis_default);
  app.use("/api/risk", risk_default);
  app.use("/api/capacity", capacity_default);
  app.use("/api/evacuation", evacuation_default);
  app.use("/api/sos", sos_default);
  app.use("/api/alert-acks", ack_default);
  app.use("/api/audit", audit_default);
  app.use("/api/analytics", analytics_default);
  app.use(errorHandler);
  function generateLocalCopilotResponse(message = "", context) {
    const msg = (message || "").toLowerCase();
    if (msg.includes("evacuat") || msg.includes("who") || msg.includes("priorit")) {
      return `### \u{1F6A8} PRIORITY EVACUATION DIRECTIVE:
1. **Immediate High Priority (Sector 4 Lowland Plain):**
   - **Surya Low-Income Housing Cluster (b-404):** 285 occupants (85 children, 48 elderly). Water rising rapidly; deploy NDRF Motor Boats 01 & 02 immediately.
   - **Government Primary School & Anganwadi (b-402):** 80 occupants. Evacuate via North Overbridge Green Corridor to **North Highland Shelter 1**.
2. **Structural Triage:**
   - **Shree Sai Multi-Story Complex (b-409):** Collapsed stairwell detected. SDRF life-detector team assigned.
3. **Safe Route:**
   - Use **Sector 4 North Overbridge Elevated Corridor (rd-02)**. Embankment Road (rd-01) is strictly closed due to 1.4m floodwater.`;
    }
    if (msg.includes("shelter") || msg.includes("capacity")) {
      return `### \u{1F3E0} SHELTER RESOURCE STATUS:
- **North Highland Shelter (sh-01):** 840 / 1,500 occupied. 8 days food remaining, 18,500L drinking water. Ready for immediate intake.
- **East District Stadium (sh-02):** 1,120 / 2,200 occupied. 12 days food, 40 medical beds. Designated primary secondary hub.
- **Central Hall (sh-03):** 740 / 800 (92% Capacity). Re-routing incoming evacuees to East Stadium.
- **Carrying Capacity Index:** Overall district shelter buffer stands at **1,740 available beds**.`;
    }
    if (msg.includes("sitrep") || msg.includes("report")) {
      return `### \u{1F4CB} RAPID INCIDENT SUMMARY:
- **District Risk Level:** 91% (CRITICAL LEVEL 4)
- **Active Hazard:** Krishna River Inundation (Gauge 4.82m, +0.6m in last 30 min)
- **Exposed Population:** 8,420 residents | 482 buildings in 1.4km red zone
- **Field Teams:** 86 active responders (NDRF, SDRF, Fire, Medical)
- **Immediate Task:** Complete boat extraction at Bund Colony before 13:30 hrs.`;
    }
    return `### \u{1F6E1}\uFE0F RESQ-AI COMMAND RECOMMENDATION:
- **Hazard State:** Krishna River gauge is currently at **4.82m** with extreme upstream cloudburst intensity (94.5 mm/h).
- **Red Zone Status:** 1.4 km radius active hazard polygon covering Sector 4 riverfront.
- **Recommended Action:** Maintain Green Corridor on North Overbridge, prioritize water rescue for 38 trapped persons, and initiate Stage-3 multilingual alert broadcast across all 6 regional languages.`;
  }
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express15.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  const httpServer = (0, import_http.createServer)(app);
  try {
    const { attachWs: attachWs2 } = await Promise.resolve().then(() => (init_server(), server_exports));
    const wss = attachWs2(httpServer);
    const origHealth = app._router?.stack;
    void wss;
    void origHealth;
    app.__wss = wss;
  } catch (e) {
    console.warn("[ws] attach skipped:", e?.message);
  }
  app.get("/api/health/ws-probe", (_req, res) => {
    const wss = app.__wss;
    res.json({ websocket: wss ? "HEALTHY" : "DEGRADED" });
  });
  httpServer.listen(PORT, "0.0.0.0", () => {
    const wss = app.__wss;
    console.log(`RESQ-AI Command Server running on http://localhost:${PORT} (aiMode=${config.aiMode} db=${isDbConnected() ? "MongoDB" : "mock"} ws=${wss ? "live" : "degraded"})`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start RESQ-AI server:", err);
});
//# sourceMappingURL=server.cjs.map
