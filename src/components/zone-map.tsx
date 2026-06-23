import { AppleMaps, GoogleMaps } from 'expo-maps';
import { useMemo } from 'react';
import { Platform } from 'react-native';

import { ZoneMapProps } from '@/components/zone-map.types';
import { ZONES_OVERVIEW_CAMERA } from '@/constants/zones';

/** 8-digit hex alpha suffix for the translucent polygon fill (~20% opacity). */
const FILL_ALPHA = '33';

/**
 * Cross-platform neighbourhood map. iOS renders through Apple Maps and Android
 * through Google Maps — `expo-maps` exposes both behind near-identical props,
 * so we build the polygon/marker arrays once and hand them to whichever view
 * the platform needs. Web is handled by `zone-map.web.tsx`.
 */
export function ZoneMap({ zones, userLocation, highlightedZoneId, style }: ZoneMapProps) {
  const polygons = useMemo(
    () =>
      zones.map((zone) => ({
        id: zone.id,
        coordinates: zone.boundary,
        color: `${zone.color}${FILL_ALPHA}`,
        lineColor: zone.color,
        lineWidth: zone.id === highlightedZoneId ? 5 : 2,
      })),
    [zones, highlightedZoneId],
  );

  const camera = useMemo(
    () => (userLocation ? { coordinates: userLocation, zoom: 14 } : ZONES_OVERVIEW_CAMERA),
    [userLocation],
  );

  // The native "my location" layer requires the runtime location permission to
  // already be granted — enabling it before that throws a SecurityException on
  // Android (crashing the map). We only have a fix once permission was granted,
  // so `userLocation` is a safe gate for turning the blue dot + button on.
  const showMyLocation = userLocation != null;

  if (Platform.OS === 'ios') {
    const markers: AppleMaps.Marker[] = zones.map((zone) => ({
      id: zone.id,
      coordinates: zone.boundary[0],
      title: zone.name,
      tintColor: zone.color,
      systemImage: 'house.fill',
    }));

    if (userLocation) {
      markers.push({
        id: 'you',
        coordinates: userLocation,
        title: 'You are here',
        tintColor: '#EF4444',
        systemImage: 'location.fill',
      });
    }

    return (
      <AppleMaps.View
        style={style}
        cameraPosition={camera}
        polygons={polygons}
        markers={markers}
        properties={{ isMyLocationEnabled: showMyLocation }}
        uiSettings={{ myLocationButtonEnabled: showMyLocation }}
      />
    );
  }

  const markers: GoogleMaps.Marker[] = zones.map((zone) => ({
    id: zone.id,
    coordinates: zone.boundary[0],
    title: zone.name,
    snippet: zone.description,
  }));

  if (userLocation) {
    markers.push({
      id: 'you',
      coordinates: userLocation,
      title: 'You are here',
    });
  }

  return (
    <GoogleMaps.View
      style={style}
      cameraPosition={camera}
      polygons={polygons}
      markers={markers}
      properties={{ isMyLocationEnabled: showMyLocation }}
      uiSettings={{ myLocationButtonEnabled: showMyLocation }}
    />
  );
}
