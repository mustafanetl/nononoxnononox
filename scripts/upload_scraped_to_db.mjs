// Upload scraped venues to DB — 4 photos per venue, full resolution
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

function fixPhotoUrl(url) {
  if (!url) return null;
  // Replace tiny size params with full resolution
  return url
    .replace(/=w\d+-h\d+-[a-z-]+/g, '=w1200-h800-k-no')
    .replace(/=w\d+-h\d+/g, '=w1200-h800')
    .replace(/=s\d+/g, '=s1200');
}

const results = JSON.parse(readFileSync(resolve(import.meta.dirname, 'scrape_results.json'), 'utf8'));
console.log(`Uploading ${results.length} venues × 4 photos = ${results.length * 4} rows...\n`);

let saved = 0, failed = 0;

// Batch insert for speed
const allRows = [];

for (const venue of results) {
  const photos = (venue.photo_urls || []).slice(0, 4).map(fixPhotoUrl).filter(Boolean);
  
  if (photos.length === 0) continue;

  // First row — main venue entry with full metadata
  allRows.push({
    destination: 'rotterdam',
    name: venue.name,
    type: 'venue',
    url: photos[0],
    thumb_url: photos[0],
    source: 'google_places',
    media_type: 'photo',
    sort_order: 0,
    metadata: {
      rating: venue.rating,
      review_count: venue.review_count,
      address: venue.address,
      category_text: venue.category_text,
      lat: venue.lat,
      lng: venue.lng,
      photos: photos,
      search_name: venue.search_name,
    }
  });

  // Additional photo rows (photo_index 1, 2, 3)
  for (let i = 1; i < photos.length; i++) {
    allRows.push({
      destination: 'rotterdam',
      name: venue.name,
      type: 'venue',
      url: photos[i],
      thumb_url: photos[i],
      source: 'google_places',
      media_type: 'photo',
      sort_order: i,
      metadata: { photo_index: i }
    });
  }
}

console.log(`Total rows to insert: ${allRows.length}`);

// Insert in batches of 50
const BATCH_SIZE = 50;
for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
  const batch = allRows.slice(i, i + BATCH_SIZE);
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/destination_media`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(batch)
  });

  if (res.ok) {
    saved += batch.length;
  } else {
    const err = await res.text();
    console.error(`Batch ${i}-${i+BATCH_SIZE} failed:`, res.status, err.slice(0, 200));
    failed += batch.length;
  }
}

console.log(`\n✅ Done! Saved: ${saved}, Failed: ${failed}`);

// Verify
const check = await fetch(`${SUPABASE_URL}/rest/v1/destination_media?destination=eq.rotterdam&type=eq.venue&select=name&limit=1`, {
  headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY, 'Prefer': 'count=exact', 'Range': '0-0' }
});
console.log(`DB total rows: ${check.headers.get('content-range')}`);
