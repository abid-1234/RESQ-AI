import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  alertId: { type: String, required: true, unique: true },
  incidentId: String,
  title: String,
  message: String,
  severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'HIGH' },
  alertType: { type: String, enum: ['EVACUATION', 'WARNING', 'ALL_CLEAR', 'SHELTER_FULL', 'RESOURCE_ALERT', 'TECHNICAL', 'INFORMATIONAL'], default: 'WARNING' },
  channels: { type: [String], enum: ['SMS', 'PUSH', 'BROWSER', 'SACHET_CAP', 'RADIO', 'SIREN', 'EMAIL'], default: ['SMS', 'PUSH', 'BROWSER', 'SACHET_CAP'] },
  targetArea: { radiusKm: Number, latitude: Number, longitude: Number, sectors: [String] },
  estimatedAudience: Number,
  deliverySuccessRate: { type: Number, default: 0 },
  status: { type: String, enum: ['DRAFT', 'SCHEDULED', 'DISPATCHED', 'ACKNOWLEDGED', 'EXPIRED'], default: 'DISPATCHED' },
  createdBy: String,
  createdAt: { type: Date, default: Date.now },
  dispatchedAt: Date,
  expiresAt: Date
});

export default mongoose.model('Alert', alertSchema);
