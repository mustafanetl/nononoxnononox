import { supabase } from "@/integrations/supabase/client";

/**
 * Get the best Authorization header for calling our edge functions.
 *
 * If the user is logged in → uses their JWT (so the server knows who they are
 * and can apply per-user rate limits + premium status).
 *
 * If anonymous → falls back to the public anon key (so the edge function can
 * still be reached; rate-limit will bucket by IP on the server).
 *
 * Never throws: callers get a usable header even if Supabase is slow.
 */
export async function getAuthHeader(): Promise<string> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) return `Bearer ${token}`;
  } catch {
    /* ignore, fall through */
  }
  return `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`;
}
