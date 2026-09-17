/**
 * Server-side mirror of frontend/src/services/riskEngine.ts
 * Kept in sync — parity tested. Do not diverge without updating both.
 */

export type HazardType = 'FLOOD' | 'URBAN_FLOOD' | 'DAM_BREACH' | 'LANDSLIDE' | 'SEISMIC_ANOMALY' | 'CYCLONE' | 'CLOUDBURST';

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

export interface BuildingInput {
  structuralType: string;
  constructionYear: number;
  soilCategory: string;
  elevationMeters: number;
  nearestRiverDistanceKm: number;
  registeredPopulation: number;
  estimatedOccupancy: number;
  vulnerableGroups: { children: number; elderly: number; disabled: number; highRiskMed?: number };
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

export function calculateBuildingRisk(
  building: BuildingInput,
  params: SimulationParams
): { hazardScore: number; vulnerabilityScore: number; overallScore: number; evacuationPriority: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; estimatedTrapped: number } {
  let structuralBase = 30;
  if (building.structuralType === 'TIMBER_MUD') structuralBase = 90;
  else if (building.structuralType === 'UNREINFORCED_MASONRY') structuralBase = 70;
  else if (building.structuralType === 'REINFORCED_CONCRETE') structuralBase = 25;
  else if (building.structuralType === 'STEEL_FRAME') structuralBase = 20;
  const currentYear = 2026;
  const age = currentYear - building.constructionYear;
  const ageFactor = Math.min(25, age * 0.5);
  let soilFactor = 10;
  if (building.soilCategory === 'RIVER_BED_SAND') soilFactor = 35;
  else if (building.soilCategory === 'ALLUVIAL_LOOSE') soilFactor = 25;
  else if (building.soilCategory === 'CLAY_EXPANSIVE') soilFactor = 20;
  else if (building.soilCategory === 'ROCK_STABLE') soilFactor = 5;
  const vulnerabilityScore = Math.min(100, Math.round(structuralBase + ageFactor + soilFactor));
  let hazardScore = 20;
  if (params.hazardType === 'FLOOD' || params.hazardType === 'URBAN_FLOOD' || params.hazardType === 'DAM_BREACH') {
    const riverProximityWeight = Math.max(0, 1 - building.nearestRiverDistanceKm / 2.0);
    const elevationDeficit = Math.max(0, (505 - building.elevationMeters) / 20.0);
    const riverGaugeFactor = params.riverGaugeHeightM / 6.0;
    const rainFactor = params.rainfallIntensityMmH / 100.0;
    hazardScore = Math.min(100, Math.round((riverProximityWeight * 40 + elevationDeficit * 30 + riverGaugeFactor * 20 + rainFactor * 10) * 100 / 100));
  } else if (params.hazardType === 'LANDSLIDE') {
    const isSlope = building.elevationMeters > 530 ? 1 : 0.2;
    const rainSoilFactor = (params.rainfallIntensityMmH / 100.0) * (params.soilSaturationPercent / 100.0);
    hazardScore = Math.min(100, Math.round(isSlope * (rainSoilFactor * 80 + 20)));
  } else if (params.hazardType === 'SEISMIC_ANOMALY') {
    const pgaFactor = (params.groundAccelerationG / 0.5) * 100;
    hazardScore = Math.min(100, Math.round(pgaFactor));
  } else if (params.hazardType === 'CYCLONE') {
    const windFactor = (params.windSpeedKmh / 200) * 60;
    const rainFactor = (params.rainfallIntensityMmH / 100) * 40;
    hazardScore = Math.min(100, Math.round(windFactor + rainFactor));
  }
  const vulnRatio = (building.vulnerableGroups.children + building.vulnerableGroups.elderly + building.vulnerableGroups.disabled) / Math.max(1, building.registeredPopulation);
  const exposureMultiplier = 1.0 + (vulnRatio * 0.4);
  const overallScore = Math.min(100, Math.round((hazardScore * 0.45 + vulnerabilityScore * 0.35 + (hazardScore * exposureMultiplier) * 0.20)));
  let evacuationPriority: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'NONE';
  if (overallScore >= 85) evacuationPriority = 'CRITICAL';
  else if (overallScore >= 70) evacuationPriority = 'HIGH';
  else if (overallScore >= 50) evacuationPriority = 'MEDIUM';
  else if (overallScore >= 30) evacuationPriority = 'LOW';
  const unEvacuatedRatio = (100 - params.evacuationComplianceRate) / 100.0;
  let estimatedTrapped = 0;
  if (overallScore >= 75) estimatedTrapped = Math.round(building.estimatedOccupancy * unEvacuatedRatio * (overallScore / 100) * 0.4);
  return { hazardScore, vulnerabilityScore, overallScore, evacuationPriority, estimatedTrapped };
}

export function runDistrictRiskAnalysis(
  buildings: BuildingInput[],
  shelters: { capacity: number; currentOccupancy: number }[],
  params: SimulationParams
): RiskAnalysisResult {
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
      totalVulnerable += (b.vulnerableGroups.children + b.vulnerableGroups.elderly + b.vulnerableGroups.disabled);
    }
    totalTrapped += analysis.estimatedTrapped;
    weightedRiskSum += analysis.overallScore;
  });
  const averageDistrictRisk = buildings.length > 0 ? Math.round(weightedRiskSum / buildings.length) : 0;
  let redZoneRadius = 400;
  if (params.hazardType === 'FLOOD' || params.hazardType === 'DAM_BREACH') redZoneRadius = Math.round(500 + (params.riverGaugeHeightM * 180) + (params.rainfallIntensityMmH * 4));
  else if (params.hazardType === 'CYCLONE') redZoneRadius = Math.round(1000 + (params.windSpeedKmh * 8));
  else if (params.hazardType === 'LANDSLIDE') redZoneRadius = Math.round(300 + (params.soilSaturationPercent * 6));
  else if (params.hazardType === 'SEISMIC_ANOMALY') redZoneRadius = Math.round(800 + (params.groundAccelerationG * 2000));
  const orangeZoneRadius = Math.round(redZoneRadius * 1.5);
  const yellowZoneRadius = Math.round(redZoneRadius * 2.2);
  const totalShelterCapacity = shelters.reduce((acc, s) => acc + (s.capacity - s.currentOccupancy), 0);
  const shelterDeficitPersons = Math.max(0, totalExposed - totalShelterCapacity);
  const recommendedOfficerDeployment = Math.max(12, Math.ceil(totalExposed / 45) + (totalTrapped * 2));
  const estimatedCasualtiesAtRisk = Math.round(totalTrapped * 0.18);
  const confidenceScore = 88.5;
  const reasoningFactors: string[] = [
    `River Gauge reading at ${params.riverGaugeHeightM.toFixed(2)}m (${params.riverGaugeHeightM > 4.5 ? 'CRITICAL DANGER' : 'Elevated Inflow'})`,
    `Rainfall intensity at ${params.rainfallIntensityMmH} mm/h with high catchment run-off`,
    `Soil saturation at ${params.soilSaturationPercent}% causing reduced absorption in alluvial plains`,
    `${totalVulnerable.toLocaleString()} vulnerable citizens located within active hazard buffer`,
    `Shelter capacity status: ${shelterDeficitPersons > 0 ? `DEFICIT of ${shelterDeficitPersons} beds` : 'Adequate buffer available'}`,
  ];
  return {
    overallDistrictRisk: averageDistrictRisk,
    hazardIndex: Math.min(100, Math.round((params.riverGaugeHeightM / 6.0) * 60 + (params.rainfallIntensityMmH / 100) * 40)),
    exposureIndex: Math.min(100, Math.round((totalExposed / 12000) * 100)),
    vulnerabilityIndex: Math.min(100, Math.round((totalVulnerable / Math.max(1, totalExposed)) * 140)),
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
    reasoningFactors,
  };
}
