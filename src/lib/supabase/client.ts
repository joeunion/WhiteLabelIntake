import { createClient } from "@supabase/supabase-js";

/**
 * Browser-side Supabase client using the anon key.
 * Only has access to public resources — no sensitive operations.
 */
export function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing Supabase client environment variables");
  }

  return createClient(url, anonKey);
}
