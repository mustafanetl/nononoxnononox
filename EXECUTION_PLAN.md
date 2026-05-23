# Jolliday — Full Execution Plan: Venue Verification System

## Overview

Build a complete venue verification pipeline that:
- Verifies venues via Google Places API (one-time per venue)
- Downloads 4 photos per venue to Supabase Storage
- Validates routes via OpenRouteService (free)
- Generates perfect plans via Gemini 2.5 Flash (verified venues only)
- Serves everything from cache ($0/user)

---

## WAVE 1: Foundation (Infrastructure & Database)
**Goal:** Set up the database, API keys, and shared utilities.

### Task 1.1: Create `venue_cache` table in Supabase
```sql
-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS venue_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  destination TEXT NOT NULL,
  google_place_id TEXT,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
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

CREATE INDEX IF NOT EXISTS idx_vc_destination ON venue_cache(destination);
CREATE INDEX IF NOT EXISTS idx_vc_verified ON venue_cache(destination, verified);
CREATE INDEX IF NOT EXISTS idx_vc_category ON venue_cache(destination, category);
CREATE INDEX IF NOT EXISTS idx_vc_place_id ON venue_cache(google_place_id) WHERE google_place_id IS NOT NULL;
```

**Test:** Query the table exists and accepts inserts.

### Task 1.2: Get API Keys
- [ ] Google Places API key (enable "Places API (New)" in Google Cloud Console)
- [ ] OpenRouteService API key (free at openrouteservice.org/dev/#/signup)
- [ ] Gemini API key (Google AI Studio — ai.google.dev) OR use existing OpenRouter key

### Task 1.3: Add keys to `.env`
```env
GOOGLE_PLACES_API_KEY=AIza...
OPENROUTE_API_KEY=5b3ce...
GEMINI_API_KEY=...
```

### Task 1.4: Create `scripts/config.py` — Shared configuration
```python
# All constants, API setup, DB connection helpers
# - Load .env
# - Supabase client setup
# - API key validation
# - City configs (coordinates, bounding boxes)
# - Category mappings
```

**Test:** `python scripts/config.py` prints all keys loaded (masked).

### Task 1.5: Create `scripts/venue_cache_utils.py` — Database utilities
```python
# - get_venue(name, city) → dict | None
# - save_venue(data) → bool
# - mark_venue_false(name, city) → bool
# - get_unverified_venues(city) → list
# - get_verified_venues(city, category=None) → list
# - upload_photo(image_bytes, city, place_id, index) → url
# - get_venue_stats(city) → dict (counts by category, verified/false)
```

**Test:** Insert a test venue, query it, delete it.

---

## WAVE 2: Venue Verification (Google Places API)
**Goal:** Verify every venue name is real, get data + 4 photos, save to server.

### Task 2.1: Create `scripts/verify_venues.py`
```
INPUTS:
  --city rotterdam
  --names "Venue1,Venue2"  (optional: specific venues)
  --from-db                (verify all existing destination_media venues)
  --batch-size 50          (how many per run)
  --dry-run                (show what would be verified without API calls)

LOGIC:
  1. Build venue list (from args or from destination_media table)
  2. For each venue:
     a. Check venue_cache → already verified? Skip.
     b. Check venue_cache → verified=false? Skip.
     c. Call Google Places Text Search: "{name}, {city}, {country}"
     d. If 0 results OR permanently_closed:
        → save_venue({name, destination, verified: false})
        → log: "✗ NOT FOUND: {name}"
     e. If result found:
        → Call Place Details (get hours, phone, website, reviews)
        → Call Place Photos (up to 4, maxWidthPx=800)
        → Upload each photo to Supabase Storage
        → save_venue({...all data..., verified: true, photos: [urls]})
        → log: "✓ VERIFIED: {name} (★{rating}, {review_count} reviews, {photo_count} photos)"
  3. Rate limit: max 10/sec (Google's QPS limit)
  4. Summary: "Verified: X, Failed: Y, Skipped: Z, Total cost: ~$X.XX"

ERROR HANDLING:
  - API quota exceeded → save progress, print resume command
  - Network error → retry 3x with exponential backoff
  - Photo download fails → try next photo reference, min 1 photo required
  - Ambiguous results → pick highest-rated result with matching name
```

**Test 2.1a:** Verify 3 known Rotterdam venues (Fenix Food Factory, Hotel New York, Markthal)
- Expected: All 3 verified=true, 4 photos each stored in Supabase

**Test 2.1b:** Verify 2 fake venue names ("Fake Restaurant XYZ", "Nonexistent Cafe 123")
- Expected: Both marked verified=false, no photos, no API retries on re-run

**Test 2.1c:** Re-run same venues — confirm 0 API calls (all cached)

### Task 2.2: Migrate existing venues
```
SCRIPT: python scripts/verify_venues.py --city rotterdam --from-db

Takes all 335 venues from destination_media table,
verifies each via Google Places API,
builds the complete venue_cache for Rotterdam.

Expected: ~300 verified true, ~35 verified false (closed/renamed)
Cost: ~$7 for 335 text searches + 300 photo fetches
Time: ~5 minutes (rate limited)
```

**Test:** After migration, verify:
- `SELECT count(*) FROM venue_cache WHERE destination='rotterdam' AND verified=true` → ~300
- `SELECT count(*) FROM venue_cache WHERE destination='rotterdam' AND verified=false` → ~35
- Spot-check 5 random venues → photos accessible via Supabase Storage URL

---

## WAVE 3: Route Optimization (OpenRouteService)
**Goal:** Validate that each day's venues are geographically sensible.

### Task 3.1: Create `scripts/optimize_routes.py`
```
INPUTS:
  --city rotterdam
  --plan "rotterdam|5|foodie|couple"  (optional: specific plan)
  --max-walking-minutes 25            (flag if exceeded)
  --fix                               (auto-reorder venues)

LOGIC:
  1. Load plan(s) from cached_plans table
  2. Parse itinerary JSON → extract venue names per day
  3. Look up lat/lng from venue_cache
  4. For each day:
     a. Build coordinate pairs for consecutive venues
     b. Call ORS Matrix API (profile: foot-walking)
     c. Get walking duration between each pair
     d. If any pair > max_walking_minutes:
        - Try all permutations of that day's venues
        - Pick order with lowest max transit time
        - If still > max → flag for manual review
     e. Replace generic "8 min walk" with actual time
     f. Add transit description: "Walk south along Maas river" or "Take metro line D"
  5. Save optimized plan back to cached_plans

ORS API CALLS:
  - Matrix endpoint: POST /v2/matrix/foot-walking
  - Body: {"locations": [[lng,lat], [lng,lat], ...], "metrics": ["duration","distance"]}
  - Returns: duration matrix in seconds

RATE LIMIT: 40 req/min (free tier)
```

**Test 3.1a:** Take a known plan, manually put a venue from Rotterdam Noord between two Kop van Zuid venues → run optimizer → confirm it gets reordered.

**Test 3.1b:** Verify output has real walking times (not "8 min walk" everywhere).

### Task 3.2: Create route validation report
```
OUTPUT: scripts/route_report_{city}.json
{
  "city": "rotterdam",
  "plans_checked": 160,
  "plans_with_issues": 12,
  "issues": [
    {"plan": "rotterdam|5|adventure|friends", "day": 3, "problem": "Hotel New York → Kralingse Bos = 45min walk", "suggestion": "swap order or replace"}
  ]
}
```

**Test:** Report generates, all flagged issues are real problems.

---

## WAVE 4: AI Plan Generation (Gemini 2.5 Flash)
**Goal:** Generate 160 high-quality plans using only verified venues.

### Task 4.1: Create `scripts/generate_plans_ai.py`
```
INPUTS:
  --city rotterdam
  --vibe foodie           (optional: specific vibe)
  --traveler couple       (optional: specific traveler)
  --duration 5            (optional: specific duration)
  --model gemini-2.5-flash  (or gemini-2.5-pro for premium)
  --dry-run               (show prompt, don't call API)

LOGIC:
  1. Fetch all verified venues from venue_cache (with full metadata)
  2. Group venues by: category, neighborhood, meal_type, vibes, travelers
  3. Build geographic clusters (venues within 1km of each other)
  4. For each combo (vibe × traveler × base_duration):
     a. Build system prompt:
        - Role: "Expert local travel guide for {city}"
        - Constraints: ONLY use venues from provided list (exact names)
        - Format: exact JSON structure the frontend expects
        - Style guide: vivid descriptions, local knowledge, geographic flow
     b. Build user prompt:
        - Full venue list with: name, category, neighborhood, rating, hours, lat/lng, description
        - Geographic clusters pre-calculated
        - Specific instructions for this vibe×traveler combo
        - "Plan a {duration}-day {vibe} trip for a {traveler} in {city}"
     c. Call Gemini 2.5 Flash (JSON mode, temperature=0.7)
     d. Parse response:
        - Validate ALL venue names exist in venue_cache (verified=true)
        - If any missing → retry with correction: "These venues don't exist: X, Y. Replace them."
        - Validate JSON structure matches frontend expectations
     e. Save to cached_plans table
  5. Progress tracking: save state after each plan (resume on failure)

GENERATION ORDER (5 base durations):
  3-day  → "Must-see highlights"
  5-day  → "Sweet spot, most requested"
  10-day → "Deep exploration"
  14-day → "Two weeks, full coverage"
  30-day → "Month stay, living like a local"

COMPOSITING LOGIC:
  - Days 1-3 in all plans share NO venues with days 4-5
  - Days 4-5 share NO venues with days 6-10
  - etc. (so composite plans never duplicate)

PROMPT ENGINEERING:
  - Include 3 example days in prompt (showing expected quality)
  - Emphasize: geographic clustering, vivid descriptions, varied rhythm
  - Anti-patterns: "DO NOT put venues from different neighborhoods in same morning"
  - Vibe-specific hints:
    - foodie: "Every meal is a destination, not just fuel"
    - romantic: "Sunset timing matters, end days with views"
    - adventure: "Physical activities in morning when energy is high"
    - nightlife: "Mornings start late (11am), evenings are the main event"
```

**Test 4.1a:** Generate `rotterdam|5|foodie|couple` → verify:
- All venue names exist in venue_cache
- No venue repeated across days
- Geographic clustering makes sense (check lat/lng proximity within each day)
- JSON parses correctly for frontend

**Test 4.1b:** Generate with an intentionally bad venue → confirm retry catches it.

**Test 4.1c:** Full generation run for one vibe (8 plans: 4 travelers × 2 durations) → verify quality.

### Task 4.2: Create `scripts/enrich_venues_ai.py`
```
INPUTS:
  --city rotterdam
  --batch-size 20
  --only-missing    (only venues without description)

LOGIC:
  1. Fetch verified venues lacking description/why_special
  2. Batch 20 venues per API call
  3. Prompt: "For each venue, given its name, category, rating, neighborhood, 
     and Google types, write:
     (a) One vivid sentence description (what you'll experience)
     (b) What makes it special (the ONE thing)
     (c) Best time of day to visit
     (d) Typical visit duration"
  4. Update venue_cache with enriched fields
  5. Validate: descriptions are unique, not generic

COST: ~20 venues per call × 15 calls = ~$0.15 total for 300 venues
```

**Test:** Spot-check 10 enriched venues — descriptions should be vivid and specific, not "A popular restaurant in Rotterdam."

---

## WAVE 5: Full Pipeline & Integration
**Goal:** Wire everything together, run end-to-end, test with frontend.

### Task 5.1: Create `scripts/warm_city.py` — Master pipeline
```
INPUTS:
  --city paris
  --country France
  --skip-verify       (if venues already verified)
  --skip-enrich       (if descriptions already done)
  --skip-plans        (if plans already generated)
  --skip-routes       (if routes already optimized)

PIPELINE:
  Step 1: DISCOVER venues
    → Call Gemini: "List 250+ real venues in {city} across these categories:
       dining (80+), cafe (30+), nightlife (30+), culture (25+), 
       sightseeing (25+), outdoor (20+), shopping (20+), experience (20+)"
    → Parse response into venue names + suspected category
    → Save to venue_cache with verified=NULL (pending)

  Step 2: VERIFY all venues
    → Run verify_venues.py logic
    → Expected: ~200 verified true, ~50 false
    → Cost: ~$7

  Step 3: ENRICH descriptions
    → Run enrich_venues_ai.py logic
    → Cost: ~$0.15

  Step 4: GENERATE plans
    → Run generate_plans_ai.py logic
    → 5 base durations × 8 vibes × 4 travelers = 160 plans
    → Cost: ~$2

  Step 5: OPTIMIZE routes
    → Run optimize_routes.py logic
    → Fix any geographic issues
    → Cost: FREE

  Step 6: VALIDATE everything
    → Check all plans reference only verified venues
    → Check all venues have 4 photos accessible
    → Check no plan has duplicate venues
    → Check route times are realistic
    → Generate report

  TOTAL TIME: ~30 minutes
  TOTAL COST: ~$10
```

**Test:** Run for Rotterdam end-to-end, verify all checks pass.

### Task 5.2: Integration test with frontend
```
MANUAL TEST CHECKLIST:
  1. Open jolliday.online
  2. Type "5 days foodie Rotterdam with my girlfriend"
  3. Verify:
     - [ ] Plan loads instantly (cache hit)
     - [ ] All venue photos display (from Supabase Storage)
     - [ ] Photos are high quality (800px, not blurry)
     - [ ] Walking times are realistic (not all "8 min")
     - [ ] Venues are geographically clustered per day
     - [ ] No "venue not found" errors in console
     - [ ] Activity cards show rating, hours, neighborhood
  4. Click through all days — every venue should have photos
  5. Try "7 days adventure Rotterdam with friends" — different venues, photos work
```

### Task 5.3: Monitoring & reporting script
```
scripts/venue_stats.py --city rotterdam

OUTPUT:
  Rotterdam Venue Stats
  ─────────────────────
  Total in cache:     335
  Verified (true):    298  (89%)
  Verified (false):    37  (11%)
  With 4 photos:      295  (99% of verified)
  With description:   298  (100% of verified)
  
  By Category:
    dining:      105  ★4.4 avg
    cafe:         28  ★4.3 avg
    nightlife:    52  ★4.2 avg
    culture:      25  ★4.6 avg
    sightseeing:  33  ★4.5 avg
    outdoor:      22  ★4.4 avg
    shopping:     18  ★4.1 avg
    experience:   15  ★4.5 avg
  
  Plans Cached:       160
  Plans with issues:    0
  
  Last verification:  2026-05-23
  Storage used:       ~180MB (800 photos)
```

---

## WAVE 6: Production Hardening & Scaling
**Goal:** Make it bulletproof and ready for multiple cities.

### Task 6.1: Add re-verification cron (optional)
```
scripts/reverify_stale.py --older-than 90 --city rotterdam

- Only re-verifies venues where verified=true AND last_verified_at > 90 days ago
- NEVER touches verified=false venues
- Updates hours, rating, review_count if changed
- Flags newly closed venues
```

### Task 6.2: Add venue suggestion system
```
When generating plans, if AI suggests a venue NOT in cache:
1. Queue it for verification (background)
2. Use fallback venue from same category/neighborhood
3. After verification, regenerate affected plans if venue is legit
```

### Task 6.3: Error recovery & resume
```
Every script saves progress to: scripts/.state/{script_name}_{city}.json
{
  "started_at": "2026-05-23T10:00:00Z",
  "last_completed": "Fenix Food Factory",
  "completed_count": 150,
  "remaining_count": 185,
  "errors": ["API quota at venue #151"]
}

On re-run: automatically resumes from last_completed.
```

### Task 6.4: Cost tracking
```
scripts/.costs/{city}_costs.json
{
  "google_places_searches": 335,
  "google_places_photos": 1192,
  "gemini_flash_calls": 165,
  "openroute_calls": 800,
  "estimated_cost_usd": 9.85,
  "date": "2026-05-23"
}
```

---

## WAVE 7: Scale to Multiple Cities
**Goal:** Prove the system works for 10+ cities.

### Task 7.1: City expansion order
```
Priority (by search volume + tourism):
  1. Rotterdam ✓ (already done)
  2. Amsterdam
  3. Paris
  4. Barcelona
  5. London
  6. Rome
  7. Lisbon
  8. Prague
  9. Istanbul
  10. Dubai

For each: python scripts/warm_city.py --city {name} --country {country}
```

### Task 7.2: Multi-city test
Run warm_city for Amsterdam as proof of scaling:
- Discover → Verify → Enrich → Generate → Optimize
- Full report showing coverage
- Frontend test with "5 days foodie Amsterdam"

---

## Execution Timeline

| Wave | Duration | Depends On | Deliverable |
|------|----------|-----------|-------------|
| Wave 1 | 2 hours | API keys | DB table + config + utils |
| Wave 2 | 3 hours | Wave 1 | 335 Rotterdam venues verified |
| Wave 3 | 2 hours | Wave 2 | Route optimizer working |
| Wave 4 | 4 hours | Wave 2 | 160 AI-generated plans |
| Wave 5 | 2 hours | Wave 3+4 | End-to-end tested |
| Wave 6 | 2 hours | Wave 5 | Production-ready |
| Wave 7 | 1 hour/city | Wave 6 | 10 cities live |

**Total for Rotterdam (Waves 1-5): ~13 hours**
**Each new city after that: ~1 hour + $10**

---

## Testing Strategy

### Unit Tests (automated)
```python
# tests/test_verify_venues.py
def test_verified_venue_has_photos():
    """After verification, venue must have 1-4 photos on server."""
    
def test_false_venue_never_retried():
    """Once marked false, re-running verify skips it (0 API calls)."""
    
def test_cached_venue_skipped():
    """Already-verified venue is not re-verified."""

# tests/test_route_optimizer.py
def test_reorders_distant_venues():
    """Venues far apart get reordered for shorter walking."""
    
def test_flags_impossible_routes():
    """30+ min walking gets flagged in report."""

# tests/test_plan_generator.py
def test_all_venues_verified():
    """Generated plan only contains venues from venue_cache(verified=true)."""
    
def test_no_duplicate_venues():
    """No venue appears twice in same plan."""
    
def test_geographic_clustering():
    """Venues in same day are within 3km of each other."""
```

### Integration Tests (manual)
```
□ Verify 3 known venues → check photos in Supabase Storage
□ Verify 2 fake venues → check marked false
□ Generate 1 plan → all venues exist in cache
□ Optimize 1 plan → walking times realistic
□ Frontend loads plan → photos display
□ Cache hit test → response time < 200ms
```

### Smoke Tests (per city)
```
After warm_city.py completes:
□ venue_cache has 150+ verified venues
□ All venues have 1-4 photos (accessible URLs)
□ 160 plans in cached_plans
□ 0 plans reference non-verified venues
□ Route report shows 0 critical issues
□ Frontend renders all plans without errors
```

---

## File Manifest (What Gets Created)

```
scripts/
├── config.py                    # Wave 1 — shared config
├── venue_cache_utils.py         # Wave 1 — DB helpers
├── verify_venues.py             # Wave 2 — Google Places verification
├── optimize_routes.py           # Wave 3 — OpenRouteService routing
├── generate_plans_ai.py         # Wave 4 — Gemini plan generation
├── enrich_venues_ai.py          # Wave 4 — AI descriptions
├── warm_city.py                 # Wave 5 — full pipeline
├── venue_stats.py               # Wave 5 — reporting
├── reverify_stale.py            # Wave 6 — re-verification cron
├── .state/                      # Wave 6 — resume state files
└── .costs/                      # Wave 6 — cost tracking

tests/
├── test_verify_venues.py        # Wave 2 tests
├── test_route_optimizer.py      # Wave 3 tests
└── test_plan_generator.py       # Wave 4 tests
```

---

## Success Criteria

After all waves complete:

1. **Every venue in every plan is Google-verified** — 0 hallucinated venues
2. **Every venue has 4 photos on our server** — 0 broken image links
3. **Every day's route is validated** — realistic walking times, no 45-min gaps
4. **Plans are AI-crafted quality** — vivid descriptions, geographic flow, varied rhythm
5. **New city in 1 hour** — just `python scripts/warm_city.py --city paris`
6. **$0 per user** — everything served from cache
7. **$10 per city** — one-time setup cost
8. **Instant response** — cache hit, no AI call at request time
