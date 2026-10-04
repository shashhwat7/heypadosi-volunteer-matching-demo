import * as h3 from 'h3-js';

/**
 * Calculates Haversine distance in kilometers between two lat/lng coordinates.
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 100) / 100; // 2 decimal places
}

/**
 * Converts latitude and longitude to an H3 index at resolution 9 (approx ~100m hex diameter).
 */
export function getH3Resolution9Cell(lat: number, lng: number): string {
  try {
    // In h3-js v4: latLngToCell(lat, lng, res)
    if (typeof (h3 as any).latLngToCell === 'function') {
      return (h3 as any).latLngToCell(lat, lng, 9);
    }
    // In h3-js v3 fallback: geoToH3(lat, lng, res)
    if (typeof (h3 as any).geoToH3 === 'function') {
      return (h3 as any).geoToH3(lat, lng, 9);
    }
  } catch (err) {
    console.warn('H3 calculation fallback:', err);
  }
  return `89${Math.abs(Math.floor(lat * 100)).toString(16)}${Math.abs(Math.floor(lng * 100)).toString(16)}ffffff`;
}

/**
 * Generates H3 candidate cells within k-rings of an origin cell.
 */
export function getH3CandidateCells(originH3: string, kRadius: number = 3): string[] {
  try {
    if (typeof (h3 as any).gridDisk === 'function') {
      return (h3 as any).gridDisk(originH3, kRadius);
    }
    if (typeof (h3 as any).kRing === 'function') {
      return (h3 as any).kRing(originH3, kRadius);
    }
  } catch (err) {
    console.warn('H3 gridDisk fallback:', err);
  }
  return [originH3];
}

export interface GeoEvaluationResult {
  isWithinRadius: boolean;
  distanceKm: number;
  publisherH3: string;
  subscriberH3: string;
  explanation: string;
}

/**
 * Evaluates whether a subscriber is eligible under publisher's delivery radius.
 * Model:
 * 1. Publisher owns delivery radius.
 * 2. H3 resolution 9 cell index computed for publisher and subscriber.
 * 3. Haversine distance computed precisely.
 * 4. Exact check: distanceKm <= publisherRadiusKm.
 */
export function evaluateSubscriberGeoRadius(
  publisherLat: number,
  publisherLng: number,
  publisherRadiusKm: number,
  subscriberLat: number,
  subscriberLng: number
): GeoEvaluationResult {
  const publisherH3 = getH3Resolution9Cell(publisherLat, publisherLng);
  const subscriberH3 = getH3Resolution9Cell(subscriberLat, subscriberLng);
  const distanceKm = haversineDistanceKm(publisherLat, publisherLng, subscriberLat, subscriberLng);

  const isWithinRadius = distanceKm <= publisherRadiusKm;
  const explanation = isWithinRadius
    ? `Distance ${distanceKm.toFixed(2)} km is within publisher radius of ${publisherRadiusKm} km (Pub H3: ${publisherH3}, Sub H3: ${subscriberH3})`
    : `Distance ${distanceKm.toFixed(2)} km exceeds publisher radius of ${publisherRadiusKm} km (Difference: +${(distanceKm - publisherRadiusKm).toFixed(2)} km)`;

  return {
    isWithinRadius,
    distanceKm,
    publisherH3,
    subscriberH3,
    explanation
  };
}
