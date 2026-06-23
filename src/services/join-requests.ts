import { findZoneForPoint, Zone } from '@/constants/zones';
import { LatLng } from '@/lib/geo';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export type JoinStatus = 'approved' | 'pending_review';

export type JoinDecision = {
  status: JoinStatus;
  zone: Zone | null;
  coordinates: LatLng;
};

const TABLE = 'join_requests';

/**
 * The core rule of the feature: a coordinate inside a known neighbourhood zone
 * is auto-approved, anything else is flagged for a human to review.
 */
export function decideJoin(coordinates: LatLng): JoinDecision {
  const zone = findZoneForPoint(coordinates);
  return {
    coordinates,
    zone,
    status: zone ? 'approved' : 'pending_review',
  };
}

/**
 * Persists a join request to Supabase.
 *
 * Deliberately a fire-and-forget insert with no `.select()`: the anon key is
 * only allowed to write (never read), so we don't ask for the row back. Throws
 * when Supabase isn't configured or the insert fails — callers decide how to
 * surface that to the user.
 */
export async function submitJoinRequest(decision: JoinDecision): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.',
    );
  }

  const { error } = await supabase.from(TABLE).insert({
    latitude: decision.coordinates.latitude,
    longitude: decision.coordinates.longitude,
    zone_id: decision.zone?.id ?? null,
    zone_name: decision.zone?.name ?? null,
    status: decision.status,
  });

  if (error) {
    throw new Error(error.message);
  }
}
