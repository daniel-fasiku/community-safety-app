import * as Location from 'expo-location';

import { LatLng } from '@/lib/geo';

/**
 * Turns a coordinate into a human-readable "Street, City, State" string using
 * the platform reverse geocoder. Returns null when no address can be resolved
 * (e.g. an emulator without Google Play services, or no network), so callers
 * can fall back to showing raw coordinates.
 */
export async function reverseGeocode(coords: LatLng): Promise<string | null> {
  try {
    const [place] = await Location.reverseGeocodeAsync(coords);
    if (!place) {
      return null;
    }

    const street = place.street ?? place.name;
    const city = place.city ?? place.district ?? place.subregion;
    const state = place.region;

    const parts = [street, city, state].filter(
      (part): part is string => Boolean(part),
    );

    return parts.length > 0 ? parts.join(', ') : null;
  } catch {
    return null;
  }
}
