import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema({
  incidentId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  hazardType: {
    type: String,
    enum: ['FLOOD', 'LANDSLIDE', 'CYCLONE', 'EARTHQUAKE', 'FIRE', 'INDUSTRIAL_ACCIDENT'],
    required: true
  },
  severity: {
    type: String,
    enum: ['LEVEL_1_LOW', 'LEVEL_2_MODERATE', 'LEVEL_3_HIGH', 'LEVEL_4_CRITICAL'],
    default: 'LEVEL_3_HIGH'
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
    enum: ['DECLARED', 'ACTIVE', 'MITIGATING', 'RESOLVED'],
    default: 'ACTIVE'
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

export default mongoose.model('Incident', incidentSchema);
