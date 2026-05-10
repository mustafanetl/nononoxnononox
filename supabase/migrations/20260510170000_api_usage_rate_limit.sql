-- Per-day usage counter for AI endpoints.
-- bucket: "user:<uuid>" for logged-in, "ip:<ip>" for anonymous.
-- endpoint: the function name (e.g. "rzuma-chat").
-- day: YYYY-MM-DD in UTC.

CREATE TABLE IF NOT EXISTS public.api_usage (
  bucket text NOT NULL,
  endpoint text NOT NULL,
  day date NOT NULL,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (bucket, endpoint, day)
);

CREATE INDEX IF NOT EXISTS api_usage_day_idx ON public.api_usage (day);

-- Lock it down: only the service role (edge functions) can touch it.
-- Users should NEVER read or write their own usage counters from the client.
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- No policies created intentionally. RLS + no policy = no direct client access.
-- Edge functions use the service role key which bypasses RLS.

-- Helper: periodic cleanup of rows older than 30 days so the table doesn't
-- grow forever. Run manually or via a cron once scheduled jobs are set up.
CREATE OR REPLACE FUNCTION public.prune_api_usage() RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.api_usage WHERE day < CURRENT_DATE - INTERVAL '30 days';
$$;

REVOKE ALL ON FUNCTION public.prune_api_usage() FROM public;
GRANT EXECUTE ON FUNCTION public.prune_api_usage() TO service_role;
