-- Public shared trip snapshots
CREATE TABLE public.shared_trips (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  owner_user_id uuid,
  title text NOT NULL,
  destination text,
  data_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_shared_trips_slug ON public.shared_trips(slug);
CREATE INDEX idx_shared_trips_owner ON public.shared_trips(owner_user_id);

ALTER TABLE public.shared_trips ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anonymous) can read a shared trip by querying it
CREATE POLICY "Shared trips are publicly readable"
  ON public.shared_trips FOR SELECT
  USING (true);

-- Only authenticated users can create shares; must own them
CREATE POLICY "Users can create their own shared trips"
  ON public.shared_trips FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owners can update their shared trips"
  ON public.shared_trips FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners can delete their shared trips"
  ON public.shared_trips FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_user_id);

-- View count bumper callable by anyone
CREATE OR REPLACE FUNCTION public.increment_shared_trip_views(_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.shared_trips
     SET view_count = view_count + 1
   WHERE slug = _slug;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_shared_trip_views(text) TO anon, authenticated;