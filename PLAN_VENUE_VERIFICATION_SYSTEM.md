# Jolliday — Venue Verification & Perfect Plan System

## The Problem (Current Market Failures)

1. **Fake/closed places** — AI trip planners recommend venues that don't exist, closed permanently, or have wrong addresses
2. **No real photos** — Plans link to expired Google CDN URLs or generic stock images
3. **Hallucinated venues** — AI models invent restaurant names that sound real but aren't
4. **Stale data** — Plans recommend places with outdated hours, moved locations, or changed names
5. **Duplicate API calls** — Every request hits Google/Maps APIs = expensive + slow
6. **No route logic** — Plans put venues 30km apart in the same morning
7. **Generic plans** — Every "foodie trip" recommends the same top-10 TripAdvisor spots

## The Solution: Verify Once, Serve Forever

```
┌─────────────────────────────────────────────────────────────┐
│                    VENUE VERIFICATION PIPELINE                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   1. AI GENERATES plan (Gemini 2.5 Flash)                   │
│          ↓                                                   │
│   2. EXTRACT all venue names from plan                       │
│          ↓                                                   │
│   3. CHECK venue_cache table:                                │
│      • verified=true  → use cached data + photos ✓          │
│      • verified=false → skip venue, pick alternative ✗       │
│      • not found      → go to step 4                         │
│          ↓                                                   │
│   4. VERIFY via Google Places API (Text Search)              │
│      • Place exists? Get place_id, lat/lng, rating, hours    │
│      • Fetch 4 photos via Place Photos API                   │
│      • Upload photos to Supabase Storage                     │
│      • Save to venue_cache with verified=true                │
│          ↓                                                   │
│   5. VALIDATE ROUTE via OpenRouteService                     │
│      • Check walking/transit times between day's venues      │
│      • Flag if >30min transit between consecutive slots      │
│      • Reorder or swap venues to optimize routes             │
│          ↓                                                   │
│   6. ASSEMBLE final plan with verified venues only            │
│      • All venues confirmed real + open                      │
│      • All photos on our server (never expire)               │
│      • All routes validated (realistic walking times)         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Architecture

### New Database Table: `venue_cache`

```sql
CREATE TABLE venue_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Identity
  name TEXT NOT NULL,
  destination TEXT NOT NULL,  -- "rotterdam", "paris", etc.
  google_place_id TEXT,
  
  -- Verification status
  verified BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE = real place, FALSE = doesn't exist
  verification_date TIMESTAMPTZ DEFAULT NOW(),
  verification_source TEXT DEFAULT 'google_places', -- 'google_places', 'openroute', 'manual'
  
  -- Location
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  address TEXT,
  neighborhood TEXT,
  
  -- Business info
  rating REAL,
  review_count INT,
  price_level INT,  -- 1-4 (Google's $ to $$$$)
  hours JSONB,  -- {"monday":"9:00-17:00", ...}
  phone TEXT,
  website TEXT,
  is_permanently_closed BOOLEAN DEFAULT FALSE,
  
  -- Classification
  category TEXT,  -- dining, cafe, culture, sightseeing, outdoor, nightlife, shopping, experience
  google_types TEXT[],  -- ['restaurant', 'food', 'point_of_interest']
  cuisine TEXT[],
  meal_types TEXT[],  -- ['breakfast', 'lunch', 'dinner']
  vibes TEXT[],  -- ['foodie', 'romantic', 'adventure', ...]
  travelers TEXT[],  -- ['couple', 'solo', 'friends', 'family']
  
  -- Photos (stored on our server)
  photos JSONB,  -- [{"url":"supabase_storage_url", "attribution":"...", "width":800, "height":600}, ...]
  photo_count INT DEFAULT 0,
  
  -- AI-enriched data
  description TEXT,  -- AI-written vivid description
  why_special TEXT,  -- What makes this place unique
  best_time_of_day TEXT,  -- 'morning', 'afternoon', 'evening', 'night'
  typical_duration TEXT,  -- '1h', '2h', '3h'
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Dedup
  aliases TEXT[],  -- Alternative names for matching
  
  UNIQUE(name, destination),
  UNIQUE(google_place_id)
);

-- Index for fast lookups
CREATE INDEX idx_venue_cache_destination ON venue_cache(destination);
CREATE INDEX idx_venue_cache_verified ON venue_cache(verified);
CREATE INDEX idx_venue_cache_category ON venue_cache(category);
CREATE INDEX idx_venue_cache_place_id ON venue_cache(google_place_id);
```

### API Keys Needed

| Service | Purpose | Cost |
|---------|---------|------|
| **Google Places API (New)** | Text Search + Place Details + Place Photos | $17/1000 text searches, $5/1000 photo fetches |
| **OpenRouteService** | Route optimization, walking/transit times, isochrones | FREE (2000 req/day) |
| **Gemini 2.5 Flash** (via OpenRouter) | Plan generation + venue description enrichment | ~$0.15/1M input, $0.60/1M output |

### Why Gemini 2.5 Flash (not Pro)?

- **Speed**: Flash is 3-5x faster than Pro — matters when generating 160+ plans
- **Cost**: ~10x cheaper than Pro — at scale this is $5 vs $50 for full city coverage
- **Quality**: For structured plan generation (JSON output), Flash matches Pro quality
- **Context**: 1M token context — can fit entire venue database in one prompt
- **Grounding**: Can use Google Search grounding to verify venue facts in real-time

**When to use Gemini 2.5 Pro instead**: Only for the "why is this place special" enrichment step where prose quality matters more.

## Pipeline Scripts

### Script 1: `scripts/verify_venues.py` — The Main Verifier

```
PURPOSE: Take venue names, verify them via Google Places API, save photos to server

FLOW:
1. Query venue_cache for unverified venues (or accept list of names)
2. For each venue:
   a. Google Places Text Search: "{venue_name} {city}"
   b. If NO results → mark verified=false (place doesn't exist)
   c. If results found:
      - Get place_id, lat, lng, address, rating, hours, types
      - Call Place Photos (up to 4 photos, max 800px width)
      - Upload photos to Supabase Storage: destination-media/{city}/{place_id}/photo_{0-3}.jpg
      - Save ALL data to venue_cache with verified=true
3. Rate limit: 10 requests/second (Google's limit)
4. Resume capability: skip already-verified venues

USAGE:
  python scripts/verify_venues.py --city rotterdam
  python scripts/verify_venues.py --city rotterdam --names "Fenix Food Factory,Hotel New York"
  python scripts/verify_venues.py --city rotterdam --reverify-older-than 30  # re-check after 30 days
```

### Script 2: `scripts/generate_plans_ai.py` — AI Plan Generator

```
PURPOSE: Generate high-quality plans using Gemini 2.5 Flash with ONLY verified venues

FLOW:
1. Fetch all verified=true venues for city from venue_cache
2. Group by category, neighborhood, meal_type
3. For each vibe × traveler combo:
   a. Build prompt with:
      - Full venue list (name, category, neighborhood, rating, description, hours, lat/lng)
      - Geographic clusters (pre-calculated)
      - Route constraints (from OpenRouteService)
      - Tone/style guidelines per vibe
   b. Call Gemini 2.5 Flash with structured output (JSON mode)
   c. Parse response → validate all venue names exist in verified cache
   d. If any venue NOT in cache → retry with correction prompt
   e. Save to cached_plans table
4. Generate base plans: 5 durations × 8 vibes × 4 travelers = 160 plans

USAGE:
  python scripts/generate_plans_ai.py --city rotterdam
  python scripts/generate_plans_ai.py --city rotterdam --vibe foodie --traveler couple
```

### Script 3: `scripts/optimize_routes.py` — Route Optimizer

```
PURPOSE: Validate and optimize venue order within each day using OpenRouteService

FLOW:
1. Load plan from cached_plans
2. For each day in the itinerary:
   a. Extract all venue lat/lng coordinates
   b. Call OpenRouteService Matrix API (walking times between all pairs)
   c. If any consecutive transit > 25min walking:
      - Try reordering venues (TSP-style optimization)
      - If still too far → flag for replacement
   d. Calculate realistic transit times (replace generic "8 min walk")
   e. Add directions/tips: "Walk along the waterfront" or "Take tram 7"
3. Update plan with optimized routes

USAGE:
  python scripts/optimize_routes.py --city rotterdam
  python scripts/optimize_routes.py --city rotterdam --plan "rotterdam|5|foodie|couple"
```

### Script 4: `scripts/enrich_venues_ai.py` — AI Description Enrichment

```
PURPOSE: Use Gemini to write vivid descriptions for verified venues

FLOW:
1. Fetch verified venues that lack description/why_special
2. Batch 20 venues per Gemini call
3. Prompt: "For each venue, write: (a) one vivid sentence description, 
   (b) what makes it special, (c) best time to visit, (d) typical duration"
4. Update venue_cache with enriched data

USAGE:
  python scripts/enrich_venues_ai.py --city rotterdam
```

### Script 5: `scripts/warm_city.py` — Full City Pipeline

```
PURPOSE: Run entire pipeline for a new city end-to-end

FLOW:
1. Generate venue list using Gemini (ask: "List 200+ venues in {city} across all categories")
2. Verify each venue via Google Places API
3. Download + store 4 photos per verified venue
4. Enrich descriptions via Gemini
5. Optimize geographic clusters
6. Generate all 160 cached plans
7. Validate routes for all plans
8. Report: X venues verified, Y plans cached, Z photos stored

USAGE:
  python scripts/warm_city.py --city paris
  python scripts/warm_city.py --city barcelona --skip-verify  # if venues already verified
```

## Cost Analysis Per City

| Step | API Calls | Cost |
|------|-----------|------|
| Venue verification (200 venues) | 200 Text Searches + 200 Details + 800 Photo fetches | ~$7.40 |
| Photo storage (800 photos × 200KB avg) | Supabase Storage | ~$0.02/month |
| AI plan generation (160 plans) | ~160 Gemini Flash calls | ~$2.00 |
| AI enrichment (200 venues) | ~10 Gemini Flash calls | ~$0.15 |
| Route optimization (160 plans × 5 days avg) | ~800 ORS calls | FREE |
| **TOTAL per city** | | **~$10** |

After initial verification: $0 per user request (all served from cache).

## The "Never Re-verify" Logic

```python
def get_or_verify_venue(name: str, city: str) -> dict | None:
    # 1. Check cache first
    cached = db.query("SELECT * FROM venue_cache WHERE name = ? AND destination = ?", name, city)
    
    if cached:
        if cached.verified == True:
            return cached  # ✅ Use it — confirmed real, photos on server
        if cached.verified == False:
            return None  # ❌ Already confirmed fake — never try again
    
    # 2. Not in cache — verify via Google Places
    result = google_places_text_search(f"{name} {city}")
    
    if not result or result.is_permanently_closed:
        # Save as FALSE — never waste API call on this again
        db.insert("venue_cache", {
            "name": name, "destination": city, 
            "verified": False, 
            "verification_date": now()
        })
        return None
    
    # 3. It's real! Get photos and save everything
    photos = google_places_photos(result.place_id, max_count=4)
    stored_urls = upload_to_supabase(photos, city, result.place_id)
    
    venue = {
        "name": name, "destination": city,
        "verified": True,
        "google_place_id": result.place_id,
        "lat": result.lat, "lng": result.lng,
        "address": result.address,
        "rating": result.rating,
        "review_count": result.review_count,
        "hours": result.hours,
        "photos": stored_urls,
        "photo_count": len(stored_urls),
        "google_types": result.types,
    }
    db.insert("venue_cache", venue)
    return venue
```

## Key Design Decisions

### 1. Google Places API (New) vs Scraping
- **Decision: Use API for verification, keep scraper as backup**
- Why: API gives structured data, place_id for dedup, official photos with attribution
- The scraper still works for cities where we want 300+ venues cheaply
- API is for VERIFICATION — confirming a venue is real and getting authoritative data

### 2. OpenRouteService vs Google Directions
- **Decision: OpenRouteService (free) for route optimization**
- Why: 2000 free requests/day is enough for batch processing
- Google Directions costs $5/1000 requests — unnecessary for pre-cached plans
- ORS gives walking + cycling + transit matrices in one call

### 3. Photo Storage Strategy
- **Decision: Upload to Supabase Storage immediately, store URL in venue_cache**
- Photos never expire (our server, our URLs)
- Standard path: `destination-media/{city}/{place_id}/photo_{0-3}.jpg`
- Resize to 800px width before upload (save storage, fast loading)

### 4. Verification Freshness
- **Decision: Re-verify after 90 days (optional cron)**
- Places close, hours change, ratings shift
- But we NEVER re-verify `verified=false` venues (they're dead)
- Re-verification only updates metadata — photos stay unless better ones found

### 5. AI Model Choice
- **Decision: Gemini 2.5 Flash for generation, not Pro**
- Flash handles structured output (JSON plans) perfectly
- 10x cheaper = can generate thousands of plans for $5
- Pro only needed for creative prose (descriptions, "why special" text)
- Fallback: if Flash hallucinates a venue, the verification step catches it

## Integration with Existing System

### What Changes in `rzuma-chat` Edge Function:
- Nothing! Cache logic stays the same
- Plans are served from `cached_plans` table as before
- The only difference: plans now contain ONLY verified venues with guaranteed photos

### What Changes in Frontend:
- Photo resolution improves (800px Google API photos vs scraped)
- Venue data is richer (hours, phone, website from Google)
- Route times are accurate (from ORS, not generic "8 min walk")

### Migration from Current System:
1. Run `verify_venues.py` on all existing Rotterdam venues
2. Venues that pass → copy to `venue_cache` with verified=true
3. Venues that fail → mark verified=false
4. Regenerate all 160 Rotterdam plans using only verified venues
5. Old `destination_media` table stays as backup

## File Structure (New Scripts)

```
scripts/
├── verify_venues.py          # Google Places API verification
├── generate_plans_ai.py      # Gemini 2.5 Flash plan generation  
├── optimize_routes.py        # OpenRouteService route optimization
├── enrich_venues_ai.py       # AI description enrichment
├── warm_city.py              # Full pipeline for new city
├── venue_cache_utils.py      # Shared utilities (DB queries, photo upload)
└── config.py                 # API keys, constants, city configs
```

## Environment Variables (New)

```env
# Google Places API (new)
GOOGLE_PLACES_API_KEY=AIza...

# OpenRouteService
OPENROUTE_API_KEY=5b3ce3597851...

# Gemini (via OpenRouter or direct)
GEMINI_API_KEY=...          # Direct Google AI Studio key
# OR use existing OPENROUTER_API_KEY with model: google/gemini-2.5-flash
```

## Execution Order (First City: Rotterdam)

```
Step 1: Create venue_cache table in Supabase (SQL above)
Step 2: Get Google Places API key (enable Places API in Google Cloud Console)
Step 3: Get OpenRouteService API key (free at openrouteservice.org)
Step 4: Run: python scripts/verify_venues.py --city rotterdam
         → Verifies all 335 existing venues, downloads photos
Step 5: Run: python scripts/enrich_venues_ai.py --city rotterdam
         → AI writes descriptions for all verified venues
Step 6: Run: python scripts/generate_plans_ai.py --city rotterdam
         → Gemini generates 160 high-quality plans using only verified venues
Step 7: Run: python scripts/optimize_routes.py --city rotterdam
         → Validates all routes, fixes transit times
Step 8: Test end-to-end on jolliday.online
```

## Scaling to New Cities

Once Rotterdam is proven:
```
python scripts/warm_city.py --city paris        # ~$10, ~2 hours
python scripts/warm_city.py --city barcelona    # ~$10, ~2 hours
python scripts/warm_city.py --city amsterdam    # ~$10, ~2 hours
```

Each city: ~200 verified venues, ~160 cached plans, ~800 photos on server.
Total cost per city: ~$10 one-time. Serves unlimited users at $0/request after that.

## What This Solves (vs Competition)

| Problem | TripAdvisor/Google | Other AI Planners | Jolliday (this system) |
|---------|-------------------|-------------------|----------------------|
| Fake venues | ❌ AI hallucinates | ❌ AI hallucinates | ✅ Google Places verified |
| Expired photos | ❌ CDN links expire | ❌ No photos at all | ✅ Our server, permanent |
| Closed places | ❌ Outdated data | ❌ No verification | ✅ Checked via API |
| Bad routes | ❌ No route logic | ❌ Random order | ✅ ORS optimized |
| API cost/user | $0.10+/request | $0.05+/request | ✅ $0/request (cached) |
| Speed | 2-5 seconds | 10-30 seconds | ✅ Instant (cache hit) |
| Quality | Generic top-10 | Generic AI output | ✅ Expert-crafted, verified |

## Summary

This system creates a **verified venue database** that guarantees:
1. Every venue in a plan ACTUALLY EXISTS (Google Places confirmed)
2. Every venue has 4 HIGH-QUALITY photos ON OUR SERVER (never expire)
3. Every route between venues is VALIDATED (realistic walking times)
4. Every venue is only verified ONCE (false = never retried, true = cached forever)
5. Plans are generated by AI but CONSTRAINED to verified venues only
6. Cost: ~$10 per city setup, then $0 per user forever
