import { Building, HazardType, RelocationSite, SensorNode, Shelter } from '../types';

export interface SimulationParams {
  hazardType: HazardType;
  rainfallIntensityMmH: number;
  riverGaugeHeightM: number;
  groundAccelerationG: number;
  soilSaturationPercent: number;
  windSpeedKmh: number;
  evacuationComplianceRate: number;
  activeRoadClosures: number;
}

export interface RiskAnalysisResult {
  overallDistrictRisk: number;
  hazardIndex: number;
  exposureIndex: number;
  vulnerabilityIndex: number;
  redZoneRadiusMeters: number;
  orangeZoneRadiusMeters: number;
  yellowZoneRadiusMeters: number;
  affectedBuildingsCount: number;
  exposedPopulationTotal: number;
  vulnerablePersonsCount: number;
  estimatedTrappedCount: number;
  estimatedCasualtiesAtRisk: number;
  shelterDeficitPersons: number;
  recommendedOfficerDeployment: number;
  confidenceScore: number;
  reasoningFactors: string[];
}

export function calculateBuildingRisk(building: Building, params: SimulationParams) {
  const structuralBase = building.structuralType === 'TIMBER_MUD' ? 90 : building.structuralType === 'UNREINFORCED_MASONRY' ? 70 : building.structuralType === 'REINFORCED_CONCRETE' ? 25 : 20;
  const ageFactor = Math.min(25, Math.max(0, 2026 - building.constructionYear) * 0.5);
  const soilFactor = building.soilCategory === 'RIVER_BED_SAND' ? 35 : building.soilCategory === 'ALLUVIAL_LOOSE' ? 25 : building.soilCategory === 'CLAY_EXPANSIVE' ? 20 : 5;
  const vulnerabilityScore = Math.min(100, Math.round(structuralBase + ageFactor + soilFactor));
  const hazardScore = Math.min(100, Math.round(params.hazardType === 'FLOOD' || params.hazardType === 'DAM_BREACH' || params.hazardType === 'URBAN_FLOOD' ? params.riverGaugeHeightM * 10 + params.rainfallIntensityMmH * 0.3 : params.hazardType === 'CYCLONE' ? params.windSpeedKmh * 0.3 + params.rainfallIntensityMmH * 0.2 : params.groundAccelerationG * 120));
  const vulnerable = building.vulnerableGroups.children + building.vulnerableGroups.elderly + building.vulnerableGroups.disabled;
  const overallScore = Math.min(100, Math.round(hazardScore * 0.45 + vulnerabilityScore * 0.35 + hazardScore * (1 + vulnerable / Math.max(1, building.registeredPopulation)) * 0.2));
  const evacuationPriority = overallScore >= 85 ? 'CRITICAL' : overallScore >= 70 ? 'HIGH' : overallScore >= 50 ? 'MEDIUM' : overallScore >= 30 ? 'LOW' : 'NONE';
  const estimatedTrapped = overallScore >= 75 ? Math.round(building.estimatedOccupancy * (1 - params.evacuationComplianceRate / 100) * overallScore / 250) : 0;
  return { hazardScore, vulnerabilityScore, overallScore, evacuationPriority: evacuationPriority as 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', estimatedTrapped };
}

export function runDistrictRiskAnalysis(buildings: Building[], shelters: Shelter[], params: SimulationParams): RiskAnalysisResult {
  const analyses = buildings.map((building) => calculateBuildingRisk(building, params));
  const affected = analyses.filter((analysis) => analysis.overallScore >= 45);
  const exposed = buildings.filter((_, index) => analyses[index].overallScore >= 45).reduce((sum, building) => sum + building.estimatedOccupancy, 0);
  const vulnerable = buildings.filter((_, index) => analyses[index].overallScore >= 45).reduce((sum, building) => sum + building.vulnerableGroups.children + building.vulnerableGroups.elderly + building.vulnerableGroups.disabled, 0);
  const trapped = analyses.reduce((sum, analysis) => sum + analysis.estimatedTrapped, 0);
  const radius = params.hazardType === 'FLOOD' || params.hazardType === 'DAM_BREACH' ? Math.round(500 + params.riverGaugeHeightM * 180 + params.rainfallIntensityMmH * 4) : Math.round(400 + params.windSpeedKmh * 8);
  const shelterCapacity = shelters.reduce((sum, shelter) => sum + shelter.capacity - shelter.currentOccupancy, 0);
  return { overallDistrictRisk: analyses.length ? Math.round(analyses.reduce((sum, analysis) => sum + analysis.overallScore, 0) / analyses.length) : 0, hazardIndex: Math.min(100, Math.round(params.rainfallIntensityMmH * 0.4 + params.riverGaugeHeightM * 8)), exposureIndex: Math.min(100, Math.round(exposed / 120)), vulnerabilityIndex: Math.min(100, Math.round(vulnerable / Math.max(1, exposed) * 140)), redZoneRadiusMeters: radius, orangeZoneRadiusMeters: Math.round(radius * 1.5), yellowZoneRadiusMeters: Math.round(radius * 2.2), affectedBuildingsCount: affected.length, exposedPopulationTotal: exposed, vulnerablePersonsCount: vulnerable, estimatedTrappedCount: trapped, estimatedCasualtiesAtRisk: Math.round(trapped * 0.18), shelterDeficitPersons: Math.max(0, exposed - shelterCapacity), recommendedOfficerDeployment: Math.max(12, Math.ceil(exposed / 45) + trapped * 2), confidenceScore: 88.5, reasoningFactors: [`Rainfall intensity at ${params.rainfallIntensityMmH} mm/h`, `River gauge at ${params.riverGaugeHeightM.toFixed(2)}m`] };
}

export function evaluateRelocationCarryingCapacity(site: RelocationSite, addedPopulation: number) {
  const population = site.currentRelocated + addedPopulation;
  const ratio = population / site.totalPopulationCapacity;
  const waterRemainingDays = Math.max(0, Math.round(site.carryingCapacity.waterCapacityPersons / Math.max(1, population) * 10));
  const foodRemainingDays = Math.max(0, Math.round(site.carryingCapacity.foodLogisticsDays * site.totalPopulationCapacity / Math.max(1, population)));
  const effectiveScore = Math.max(10, Math.min(100, Math.round(95 - Math.max(0, ratio - 0.8) * 50 - (waterRemainingDays < 5 ? 25 : 0) - (foodRemainingDays < 7 ? 15 : 0))));
  const warningLevel = effectiveScore < 40 ? 'RED' : effectiveScore < 65 ? 'ORANGE' : effectiveScore < 80 ? 'YELLOW' : 'GREEN';
  return { effectiveScore, waterRemainingDays, foodRemainingDays, warningLevel: warningLevel as 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED', notes: effectiveScore < 65 ? 'Additional logistics required.' : 'Stable logistics corridor.' };
}
