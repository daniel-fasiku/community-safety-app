import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client for the community safety backend.
 *
 * Credentials are read from public Expo env vars (anything prefixed with
 * `EXPO_PUBLIC_` is inlined into the client bundle at build time). The anon key
 * is safe to ship — row level security on the database is what actually guards
 * the data.
 *
 * The client is created lazily and may be `null` when the project hasn't been
 * configured yet, so the UI can fall back to a "demo" path instead of crashing.
 */

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        // No user sessions in the pilot — requests are anonymous, so don't
        // bother persisting or refreshing auth tokens.
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;
