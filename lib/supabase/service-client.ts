import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client: bypasses RLS, so it must only ever be imported from
// server-side code (route handlers). The "server-only" import above makes any
// accidental client-bundle usage fail the build instead of leaking the key.
export const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
