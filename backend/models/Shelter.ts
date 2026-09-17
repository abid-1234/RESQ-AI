import mongoose from 'mongoose';

const shelterSchema = new mongoose.Schema({
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
    enum: ['READY', 'PARTIAL', 'FULL', 'CLOSED'],
    default: 'READY'
  },
  manager: String,
  contactPhone: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Shelter', shelterSchema);
