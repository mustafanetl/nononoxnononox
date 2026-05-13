import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

// Fail fast with a clear error if required env vars are missing.
// Requirement 21.2: IF either environment variable is missing, THEN THE App SHALL fail
// to start and display an error indicating the missing configuration.
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  const missing = [
    !SUPABASE_URL ? 'VITE_SUPABASE_URL' : null,
    !SUPABASE_PUBLISHABLE_KEY ? 'VITE_SUPABASE_PUBLISHABLE_KEY' : null,
  ].filter(Boolean).join(', ');
  throw new Error(
    `Missing required Supabase environment variables: ${missing}. ` +
    `Set them in your .env file before starting the app.`
  );
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
