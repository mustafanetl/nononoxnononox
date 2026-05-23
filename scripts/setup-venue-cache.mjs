/**
 * Create the venue_cache table via Supabase Management API
 * Run once: node scripts/setup-venue-cache.mjs
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envContent = readFileSync(resolve(import.meta.dirname, '..', '.env'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line.includes('=') && !line.startsWith('#')) {
    const [k, ...v] = line.split('=');
    env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
  }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const headers = { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY, 'Content-Type': 'application/json' };

// Check if table exists
const check = await fetch(`${SUPABASE_URL}/rest/v1/venue_cache?limit=0`, { headers });
if (check.ok) {
  console.log('✓ venue_cache table already exists!');
  // Test insert/delete
  const testRes = await fetch(`${SUPABASE_URL}/rest/v1/venue_cache`, {
    method: 'POST', headers: { ...headers, 'Prefer': 'return=minimal' },
    body: JSON.stringify({ name: '__test__', destination: '__test__', verified: true }),
  });
  if (testRes.ok) {
    await fetch(`${SUPABASE_URL}/rest/v1/venue_cache?name=eq.__test__&destination=eq.__test__`, {
      method: 'DELETE', headers,
    });
    console.log('✓ Insert/Delete working');
  } else {
    console.log('✗ Insert failed:', testRes.status, await testRes.text());
  }
  process.exit(0);
}

console.log('✗ venue_cache table does not exist.');
console.log('\nYou need to create it. Run this SQL in Supabase Dashboard → SQL Editor:');
console.log('https://supabase.com/dashboard/project/lidgfofsdpcezxpyhwam/sql\n');
console.log(`
CREATE TABLE venue_cache (
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

CREATE INDEX idx_vc_dest ON venue_cache(destination);
CREATE INDEX idx_vc_verified ON venue_cache(destination, verified);
CREATE INDEX idx_vc_category ON venue_cache(destination, category);

ALTER TABLE venue_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_full" ON venue_cache FOR ALL USING (true) WITH CHECK (true);
`);
