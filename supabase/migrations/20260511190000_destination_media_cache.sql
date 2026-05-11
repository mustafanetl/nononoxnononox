-- Destination media cache: stores Google Places images + admin overrides + videos.
-- Prevents re-fetching the same images from Google Places on every request.

CREATE TABLE IF NOT EXISTS public.destination_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination TEXT NOT NULL,           -- normalized city name (lowercase trimmed)
  type TEXT NOT NULL DEFAULT 'hero',   -- hero | activity | hotel | video
  name TEXT,                           -- activity/hotel name (null for hero/video)
  url TEXT NOT NULL,                   -- full-size image or video URL
  thumb_url TEXT,                      -- thumbnail URL (for images)
  source TEXT NOT NULL DEFAULT 'google_places', -- google_places | admin_override | manual
  metadata JSONB DEFAULT '{}',         -- rating, address, width, height, attributions, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS destination_media_dest_idx ON public.destination_media (destination);
CREATE INDEX IF NOT EXISTS destination_media_dest_type_idx ON public.destination_media (destination, type);
CREATE INDEX IF NOT EXISTS destination_media_dest_name_idx ON public.destination_media (destination, name) WHERE name IS NOT NULL;

-- RLS: public read (anyone can see cached images), admin write
ALTER TABLE public.destination_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read destination media"
  ON public.destination_media FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can manage destination media"
  ON public.destination_media FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role (edge functions) can insert/update cached images
CREATE POLICY "Service role can manage destination media"
  ON public.destination_media FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
