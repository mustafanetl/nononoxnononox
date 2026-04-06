ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS home_city text,
  ADD COLUMN IF NOT EXISTS travel_style text,
  ADD COLUMN IF NOT EXISTS dietary_restrictions jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS past_trips jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS display_name text;