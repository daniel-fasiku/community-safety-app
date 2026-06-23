import { useCallback, useState } from "react";

import { useCurrentLocation } from "@/hooks/use-current-location";
import { LatLng } from "@/lib/geo";
import { reverseGeocode } from "@/services/geocoding";
import {
    decideJoin,
    JoinDecision,
    submitJoinRequest,
} from "@/services/join-requests";

export type JoinPhase = "idle" | "locating" | "submitting" | "done" | "error";

export type JoinOutcome = {
  decision: JoinDecision;
  /** Human-readable "Street, City, State" resolved from the coordinates. */
  address: string | null;
  /** Whether the request was successfully written to Supabase. */
  saved: boolean;
};

export type JoinFlow = {
  phase: JoinPhase;
  outcome: JoinOutcome | null;
  error: string | null;
  userLocation: LatLng | null;
  isBusy: boolean;
  requestToJoin: () => Promise<void>;
  reset: () => void;
};

/**
 * Orchestrates the whole "Request to Join" interaction:
 *   1. resolve the device location,
 *   2. decide approved vs. pending_review from the zone match,
 *   3. persist the request to Supabase.
 *
 * The decision is always shown to the user even if the backend write fails, so
 * a flaky network never blocks the core feedback.
 */
export function useJoinFlow(): JoinFlow {
  const location = useCurrentLocation();
  const [phase, setPhase] = useState<JoinPhase>("idle");
  const [outcome, setOutcome] = useState<JoinOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestToJoin = useCallback(async () => {
    setError(null);
    setOutcome(null);
    setPhase("locating");

    const result = await location.locate();
    console.log("useJoinFlow: location result", result);
    if (!result.ok) {
      setPhase("error");
      setError(result.error);
      return;
    }

    const decision = decideJoin(result.coordinates);
    const address = await reverseGeocode(result.coordinates);
    setPhase("submitting");

    try {
      await submitJoinRequest(decision);
      setOutcome({ decision, address, saved: true });
    } catch (caught) {
      // Surface the decision regardless, but tell the user it wasn't saved.
      setOutcome({ decision, address, saved: false });
      setError(
        caught instanceof Error
          ? `Your result is shown below, but it wasn't saved: ${caught.message}`
          : "Your result is shown below, but it couldn't be saved.",
      );
    } finally {
      setPhase("done");
    }
  }, [location]);

  const reset = useCallback(() => {
    setPhase("idle");
    setOutcome(null);
    setError(null);
  }, []);

  return {
    phase,
    outcome,
    error,
    userLocation: location.coordinates,
    isBusy: phase === "locating" || phase === "submitting",
    requestToJoin,
    reset,
  };
}
