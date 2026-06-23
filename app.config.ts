import { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Dynamic config layered on top of `app.json`.
 *
 * Apple Maps (iOS) needs no key, but Google Maps (Android, used by `expo-maps`)
 * requires an API key baked into the native build. We inject it from the
 * `GOOGLE_MAPS_API_KEY` env var (loaded from `.env`) so the key never lives in
 * source control.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
  },
});
