import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

import { LatLng } from '@/lib/geo';

export type LocationPhase = 'idle' | 'locating' | 'ready' | 'denied' | 'error';

/**
 * Result of a `locate()` call. Returning the outcome directly (instead of making
 * callers read hook state) avoids stale-closure bugs: the caller always sees the
 * coordinates or the real error from *this* attempt.
 */
export type LocateResult =
  | { ok: true; coordinates: LatLng }
  | { ok: false; error: string };

export type CurrentLocation = {
  phase: LocationPhase;
  coordinates: LatLng | null;
  error: string | null;
  /** Requests permission (if needed) and resolves the device's position. */
  locate: () => Promise<LocateResult>;
};

/** Don't wait forever for a fresh GPS fix — fall back to the last known one. */
const FIX_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

/**
 * Encapsulates the foreground-location handshake: confirm services are on, ask
 * for permission, then take a single position fix (with a last-known fallback so
 * a slow/again-unavailable GPS doesn't hang or fail outright).
 */
export function useCurrentLocation(): CurrentLocation {
  const [phase, setPhase] = useState<LocationPhase>('idle');
  const [coordinates, setCoordinates] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fail = useCallback((nextPhase: LocationPhase, message: string): LocateResult => {
    setPhase(nextPhase);
    setError(message);
    return { ok: false, error: message };
  }, []);

  const locate = useCallback(async (): Promise<LocateResult> => {
    setPhase('locating');
    setError(null);

    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        return fail(
          'error',
          'Location services are turned off. Turn them on (on an emulator: Extended controls → Location → set a point → Send) and try again.',
        );
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        return fail('denied', 'Location permission is required to confirm which neighbourhood you are in.');
      }

      // Try a fresh fix, but cap the wait and fall back to the last known fix —
      // emulators often have no live GPS signal until you send a location.
      const fresh = await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        FIX_TIMEOUT_MS,
      ).catch(() => null);
      const position = fresh ?? (await Location.getLastKnownPositionAsync());

      if (!position) {
        return fail(
          'error',
          'Could not get a location fix. On an emulator, open Extended controls → Location, set a position and press Send, then try again.',
        );
      }

      const next: LatLng = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setCoordinates(next);
      setPhase('ready');
      return { ok: true, coordinates: next };
    } catch (caught) {
      return fail(
        'error',
        caught instanceof Error ? caught.message : 'Something went wrong while locating you.',
      );
    }
  }, [fail]);

  return { phase, coordinates, error, locate };
}
