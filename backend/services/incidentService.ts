import Incident from '../models/Incident.ts';
import Shelter from '../models/Shelter.ts';
import Building from '../models/Building.ts';

export const getActiveIncidents = async () => {
  return await Incident.find({ status: 'ACTIVE' }).sort({ startTime: -1 });
};

export const getIncidentById = async (incidentId: string) => {
  return await Incident.findOne({ incidentId });
};

export const createIncident = async (incidentData: any) => {
  const newIncident = new Incident({
    incidentId: `INC-${Date.now()}`,
    ...incidentData,
    startTime: new Date()
  });
  return await newIncident.save();
};

export const updateIncident = async (incidentId: string, updateData: any) => {
  return await Incident.findOneAndUpdate(
    { incidentId },
    { ...updateData, updatedAt: new Date() },
    { new: true }
  );
};

export const getIncidentStats = async (incidentId: string) => {
  const incident = await getIncidentById(incidentId);
  if (!incident) return null;

  const affectedBuildings = await Building.find({
    'location.sector': incident.location.sector,
    hazardZone: { $in: ['RED', 'ORANGE', 'YELLOW'] }
  });

  const availableShelters = await Shelter.find({
    'location.sector': incident.location.sector,
    status: { $ne: 'CLOSED' }
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

export const closeIncident = async (incidentId: string) => {
  return await Incident.findOneAndUpdate(
    { incidentId },
    {
      status: 'RESOLVED',
      endTime: new Date(),
      updatedAt: new Date()
    },
    { new: true }
  );
};
