/**
 * GIS service — GeoJSON polygon generation + point-in-polygon + exposure.
 * No heavy deps: pointInPolygon via ray casting, circle via WGS84 approx.
 */

export interface ZonePolygons {
  red: GeoJSON.Feature<GeoJSON.Polygon>;
  orange: GeoJSON.Feature<GeoJSON.Polygon>;
  yellow: GeoJSON.Feature<GeoJSON.Polygon>;
  greenNote: string;
}

/** Approx meters per degree at latitude (WGS84). */
function metersPerDegree(lat: number): { lat: number; lng: number } {
  const latRad = (lat * Math.PI) / 180;
  return { lat: 111_132, lng: 111_320 * Math.cos(latRad) };
}

function circlePolygon(center: [number, number], radiusM: number, steps = 48): number[][] {
  const [lat, lng] = center;
  const mPerDeg = metersPerDegree(lat);
  const coords: number[][] = [];
  for (let i = 0; i < steps; i++) {
    const ang = (i / steps) * 2 * Math.PI;
    const dx = Math.cos(ang) * radiusM;
    const dy = Math.sin(ang) * radiusM;
    // GeoJSON is [lng, lat]
    coords.push([lng + dx / mPerDeg.lng, lat + dy / mPerDeg.lat]);
  }
  coords.push(coords[0].slice());
  return coords;
}

export function hazardPolygons(center: [number, number], redRadiusM: number, orangeMult = 1.5, yellowMult = 2.2): ZonePolygons {
  if (!isFinite(center[0]) || !isFinite(center[1]) || !isFinite(redRadiusM) || redRadiusM <= 0) {
    throw new Error('Invalid center or radius');
  }
  const red = circlePolygon(center, redRadiusM);
  const orange = circlePolygon(center, redRadiusM * orangeMult);
  const yellow = circlePolygon(center, redRadiusM * yellowMult);
  const mk = (coords: number[][], name: string): GeoJSON.Feature<GeoJSON.Polygon> => ({
    type: 'Feature',
    properties: { name, center },
    geometry: { type: 'Polygon', coordinates: [coords] },
  });
  return {
    red: mk(red, 'red'),
    orange: mk(orange, 'orange'),
    yellow: mk(yellow, 'yellow'),
    greenNote: 'Outside yellow polygon',
  };
}

/** Ray casting point-in-polygon. point = [lng, lat], polygon ring = number[][2]. */
export function pointInPolygon(point: [number, number], ring: number[][]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function zoneForPoint(point: [number, number], zones: ZonePolygons): 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' {
  const r = (zones.red.geometry.coordinates[0] as number[][]);
  const o = (zones.orange.geometry.coordinates[0] as number[][]);
  const y = (zones.yellow.geometry.coordinates[0] as number[][]);
  if (pointInPolygon(point, r)) return 'RED';
  if (pointInPolygon(point, o)) return 'ORANGE';
  if (pointInPolygon(point, y)) return 'YELLOW';
  return 'GREEN';
}
