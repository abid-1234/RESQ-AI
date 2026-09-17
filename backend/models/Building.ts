import mongoose from 'mongoose';

const buildingSchema = new mongoose.Schema({
  buildingId: { type: String, required: true, unique: true },
  name: String,
  buildingType: {
    type: String,
    enum: ['RESIDENTIAL', 'COMMERCIAL', 'INSTITUTIONAL', 'INDUSTRIAL', 'MIXED'],
    default: 'RESIDENTIAL'
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
    enum: ['GREEN', 'YELLOW', 'ORANGE', 'RED'],
    default: 'GREEN'
  },
  evacuationStatus: {
    type: String,
    enum: ['SAFE', 'WARNING', 'EVACUATING', 'EVACUATED'],
    default: 'SAFE'
  },
  rescueNeeded: Boolean,
  trappedPersons: { type: Number, default: 0 },
  structuralDamage: {
    type: String,
    enum: ['NONE', 'MINOR', 'MODERATE', 'SEVERE', 'COLLAPSED'],
    default: 'NONE'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Building', buildingSchema);
