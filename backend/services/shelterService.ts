import Shelter from '../models/Shelter.ts';

export const getAllShelters = async () => {
  return await Shelter.find().sort({ currentOccupancy: -1 });
};

export const getShelterById = async (shelterId: string) => {
  return await Shelter.findOne({ shelterId });
};

export const createShelter = async (shelterData: any) => {
  const newShelter = new Shelter({
    shelterId: `SH-${Date.now()}`,
    ...shelterData
  });
  return await newShelter.save();
};

export const updateShelterOccupancy = async (shelterId: string, occupancy: number) => {
  const shelter = await getShelterById(shelterId);
  if (!shelter) return null;

  const newStatus = occupancy >= shelter.capacity ? 'FULL' : occupancy > 0 ? 'PARTIAL' : 'READY';

  return await Shelter.findOneAndUpdate(
    { shelterId },
    {
      currentOccupancy: occupancy,
      status: newStatus,
      updatedAt: new Date()
    },
    { new: true }
  );
};

export const updateShelterResources = async (shelterId: string, resourceData: any) => {
  return await Shelter.findOneAndUpdate(
    { shelterId },
    {
      foodStock: resourceData.foodStock,
      waterStock: resourceData.waterStock,
      medicalBeds: resourceData.medicalBeds,
      updatedAt: new Date()
    },
    { new: true }
  );
};

export const getShelterCapacityReport = async () => {
  const shelters = await getAllShelters();
  
  const totalCapacity = shelters.reduce((sum, s) => sum + s.capacity, 0);
  const totalOccupancy = shelters.reduce((sum, s) => sum + s.currentOccupancy, 0);
  const availableSpaces = totalCapacity - totalOccupancy;
  const occupancyPercentage = Math.round((totalOccupancy / totalCapacity) * 100);

  return {
    totalCapacity,
    totalOccupancy,
    availableSpaces,
    occupancyPercentage,
    shelters: shelters.map(s => ({
      shelterId: s.shelterId,
      name: s.name,
      capacity: s.capacity,
      occupancy: s.currentOccupancy,
      occupancyPercent: Math.round((s.currentOccupancy / s.capacity) * 100),
      status: s.status,
      foodDays: s.foodStock,
      waterLiters: s.waterStock,
      medicalBeds: s.medicalBeds
    }))
  };
};

/** Haversine distance in km — correct for WGS84 lat/lng. */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export const findNearestShelter = async (latitude: number, longitude: number) => {
  const shelters = await Shelter.find({ status: { $ne: 'FULL' } });

  const withDistance = shelters.map(s => {
    const distance = haversineKm(latitude, longitude, s.location.latitude, s.location.longitude);
    return { ...s.toObject(), distance, distanceKm: distance };
  });

  return withDistance.sort((a, b) => a.distance - b.distance)[0];
};
