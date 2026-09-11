import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for cron / outbox workers only.
 * Never import this into client components or user-facing routes.
 *
 * Untyped on purpose: service RPCs (claim/mark/schedule) are worker-only and
 * evolve faster than the generated Database map.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are required for service operations",
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
