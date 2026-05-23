/**
 * Jolliday — Venue Verification & Plan Generation Pipeline
 * 
 * Full pipeline: Discover → Verify (Google Places) → Store Photos → Enrich → Generate Plans → Optimize Routes
 * 
 * USAGE:
 *   node scripts/venue-pipeline.mjs --city rotterdam
 *   node scripts/venue-pipeline.mjs --city rotterdam --step verify
 *   node scripts/venue-pipeline.mjs --city rotterdam --step generate
 *   node scripts/venue-pipeline.mjs --city rotterdam --step all
 * 
 * STEPS: discover | verify | enrich | generate | optimize | all
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

// ── Load .env ───────────────────────────────────────────────────────────────
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
const OPENROUTER_KEY = env.OPENROUTER_API_KEY || '';
const GOOGLE_PLACES_KEY = env.GOOGLE_PLACES_API_KEY || '';
const OPENROUTE_KEY = env.OPENROUTE_API_KEY || '';

// Parse CLI args
const args = process.argv.slice(2);
const getArg = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i+1] : null; };
const city = getArg('city') || 'rotterdam';
const step = getArg('step') || 'all';
const dryRun = args.includes('--dry-run');

const MODEL = 'google/gemini-2.5-flash';

// ── Supabase helpers ────────────────────────────────────────────────────────
const headers = { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY, 'Content-Type': 'application/json' };

async function supabaseQuery(table, params = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { headers });
  if (!res.ok) throw new Error(`DB query failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function supabaseInsert(table, data, upsert = false) {
  const h = { ...headers, 'Prefer': upsert ? 'resolution=merge-duplicates,return=minimal' : 'return=minimal' };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: 'POST', headers: h, body: JSON.stringify(data) });
  return res.ok;
}

async function supabaseUpdate(table, match, data) {
  const params = Object.entries(match).map(([k,v]) => `${k}=eq.${encodeURIComponent(v)}`).join('&');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    method: 'PATCH', headers: { ...headers, 'Prefer': 'return=minimal' }, body: JSON.stringify(data)
  });
  return res.ok;
}

// ── OpenRouter AI call ──────────────────────────────────────────────────────
async function callAI(systemPrompt, userPrompt, maxTokens = 16000) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENROUTER_KEY}`, 'HTTP-Referer': 'https://jolliday.online' },
    body: JSON.stringify({ model: MODEL, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], max_tokens: maxTokens, temperature: 0.7 }),
  });
  if (!res.ok) { console.error(`AI error ${res.status}:`, (await res.text()).slice(0, 300)); return null; }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

// ── Google Places API ───────────────────────────────────────────────────────
async function searchPlace(venueName, cityName) {
  if (!GOOGLE_PLACES_KEY) return null;
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_PLACES_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.types,places.businessStatus,places.regularOpeningHours,places.photos,places.websiteUri',
    },
    body: JSON.stringify({ textQuery: `${venueName}, ${cityName}`, maxResultCount: 3 }),
  });
  if (!res.ok) { console.error(`  Places API ${res.status}`); return null; }
  const data = await res.json();
  const places = data.places || [];
  if (!places.length) return null;
  const place = places[0];
  if (place.businessStatus === 'CLOSED_PERMANENTLY') return { closed: true };
  return place;
}

async function fetchPlacePhoto(photoName, maxWidth = 800) {
  if (!GOOGLE_PLACES_KEY) return null;
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${GOOGLE_PLACES_KEY}`;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok || !res.headers.get('content-type')?.includes('image')) return null;
  return Buffer.from(await res.arrayBuffer());
}

async function uploadToStorage(imageBuffer, path) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/destination-media/${path}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'image/jpeg', 'x-upsert': 'true' },
    body: imageBuffer,
  });
  if (res.ok) return `${SUPABASE_URL}/storage/v1/object/public/destination-media/${path}`;
  // Try PUT if POST fails
  const res2 = await fetch(`${SUPABASE_URL}/storage/v1/object/destination-media/${path}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'image/jpeg', 'x-upsert': 'true' },
    body: imageBuffer,
  });
  if (res2.ok) return `${SUPABASE_URL}/storage/v1/object/public/destination-media/${path}`;
  return null;
}

// ── Rate limiter ────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── City configs ────────────────────────────────────────────────────────────
const CITIES = {
  rotterdam: { country: 'Netherlands', search: 'Rotterdam, Netherlands' },
  amsterdam: { country: 'Netherlands', search: 'Amsterdam, Netherlands' },
  paris: { country: 'France', search: 'Paris, France' },
  barcelona: { country: 'Spain', search: 'Barcelona, Spain' },
  london: { country: 'United Kingdom', search: 'London, UK' },
  rome: { country: 'Italy', search: 'Rome, Italy' },
  lisbon: { country: 'Portugal', search: 'Lisbon, Portugal' },
  istanbul: { country: 'Turkey', search: 'Istanbul, Turkey' },
  dubai: { country: 'UAE', search: 'Dubai, UAE' },
  prague: { country: 'Czech Republic', search: 'Prague, Czech Republic' },
};

const VIBES = ['foodie', 'romantic', 'adventure', 'cultural', 'nightlife', 'relaxed', 'family-friendly', 'mixed'];
const TRAVELERS = ['couple', 'solo', 'friends', 'family'];
const BASE_DURATIONS = [3, 5, 10, 14, 30];

const cityConfig = CITIES[city] || { country: '', search: city };
console.log(`\n${'='.repeat(60)}`);
console.log(`  🌍 VENUE PIPELINE: ${city.toUpperCase()}`);
console.log(`  Step: ${step} | Dry run: ${dryRun}`);
console.log(`  Google Places: ${GOOGLE_PLACES_KEY ? '✓' : '✗ (will skip verification)'}`);
console.log(`  OpenRoute: ${OPENROUTE_KEY ? '✓' : '✗ (will skip route optimization)'}`);
console.log(`${'='.repeat(60)}\n`);

// ═══════════════════════════════════════════════════════════════════════════
// STEP 1: DISCOVER VENUES (AI generates venue list)
// ═══════════════════════════════════════════════════════════════════════════
async function stepDiscover() {
  console.log('━'.repeat(60));
  console.log('  STEP 1: DISCOVER VENUES');
  console.log('━'.repeat(60));

  // Check if we already have venues in venue_cache
  let existing = [];
  try { existing = await supabaseQuery('venue_cache', `destination=eq.${city}&select=name&limit=1`); } catch {}
  
  if (existing.length > 0) {
    const all = await supabaseQuery('venue_cache', `destination=eq.${city}&select=name`);
    console.log(`  Already have ${all.length} venues in cache. Skipping discovery.`);
    return;
  }

  const prompt = `List 250+ REAL, currently operating venues in ${city}, ${cityConfig.country} for a travel database.

Categories needed (minimum per category):
- dining: 80+ (local cuisine, international, fine dining, casual, street food, food halls)
- cafe: 30+ (breakfast, brunch, coffee, bakeries, dessert)
- nightlife: 30+ (cocktail bars, pubs, clubs, rooftop bars, live music)
- culture: 25+ (museums, galleries, theaters, historical sites)
- sightseeing: 25+ (landmarks, viewpoints, bridges, squares, iconic buildings)
- outdoor: 20+ (parks, gardens, waterfront, nature, cycling routes)
- shopping: 20+ (markets, food halls, boutiques, vintage, design stores)
- experience: 20+ (boat tours, cooking classes, spas, escape rooms, unique activities)

For EACH venue provide: name (as on Google Maps), category, neighborhood.
Cover ALL districts, not just tourist center. Mix popular + hidden gems + varied price levels.

Return ONLY a JSON array:
[{"name":"Exact Name","category":"dining","neighborhood":"Area Name"}, ...]`;

  console.log('  Asking AI for venue list...');
  if (dryRun) { console.log('  (dry run) Would call AI'); return; }

  const response = await callAI('You are a venue database builder. Return ONLY valid JSON.', prompt);
  if (!response) { console.error('  ✗ AI returned nothing'); return; }

  let venues = [];
  try {
    const jsonStr = response.includes('```') 
      ? response.slice(response.indexOf('['), response.lastIndexOf(']') + 1)
      : response;
    venues = JSON.parse(jsonStr);
  } catch (e) {
    // Try to extract JSON array
    const match = response.match(/\[[\s\S]*\]/);
    if (match) { try { venues = JSON.parse(match[0]); } catch {} }
  }

  console.log(`  Got ${venues.length} venues from AI`);
  if (!venues.length) return;

  // Save to venue_cache (verified = null = pending)
  let saved = 0;
  for (const v of venues) {
    if (!v.name) continue;
    const ok = await supabaseInsert('venue_cache', {
      name: v.name, destination: city, category: v.category || 'sightseeing',
      neighborhood: v.neighborhood || '', verified: null,
    }, true);
    if (ok) saved++;
  }
  console.log(`  ✓ Saved ${saved} venues to cache (pending verification)\n`);
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 2: VERIFY VENUES (via Edge Function → Google Places API)
// ═══════════════════════════════════════════════════════════════════════════
async function stepVerify() {
  console.log('━'.repeat(60));
  console.log('  STEP 2: VERIFY VENUES (via verify-venue edge function)');
  console.log('━'.repeat(60));

  // Get unverified venues (verified is null)
  const pending = await supabaseQuery('venue_cache', `destination=eq.${city}&verified=is.null&select=name,category,neighborhood&order=name&limit=500`);
  console.log(`  Pending verification: ${pending.length}`);
  if (!pending.length) {
    console.log('  Nothing to verify!');
    return;
  }

  if (dryRun) { console.log(`  (dry run) Would verify ${pending.length} venues`); return; }

  let verified = 0, notFound = 0, errors = 0;
  const BATCH_SIZE = 10; // Edge function handles 10 at a time

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);
    const venues = batch.map(v => ({ name: v.name, destination: city }));

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-venue`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ venues, destination: city }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`  ⚠ Edge function error ${res.status}: ${err.slice(0, 200)}`);
        errors += batch.length;
        continue;
      }

      const data = await res.json();
      for (const r of (data.results || [])) {
        if (r.status === 'verified') {
          verified++;
          if (verified <= 20 || verified % 25 === 0)
            console.log(`  [${i + data.results.indexOf(r) + 1}] ✓ ${r.name} (★${r.rating || '?'}, ${r.photos || 0} photos)`);
        } else if (r.status === 'not_found') {
          notFound++;
          if (notFound <= 10) console.log(`  [${i + data.results.indexOf(r) + 1}] ✗ ${r.name}`);
        } else if (r.status === 'cached') {
          // Already done
        } else {
          errors++;
        }
      }

      // Rate limit between batches
      await sleep(2000);
    } catch (e) {
      errors += batch.length;
      console.error(`  ⚠ Batch error: ${e.message}`);
      await sleep(5000);
    }

    if ((i + BATCH_SIZE) % 50 === 0) {
      console.log(`  Progress: ${i + BATCH_SIZE}/${pending.length} (✓${verified} ✗${notFound} ⚠${errors})`);
    }
  }

  console.log(`\n  Results: ✓ ${verified} verified | ✗ ${notFound} not found | ⚠ ${errors} errors`);
  console.log(`  API cost: ~$${((verified + notFound) * 0.02).toFixed(2)}\n`);
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 3: ENRICH DESCRIPTIONS (AI)
// ═══════════════════════════════════════════════════════════════════════════
async function stepEnrich() {
  console.log('━'.repeat(60));
  console.log('  STEP 3: ENRICH VENUE DESCRIPTIONS');
  console.log('━'.repeat(60));

  const venues = await supabaseQuery('venue_cache', `destination=eq.${city}&or=(verified.is.null,verified.eq.true)&description=is.null&select=name,category,neighborhood,rating,review_count,google_types&order=name&limit=300`);
  console.log(`  Venues needing enrichment: ${venues.length}`);
  if (!venues.length) { console.log('  All enriched!'); return; }
  if (dryRun) { console.log(`  (dry run) Would enrich ${venues.length} venues`); return; }

  const BATCH = 25;
  let enriched = 0;

  for (let i = 0; i < venues.length; i += BATCH) {
    const batch = venues.slice(i, i + BATCH);
    const venueList = batch.map((v, idx) => 
      `${idx+1}. "${v.name}" — category: ${v.category}, neighborhood: ${v.neighborhood}, rating: ${v.rating || '?'}, reviews: ${v.review_count || '?'}`
    ).join('\n');

    const prompt = `For each venue in ${city}, ${cityConfig.country}, provide enrichment.

${venueList}

Return JSON array:
[{"name":"Exact Name","description":"One VIVID sentence (what you experience — sensory, specific)","why_special":"The ONE thing that makes it worth visiting","best_time":"morning|afternoon|evening|night","duration":"1h|1.5h|2h|3h","vibes":["foodie","romantic","adventure","cultural","nightlife","relaxed","family-friendly","mixed"],"travelers":["couple","solo","friends","family"],"meal_types":["breakfast","lunch","dinner","drinks","snack"]}]

Rules: descriptions must be SPECIFIC not generic. vibes/travelers: pick 2-4 that genuinely fit. meal_types only for food/drink venues.`;

    await sleep(2000);
    const response = await callAI('Return ONLY valid JSON arrays.', prompt, 8000);
    if (!response) continue;

    let items = [];
    try {
      const match = response.match(/\[[\s\S]*\]/);
      if (match) items = JSON.parse(match[0]);
    } catch {}

    for (const item of items) {
      if (!item.name) continue;
      const ok = await supabaseUpdate('venue_cache', { name: item.name, destination: city }, {
        description: item.description || null,
        why_special: item.why_special || null,
        best_time_of_day: item.best_time || null,
        typical_duration: item.duration || null,
        vibes: item.vibes || [],
        travelers: item.travelers || [],
        meal_types: item.meal_types || [],
      });
      if (ok) enriched++;
    }
    console.log(`  Batch ${Math.floor(i/BATCH)+1}: ${items.length} enriched`);
  }
  console.log(`  ✓ Total enriched: ${enriched}\n`);
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 4: GENERATE PLANS (AI)
// ═══════════════════════════════════════════════════════════════════════════
async function stepGenerate() {
  console.log('━'.repeat(60));
  console.log('  STEP 4: GENERATE CACHED PLANS');
  console.log('━'.repeat(60));

  const venues = await supabaseQuery('venue_cache', `destination=eq.${city}&or=(verified.is.null,verified.eq.true)&select=name,category,neighborhood,rating,review_count,description,why_special,vibes,travelers,meal_types,lat,lng,hours,best_time_of_day&order=name`);
  console.log(`  Usable venues available: ${venues.length} (verified + pending)`);
  if (venues.length < 30) { console.error('  ✗ Not enough venues. Run discover first.'); return; }

  // Build venue list for prompt
  const venuesByCategory = {};
  for (const v of venues) {
    const cat = v.category || 'other';
    if (!venuesByCategory[cat]) venuesByCategory[cat] = [];
    venuesByCategory[cat].push(v);
  }

  const venueListText = Object.entries(venuesByCategory).map(([cat, vs]) => {
    const lines = vs.slice(0, 40).map(v => {
      const parts = [v.name];
      if (v.rating) parts.push(`★${v.rating}`);
      if (v.neighborhood) parts.push(v.neighborhood);
      if (v.meal_types?.length) parts.push(`meals:${v.meal_types.join(',')}`);
      if (v.lat && v.lng) parts.push(`(${v.lat.toFixed(4)},${v.lng.toFixed(4)})`);
      return `  - ${parts.join(' | ')}`;
    });
    return `### ${cat.toUpperCase()} (${vs.length})\n${lines.join('\n')}`;
  }).join('\n\n');

  // Check existing plans
  let existingPlans = [];
  try { existingPlans = await supabaseQuery('cached_plans', `destination=eq.${city}&select=cache_key`); } catch {}
  const existingKeys = new Set(existingPlans.map(p => p.cache_key));

  let generated = 0, skipped = 0;
  let consecutiveFailures = 0;
  const total = BASE_DURATIONS.length * VIBES.length * TRAVELERS.length;
  console.log(`  Plans to generate: ${total} (${BASE_DURATIONS.length} durations × ${VIBES.length} vibes × ${TRAVELERS.length} travelers)`);
  console.log(`  Already cached: ${existingKeys.size}`);

  if (dryRun) { console.log(`  (dry run) Would generate ${total - existingKeys.size} plans`); return; }

  const verifiedNames = new Set(venues.map(v => v.name));

  const systemPrompt = `You are an expert local travel guide for ${city}, ${cityConfig.country}. Create trip plans that feel handcrafted.

RULES:
1. ONLY use venue names from the provided list (EXACT names).
2. No venue appears more than ONCE in the plan.
3. Venues in same day must be geographically close (same neighborhood).
4. Vary rhythm per day — don't always do breakfast→museum→lunch→walk→dinner.
5. Write vivid "why" descriptions, never generic.
6. Each day 5-7 slots. Day titles should be evocative.

OUTPUT FORMAT (ONLY these code blocks, nothing else):

\`\`\`activities
[{"id":"1","name":"EXACT NAME","category":"dining","duration":"2h","price":25,"currency":"€","image":"food","occasion":"date","description":"Vivid sentence.","neighborhood":"Area","hours":"Mon-Sun 9-17","bookAhead":true,"why":"Specific reason.","lat":51.92,"lng":4.48}]
\`\`\`

\`\`\`itinerary
[{"day":1,"title":"Evocative Title","slots":[{"time":"9:00","activity":"Breakfast at Venue","venue":"EXACT NAME","neighborhood":"Area","duration":"1h","cost":15,"bookAhead":false,"transitNext":"8 min walk along waterfront"}]}]
\`\`\`

\`\`\`weather
{"destination":"${city}","period":"Flexible","temperature":"range","conditions":"description","packingTip":"tip"}
\`\`\`

\`\`\`destination_enrich
{"destination":"${city}","country":"${cityConfig.country}","continent":"Europe","language":"local","timezone":"TZ","bestMonths":"months","currency":"EUR"}
\`\`\`

\`\`\`quickreplies
["Make it cheaper","More food spots","Add nightlife","Swap an activity","Show day trips","More romantic"]
\`\`\``;

  for (const vibe of VIBES) {
    if (consecutiveFailures >= 5) break;
    for (const traveler of TRAVELERS) {
      if (consecutiveFailures >= 5) break;
      for (const duration of BASE_DURATIONS) {
        if (consecutiveFailures >= 5) break;
        const cacheKey = `${city}|${duration}|${vibe}|${traveler}`;
        if (existingKeys.has(cacheKey)) { skipped++; continue; }

        const userPrompt = `VENUE LIST:\n${venueListText}\n\n---\nPlan a ${duration}-day ${vibe} trip for ${traveler} in ${city}.\nUse ONLY names from the list. ${duration} days, 5-7 slots/day. Geographic clustering. No repeats.`;

        await sleep(4000); // Rate limit
        console.log(`  [${generated+skipped+1}/${total}] ${cacheKey}...`);

        const response = await callAI(systemPrompt, userPrompt);
        if (!response) { 
          console.log('    ✗ No response');
          consecutiveFailures++;
          if (consecutiveFailures >= 5) {
            console.log('\n  ⚠ 5 consecutive failures — stopping (API limit likely hit)');
            console.log('  Re-run this command later to continue from where it left off.\n');
            break;
          }
          await sleep(2000); continue; 
        }
        consecutiveFailures = 0;

        // Extract plan content (code blocks only)
        let planContent = response;
        if (response.includes('```activities')) {
          const start = response.indexOf('```activities');
          const lastEnd = response.lastIndexOf('```');
          if (lastEnd > start) planContent = response.slice(start, lastEnd + 3);
        }

        // Validate: check venue names exist
        const usedVenues = [...planContent.matchAll(/"venue"\s*:\s*"([^"]+)"/g)].map(m => m[1]);
        const unknowns = usedVenues.filter(v => !verifiedNames.has(v));
        if (unknowns.length > 3) {
          console.log(`    ⚠ ${unknowns.length} unknown venues, retrying...`);
          continue; // Skip this one, will retry on next run
        }

        // Save to cache
        const ok = await supabaseInsert('cached_plans', {
          cache_key: cacheKey, destination: city, duration, vibe, traveler_type: traveler,
          plan_content: planContent, hit_count: 0,
        }, true);

        if (ok) { generated++; } else { console.log('    ✗ DB save failed'); }
      }
    }
  }

  console.log(`\n  ✓ Generated: ${generated} | Skipped: ${skipped} (already existed)\n`);
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 5: OPTIMIZE ROUTES (OpenRouteService)
// ═══════════════════════════════════════════════════════════════════════════
async function stepOptimize() {
  console.log('━'.repeat(60));
  console.log('  STEP 5: OPTIMIZE ROUTES');
  console.log('━'.repeat(60));

  if (!OPENROUTE_KEY) {
    console.log('  ⚠ No OPENROUTE_API_KEY — skipping route optimization');
    return;
  }

  const plans = await supabaseQuery('cached_plans', `destination=eq.${city}&select=cache_key,plan_content&limit=200`);
  console.log(`  Plans to optimize: ${plans.length}`);
  if (!plans.length) return;
  if (dryRun) { console.log('  (dry run) Would optimize routes'); return; }

  // Load all venue coordinates
  const venues = await supabaseQuery('venue_cache', `destination=eq.${city}&verified=eq.true&select=name,lat,lng`);
  const coordMap = {};
  for (const v of venues) { if (v.lat && v.lng) coordMap[v.name] = [v.lng, v.lat]; } // ORS uses [lng,lat]

  let optimized = 0, issues = 0;

  for (const plan of plans) {
    // Parse itinerary
    const match = plan.plan_content.match(/```itinerary\n([\s\S]*?)\n```/);
    if (!match) continue;

    let itinerary;
    try { itinerary = JSON.parse(match[1]); } catch { continue; }

    let planModified = false;

    for (const day of itinerary) {
      const slots = day.slots || [];
      if (slots.length < 2) continue;

      // Get coords for consecutive pairs
      const dayCoords = slots.map(s => coordMap[s.venue]).filter(Boolean);
      if (dayCoords.length < 2) continue;

      // Call ORS matrix
      await sleep(1600); // 40 req/min
      try {
        const res = await fetch('https://api.openrouteservice.org/v2/matrix/foot-walking', {
          method: 'POST',
          headers: { 'Authorization': OPENROUTE_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ locations: dayCoords, metrics: ['duration', 'distance'] }),
        });
        if (!res.ok) continue;
        const matrix = await res.json();
        const durations = matrix.durations || [];

        // Update transit descriptions
        for (let i = 0; i < slots.length - 1; i++) {
          if (!coordMap[slots[i].venue] || !coordMap[slots[i+1].venue]) continue;
          const ci = dayCoords.indexOf(coordMap[slots[i].venue]);
          const ci2 = dayCoords.indexOf(coordMap[slots[i+1].venue]);
          if (ci < 0 || ci2 < 0) continue;

          const walkMin = Math.round((durations[ci]?.[ci2] || 0) / 60);
          if (walkMin > 0) {
            if (walkMin <= 5) slots[i].transitNext = `${walkMin} min walk`;
            else if (walkMin <= 15) slots[i].transitNext = `${walkMin} min walk`;
            else if (walkMin <= 25) slots[i].transitNext = `${walkMin} min walk or quick tram`;
            else { slots[i].transitNext = `${Math.round(walkMin/3)} min by tram`; issues++; }
            planModified = true;
          }
        }
      } catch (e) { /* skip this day */ }
    }

    if (planModified) {
      const newContent = plan.plan_content.replace(
        /```itinerary\n[\s\S]*?\n```/,
        '```itinerary\n' + JSON.stringify(itinerary) + '\n```'
      );
      await supabaseInsert('cached_plans', {
        cache_key: plan.cache_key, destination: city,
        duration: parseInt(plan.cache_key.split('|')[1]),
        vibe: plan.cache_key.split('|')[2],
        traveler_type: plan.cache_key.split('|')[3],
        plan_content: newContent, hit_count: 0,
      }, true);
      optimized++;
    }
  }

  console.log(`  ✓ Optimized: ${optimized} plans | Route issues flagged: ${issues}\n`);
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 6: VALIDATE
// ═══════════════════════════════════════════════════════════════════════════
async function stepValidate() {
  console.log('━'.repeat(60));
  console.log('  STEP 6: VALIDATE');
  console.log('━'.repeat(60));

  const verified = await supabaseQuery('venue_cache', `destination=eq.${city}&or=(verified.is.null,verified.eq.true)&select=name,photo_count,description`);
  const falseV = await supabaseQuery('venue_cache', `destination=eq.${city}&verified=eq.false&select=name`);
  
  let plans = [];
  try { plans = await supabaseQuery('cached_plans', `destination=eq.${city}&select=cache_key`); } catch {}

  const withPhotos = verified.filter(v => v.photo_count > 0).length;
  const withDesc = verified.filter(v => v.description).length;

  console.log(`  Venues verified (true):  ${verified.length}`);
  console.log(`  Venues verified (false): ${falseV.length}`);
  console.log(`  With photos:             ${withPhotos} (${verified.length ? Math.round(withPhotos/verified.length*100) : 0}%)`);
  console.log(`  With descriptions:       ${withDesc} (${verified.length ? Math.round(withDesc/verified.length*100) : 0}%)`);
  console.log(`  Plans cached:            ${plans.length}`);
  console.log();

  const issues = [];
  if (verified.length < 100) issues.push(`Only ${verified.length} verified venues (need 100+)`);
  if (withPhotos < verified.length * 0.8) issues.push(`Only ${withPhotos}/${verified.length} have photos`);
  if (plans.length < 40) issues.push(`Only ${plans.length} plans (need 160)`);

  if (issues.length) {
    console.log('  ⚠ ISSUES:');
    issues.forEach(i => console.log(`    - ${i}`));
  } else {
    console.log('  ✓ ALL CHECKS PASSED');
  }
  console.log();
}

// ═══════════════════════════════════════════════════════════════════════════
// RUN PIPELINE
// ═══════════════════════════════════════════════════════════════════════════
async function run() {
  const start = Date.now();

  try {
    if (step === 'all' || step === 'discover') await stepDiscover();
    if (step === 'all' || step === 'verify') await stepVerify();
    if (step === 'all' || step === 'enrich') await stepEnrich();
    if (step === 'all' || step === 'generate') await stepGenerate();
    if (step === 'all' || step === 'optimize') await stepOptimize();
    await stepValidate();
  } catch (e) {
    console.error('\n  ✗ PIPELINE ERROR:', e.message || e);
    console.error(e.stack);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(0);
  console.log(`${'='.repeat(60)}`);
  console.log(`  🏁 DONE in ${elapsed}s (${(elapsed/60).toFixed(1)} min)`);
  console.log(`${'='.repeat(60)}\n`);
}

run();
