/**
 * Lightweight geometry helpers for matching a coordinate against neighbourhood
 * zones. Everything here is pure and dependency-free so it can be unit tested
 * and reused on the server side later if we move matching off-device.
 */

export type LatLng = {
  latitude: number;
  longitude: number;
};

/**
 * Ray-casting point-in-polygon test.
 *
 * Walks each edge of the polygon and counts how many times a horizontal ray
 * cast from the point crosses an edge. An odd number of crossings means the
 * point sits inside the ring. Works for arbitrary (convex or concave) simple
 * polygons and treats longitude as x and latitude as y.
 */
export function isPointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  if (polygon.length < 3) {
    return false;
  }

  const x = point.longitude;
  const y = point.latitude;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;

    const straddlesY = yi > y !== yj > y;
    const intersectsRay = x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (straddlesY && intersectsRay) {
      inside = !inside;
    }
  }

  return inside;
}

/** Average of all vertices — good enough to centre the map camera on a zone. */
export function polygonCentroid(polygon: LatLng[]): LatLng {
  const total = polygon.reduce(
    (acc, vertex) => ({
      latitude: acc.latitude + vertex.latitude,
      longitude: acc.longitude + vertex.longitude,
    }),
    { latitude: 0, longitude: 0 },
  );

  return {
    latitude: total.latitude / polygon.length,
    longitude: total.longitude / polygon.length,
  };
}
