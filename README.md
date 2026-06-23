# Community Safety

A React Native (Expo SDK 56) app for Lagos neighbourhoods. A resident opens a
map of known neighbourhood zones and taps **Request to Join**; the app reads
their GPS position, checks whether it falls inside a zone, resolves a
human-readable address, and either auto-approves them or flags the request for
manual review — storing the result in Supabase.

## Features

- **Map of neighbourhood zones** — Apple Maps (iOS) / Google Maps (Android) via
  `expo-maps`, drawing each zone as a coloured polygon.
- **One-tap join check** — resolves the device location, runs an on-device
  point-in-polygon match, and shows the verdict instantly.
- **Reverse geocoding** — turns the coordinates into a `Street, City, State`
  label for the result card.
- **Auto-approve vs. manual review** — inside a known zone → `approved`,
  otherwise → `pending_review`.
- **Supabase persistence** — each request (coordinates, matched zone, status) is
  written to a `join_requests` table guarded by Row Level Security.
- **Offline-friendly matching** — zones and the matching algorithm ship with the
  app, so the decision works without a network round-trip.

## Tech stack

- Expo SDK 56 + Expo Router (file-based navigation)
- React Native 0.85 / React 19
- `expo-maps` (native maps), `expo-location` (permissions, position, geocoding)
- `@supabase/supabase-js` (backend)
- TypeScript throughout

## Feature flow

```
[Map screen]                       src/app/index.tsx
     │  renders
     ▼
[ZoneMap] ── Apple/Google Maps via expo-maps, draws zone polygons
     │
     │  user taps "Request to Join"
     ▼
[useJoinFlow] ─────────────────────────────────────────────────┐
   1. useCurrentLocation()  → expo-location permission + fix      │
   2. reverseGeocode()      → "Street, City, State" label         │
   3. decideJoin(coords)    → point-in-polygon zone match         │
   4. submitJoinRequest()   → insert row into Supabase            │
                                                                  ▼
                                                   [join_requests table]
```

The result (`approved` / `pending_review`) is rendered by `JoinPanel`. The
decision is always shown to the user even if the Supabase write fails, so a
flaky network never hides the core feedback.

## Architecture & layering

The code is split so the decision logic is **pure and testable**, with side
effects (location, network, native map) pushed to the edges.

| Layer | Files | Responsibility |
| --- | --- | --- |
| Domain (pure) | `src/lib/geo.ts`, `src/constants/zones.ts` | `LatLng` type, ray-casting `isPointInPolygon`, hardcoded zones, `findZoneForPoint` |
| Services | `src/services/join-requests.ts`, `src/services/geocoding.ts` | `decideJoin` (approve vs. review rule), `submitJoinRequest` (Supabase insert), `reverseGeocode` (address lookup) |
| Backend client | `src/lib/supabase.ts` | Lazy Supabase client from env vars; `null` when unconfigured |
| Hooks | `src/hooks/use-current-location.ts`, `src/hooks/use-join-flow.ts` | Permission/position handshake and flow orchestration/state |
| UI | `src/components/zone-map.tsx` (+ `.web.tsx`), `src/components/join-panel.tsx`, `src/app/index.tsx` | Map rendering, action panel, screen composition |

## Folder structure

```
.
├── app.json                 # Expo config (plugins, permissions, icons)
├── app.config.ts            # Dynamic config — injects the Android Google Maps key from env
├── eas.json                 # EAS Build profiles (development / preview / production)
├── .env.example             # Template for the env vars below
├── supabase/
│   └── schema.sql           # join_requests table + RLS policy (run in the SQL editor)
└── src/
    ├── app/                 # Expo Router screens
    │   ├── _layout.tsx      #   Tab navigator + theme provider
    │   ├── index.tsx        #   Map + "Request to Join" screen (the feature)
    │   └── explore.tsx      #   Starter demo screen
    ├── components/
    │   ├── zone-map.tsx     #   Native map (Apple/Google) drawing zone polygons
    │   ├── zone-map.web.tsx #   Web fallback (readable zone list)
    │   ├── zone-map.types.ts#   Shared props for the map (avoids native import on web)
    │   ├── join-panel.tsx   #   Action button + approved/pending result card
    │   └── ...              #   Themed text/view, links, starter UI helpers
    ├── constants/
    │   ├── zones.ts         #   Hardcoded Lagos zones + findZoneForPoint
    │   └── theme.ts         #   Colours, spacing, fonts
    ├── hooks/
    │   ├── use-current-location.ts  # Permission + position fix (timeout + last-known fallback)
    │   └── use-join-flow.ts         # Orchestrates locate → geocode → decide → submit
    ├── lib/
    │   ├── geo.ts           #   LatLng type + ray-casting point-in-polygon (pure)
    │   └── supabase.ts      #   Supabase client from EXPO_PUBLIC_* env vars
    └── services/
        ├── join-requests.ts #   decideJoin (rule) + submitJoinRequest (insert)
        └── geocoding.ts     #   reverseGeocode (coords → address)
```

## Key decisions

- **Maps: `expo-maps`.** The first-party Expo module (Apple Maps on iOS, Google
  Maps on Android). `zone-map.tsx` builds one set of polygon/marker arrays and
  feeds whichever platform view applies. It's native-only, so `zone-map.web.tsx`
  renders a readable zone list for browser previews. Requires a **development
  build** (configured via `expo-dev-client`), not Expo Go.
- **Zone matching on-device.** Zones are hardcoded in `src/constants/zones.ts`
  as polygons; matching uses a dependency-free ray-casting algorithm in
  `src/lib/geo.ts`, so it's instant and works offline. Moving zones to a
  Postgres/PostGIS table later only changes the data source, not the rule.
- **Approval rule in one place.** Inside a known zone → `approved`, otherwise →
  `pending_review`. This lives only in `decideJoin`.
- **Write-only Supabase access.** A single `join_requests` table stores the
  coordinates, matched zone (id + name, nullable) and status. RLS allows
  **inserts only** — the public key can submit but cannot read or moderate.
  `submitJoinRequest` inserts without `.select()` so no read-back (and no read
  policy) is needed; moderation happens via the dashboard or a service-role
  backend.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create the backend** — make a free [Supabase](https://supabase.com) project
   and run [`supabase/schema.sql`](supabase/schema.sql) in its SQL editor
   (creates the `join_requests` table and the insert RLS policy).

3. **Configure environment** — copy the template and fill in your values:

   ```bash
   cp .env.example .env
   ```

   | Variable | Where to find it |
   | --- | --- |
   | `EXPO_PUBLIC_SUPABASE_URL` | Supabase → Settings → Data API → Project URL |
   | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API Keys → Publishable key |
   | `GOOGLE_MAPS_API_KEY` | Google Cloud (Maps SDK for Android enabled) — Android only |

   `.env` is gitignored. Apple Maps needs no key; only Android/Google Maps does.

4. **Build a development client** (native code is required, so Expo Go won't
   work):

   ```bash
   npx expo run:android      # or: npx expo run:ios
   ```

   Or build in the cloud with EAS:

   ```bash
   eas build --profile development --platform android
   ```

5. **Start the dev server** for an already-installed dev build:

   ```bash
   npx expo start --dev-client
   ```

## Running on a device / emulator

- **Physical phone:** install the dev-client build, then `npx expo start
  --dev-client` and open it from the dev client (same Wi-Fi, or `--tunnel`, or
  USB with `adb reverse tcp:8081 tcp:8081`). Real GPS works out of the box.
- **Android emulator:** the emulator has no real GPS — open **`⋮` (More) →
  Location**, set a point and press **Set Location / Send**. To land inside a
  zone, use e.g. Lekki Phase 1 `6.449, 3.474`; anywhere else yields
  `pending_review`.

## Configuration notes

- Location permission strings are declared through the `expo-maps` and
  `expo-location` config plugins in `app.json` — no manual native edits.
- The Android Google Maps key is injected at build time by `app.config.ts` from
  `GOOGLE_MAPS_API_KEY`, so it never lives in source control.
- Local Android builds require **JDK 17** (the Gradle toolchain pins it). Keep
  the project on a short path without spaces to avoid Windows `MAX_PATH` issues
  in the native C++ build.

## Extending

- **New zone:** add an entry to `ZONES` in `src/constants/zones.ts`.
- **Server-side matching / zones from a DB:** swap `findZoneForPoint` and the
  `ZONES` source; the hooks and UI stay the same.
- **Auth / per-user requests:** add a `user_id` column and tighten the RLS
  policy to scope inserts (and optionally reads) to the signed-in user.
- **Persist the address:** add an `address text` column and include it in the
  `submitJoinRequest` insert.
