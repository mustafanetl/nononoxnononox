CREATE TABLE IF NOT EXISTS venue_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  destination TEXT NOT NULL,
  google_place_id TEXT,
  verified BOOLEAN,
  verification_date TIMESTAMPTZ DEFAULT NOW(),
  verification_source TEXT DEFAULT 'google_places',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  address TEXT,
  neighborhood TEXT,
  rating REAL,
  review_count INT,
  price_level INT,
  hours JSONB,
  phone TEXT,
  website TEXT,
  is_permanently_closed BOOLEAN DEFAULT FALSE,
  category TEXT,
  google_types TEXT[],
  cuisine TEXT[],
  meal_types TEXT[],
  vibes TEXT[],
  travelers TEXT[],
  photos JSONB DEFAULT '[]'::jsonb,
  photo_count INT DEFAULT 0,
  description TEXT,
  why_special TEXT,
  best_time_of_day TEXT,
  typical_duration TEXT,
  aliases TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, destination)
);

CREATE INDEX IF NOT EXISTS idx_vc_dest ON venue_cache(destination);
CREATE INDEX IF NOT EXISTS idx_vc_verified ON venue_cache(destination, verified);
CREATE INDEX IF NOT EXISTS idx_vc_category ON venue_cache(destination, category);

ALTER TABLE venue_cache ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'venue_cache' AND policyname = 'service_full') THEN
    CREATE POLICY service_full ON venue_cache FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
