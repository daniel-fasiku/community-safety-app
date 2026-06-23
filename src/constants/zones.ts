import { isPointInPolygon, LatLng, polygonCentroid } from '@/lib/geo';

/**
 * Hardcoded neighbourhood zones for the Lagos pilot. Each zone is a simple
 * polygon traced roughly around the estate boundary. Coordinates are
 * [latitude, longitude] in decimal degrees.
 *
 * In production these would come from Supabase (a `zones` table with PostGIS
 * geometry), but for the pilot we ship them with the app so the map works
 * offline and matching stays instant.
 */

export type Zone = {
  id: string;
  name: string;
  /** Short blurb shown in the join sheet. */
  description: string;
  /** Outline + fill colour used on the map. */
  color: string;
  /** Boundary ring, ordered clockwise. */
  boundary: LatLng[];
};

const LEKKI_PHASE_1: LatLng[] = [
  { latitude: 6.4382, longitude: 3.4625 },
  { latitude: 6.4382, longitude: 3.4858 },
  { latitude: 6.4598, longitude: 3.4858 },
  { latitude: 6.4598, longitude: 3.4625 },
];

const VICTORIA_ISLAND: LatLng[] = [
  { latitude: 6.4205, longitude: 3.4115 },
  { latitude: 6.4205, longitude: 3.4365 },
  { latitude: 6.4392, longitude: 3.4365 },
  { latitude: 6.4392, longitude: 3.4115 },
];

const IKOYI: LatLng[] = [
  { latitude: 6.4438, longitude: 3.4255 },
  { latitude: 6.4438, longitude: 3.4520 },
  { latitude: 6.4612, longitude: 3.4520 },
  { latitude: 6.4612, longitude: 3.4255 },
];

export const ZONES: Zone[] = [
  {
    id: 'lekki-phase-1',
    name: 'Lekki Phase 1',
    description: 'Gated residential estate east of Victoria Island.',
    color: '#208AEF',
    boundary: LEKKI_PHASE_1,
  },
  {
    id: 'victoria-island',
    name: 'Victoria Island',
    description: 'Central business and residential district on the lagoon.',
    color: '#16A34A',
    boundary: VICTORIA_ISLAND,
  },
  {
    id: 'ikoyi',
    name: 'Ikoyi',
    description: 'Upscale residential area between the mainland and the island.',
    color: '#9333EA',
    boundary: IKOYI,
  },
];

/** Camera target that frames all zones when the map first opens. */
export const ZONES_OVERVIEW_CAMERA = {
  coordinates: polygonCentroid(ZONES.flatMap((zone) => zone.boundary)),
  zoom: 12,
};

export function getZoneById(id: string | null | undefined): Zone | undefined {
  return ZONES.find((zone) => zone.id === id);
}

/** Returns the first zone whose boundary contains the point, or null. */
export function findZoneForPoint(point: LatLng): Zone | null {
  return ZONES.find((zone) => isPointInPolygon(point, zone.boundary)) ?? null;
}
