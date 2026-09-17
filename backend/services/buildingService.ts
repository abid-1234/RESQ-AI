import Building from '../models/Building.ts';

export const getBuildingsBySector = async (sector: string) => Building.find({ 'location.sector': sector }).sort({ vulnerabilityScore: -1 });
export const getBuildingsByHazardZone = async (hazardZone: string) => Building.find({ hazardZone }).sort({ vulnerabilityScore: -1 });
export const getBuildingById = async (buildingId: string) => Building.findOne({ buildingId });

export const createBuilding = async (buildingData: any) => new Building({ buildingId: `B-${Date.now()}`, ...buildingData }).save();

export const updateBuildingEvacuation = async (buildingId: string, evacuationStatus: string, trappedPersons: number) => Building.findOneAndUpdate(
  { buildingId },
  { evacuationStatus, trappedPersons, rescueNeeded: trappedPersons > 0, updatedAt: new Date() },
  { new: true },
);

export const updateBuildingStructure = async (buildingId: string, damageLevel: string) => Building.findOneAndUpdate(
  { buildingId },
  { structuralDamage: damageLevel, updatedAt: new Date() },
  { new: true },
);

export const getHighRiskBuildings = async (sector?: string) => {
  const query: any = { hazardZone: 'RED', rescueNeeded: true };
  if (sector) query['location.sector'] = sector;
  return Building.find(query).sort({ trappedPersons: -1, vulnerabilityScore: -1 });
};

export const getRescueOperationsStatus = async (sector?: string) => {
  const query: any = { rescueNeeded: true };
  if (sector) query['location.sector'] = sector;
  const buildings = await Building.find(query);
  return {
    totalBuildingsNeedingRescue: buildings.length,
    totalTrappedPersons: buildings.reduce((sum, building) => sum + building.trappedPersons, 0),
    fullyEvacuatedBuildings: buildings.filter((building) => building.evacuationStatus === 'EVACUATED').length,
    partiallyEvacuated: buildings.filter((building) => building.evacuationStatus === 'EVACUATING').length,
    buildings: buildings.map((building) => ({
      buildingId: building.buildingId,
      name: building.name,
      trappedPersons: building.trappedPersons,
      evacuationStatus: building.evacuationStatus,
      structuralDamage: building.structuralDamage,
      location: building.location,
      priority: building.trappedPersons * (building.structuralDamage === 'COLLAPSED' ? 2 : 1),
    })),
  };
};

export const getGISBoundaryData = async () => {
  const buildings = await Building.find();
  const zones = ['RED', 'ORANGE', 'YELLOW'].reduce((result, zone) => {
    result[zone] = buildings.filter((building) => building.hazardZone === zone).map((building) => ({
      id: building.buildingId,
      name: building.name,
      coordinates: [building.location.latitude, building.location.longitude],
      occupants: building.occupants,
      riskScore: building.vulnerabilityScore,
    }));
    return result;
  }, {} as Record<string, unknown[]>);
  return {
    totalBuildings: buildings.length,
    highRiskCount: zones.RED.length,
    mediumRiskCount: zones.ORANGE.length,
    lowRiskCount: zones.YELLOW.length,
    zones,
  };
};
