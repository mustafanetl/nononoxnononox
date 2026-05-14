-- Plan cache: avoids re-generating AI plans for identical requests.
-- Key is normalized: "amsterdam|2|romantic|couple"

CREATE TABLE IF NOT EXISTS public.cached_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,       -- normalized: "amsterdam|2|romantic|couple"
  destination TEXT NOT NULL,
  duration INT NOT NULL,
  vibe TEXT NOT NULL DEFAULT 'mixed',
  traveler_type TEXT NOT NULL DEFAULT 'couple',
  origin TEXT,
  plan_content TEXT NOT NULL,           -- full AI response (raw streamed content)
  hit_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cached_plans_key ON public.cached_plans(cache_key);
CREATE INDEX IF NOT EXISTS idx_cached_plans_destination ON public.cached_plans(destination);

-- RLS: public read, service role write (edge functions use service role key)
ALTER TABLE public.cached_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached plans"
  ON public.cached_plans FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Service role can manage cached plans"
  ON public.cached_plans FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
