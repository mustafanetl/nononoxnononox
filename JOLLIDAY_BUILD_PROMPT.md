# Jolliday — Backend Enhancement Prompt

> Paste this into a new session. This builds on the EXISTING Supabase Edge Functions backend.

---

## CRITICAL CONTEXT

I have a fully working Jolliday AI trip planner with:

**Frontend (React + TypeScript + Vite + Tailwind + shadcn/ui):**
- Chat interface that sends messages to `rzuma-chat` edge function
- Plan parser that extracts fenced code blocks (```flights, ```hotels, ```activities, ```itinerary, ```weather, ```destination_enrich, ```quickreplies)
- Trip detail pages with maps (Leaflet), flight/hotel/activity cards
- Crafting animation with progress stages
- Supabase auth + subscription system
- Booking link builders (Skyscanner deeplinks, Booking.com deeplinks)

**Backend (Supabase Edge Functions — Deno/TypeScript):**
- `rzuma-chat` — Main chat endpoint. Streams AI response via SSE (OpenRouter → Gemini 2.5 Flash Lite). Has plan caching, rate limiting, user preferences injection.
- `review-trip-plan` — QA verification. Checks every venue against Google Places Text Search. Rejects fake venues, validates coordinates, enforces country boundaries. Caches verified/rejected venues in `destination_media` table.
- `enrich-destination` — Fetches real photos from Google Places for each venue + hero images. Caches in Supabase `destination_media` table. Respects admin-uploaded media.
- `cache-plan` — Stores/retrieves full plan text by deterministic cache key (destination + duration + vibe + traveler type).
- `suggest-activity-alternatives` — Swaps individual activities on demand.
- Warm-cache scripts (Python) that generate plans for 80+ cities and pre-verify all venues.

**What's WORKING today:**
- User types a message → AI generates a plan with all blocks → QA verifies venues via Google Places → photos get enriched → user sees the full trip
- Verified badge system (venues checked against Google Places)
- Plan caching (same request = instant serve from DB)
- Multi-turn conversation (discovery flow → plan generation → revision)
- Admin media panel (upload custom photos/videos per venue)

---

## WHAT I NEED BUILT

Enhance the existing backend to add **real pricing data** and **walking intelligence**. The current system has the AI hallucinate all prices and walking times. I want REAL data injected.

### The Three Gaps:

| Gap | Current State | Target State |
|-----|---------------|--------------|
| **Flight prices** | AI invents prices like "€850" | Real cached prices from Travelpayouts Data API, shown as "from €XX" |
| **Hotel prices** | AI invents hotel names + prices | Real hotel data from Travelpayouts Hotels API with booking links |
| **Walking times** | AI guesses "5 min walk" | Real walking durations from OSRM between consecutive venues |

---

## SOLUTION: Three New Edge Functions

Build these as NEW Supabase Edge Functions that the frontend calls AFTER receiving the plan from `rzuma-chat`. The existing flow stays intact — these enhance the plan with real data.

### Architecture (Enhanced Flow):

```
User message
    ↓
rzuma-chat (existing) — AI generates plan with all blocks
    ↓
review-trip-plan (existing) — verifies venues, patches coordinates
    ↓
enrich-destination (existing) — fetches real photos
    ↓
[NEW] enrich-pricing — injects real flight + hotel prices
    ↓
[NEW] enrich-walking — calculates real walking times between slots
    ↓
Frontend displays enriched plan
```

The frontend calls these enrichment functions AFTER the plan is generated. This keeps plan generation fast and adds real data as a progressive enhancement. Quality over speed — if enrichment takes 5-10 extra seconds, that's fine.

---

## FUNCTION 1: `enrich-pricing`

**Purpose:** Replace AI-hallucinated flight/hotel prices with real data from Travelpayouts.

### Request:
```json
{
  "origin": "Berlin",
  "destination": "Barcelona",
  "startDate": "2026-05-20",
  "endDate": "2026-05-23",
  "groupSize": 2,
  "budget": "mid",
  "currency": "EUR"
}
```

### Response:
```json
{
  "flights": {
    "outbound": {
      "price": 47,
      "airline": "Ryanair",
      "departure_at": "2026-05-20T06:30:00Z",
      "return_at": "2026-05-23T21:15:00Z",
      "transfers": 0,
      "booking_url": "https://www.aviasales.com/search/BER2005BAR2305...",
      "source": "travelpayouts",
      "price_type": "from"
    },
    "return": {
      "price": 52,
      "airline": "Vueling",
      "departure_at": "2026-05-23T18:00:00Z",
      "arrival_at": "2026-05-23T21:15:00Z",
      "transfers": 0,
      "booking_url": "https://www.aviasales.com/search/...",
      "source": "travelpayouts",
      "price_type": "from"
    },
    "fallback_url": "https://www.skyscanner.com/transport/flights/BER/BCN/2026-05-20/2026-05-23/"
  },
  "hotels": [
    {
      "name": "Hotel Neri",
      "price_per_night": 135,
      "stars": 4,
      "rating": 9.1,
      "location": { "lat": 41.3833, "lng": 2.1761 },
      "neighborhood": "Gothic Quarter",
      "booking_url": "https://search.hotellook.com/...",
      "photo_url": "https://photo.hotellook.com/...",
      "source": "travelpayouts"
    }
  ],
  "total_estimate": {
    "flights_total": 198,
    "hotel_total": 405,
    "currency": "EUR"
  }
}
```

### Implementation Details:

**Flights — Travelpayouts Data API:**
- Endpoint: `https://api.travelpayouts.com/v1/prices/cheap`
- Parameters: `origin={IATA}&destination={IATA}&depart_date={YYYY-MM}&return_date={YYYY-MM}&token={TOKEN}`
- Returns cheapest prices found in last 48 hours (cached/recent, not real-time)
- Display as "Flights from €XX" (these are indicative, not guaranteed)
- Booking link: `https://www.aviasales.com/search/{ORIGIN}{DD}{MM}{DEST}{DD}{MM}1` (earns commission)
- Requires: IATA code lookup (city name → IATA). Use Travelpayouts `/data/en/cities.json` or hardcode top 100.
- Fallback: if API returns nothing, construct Skyscanner deeplink with route pre-filled

**Hotels — Travelpayouts Hotels API:**
- Hotels lookup endpoint: `https://engine.hotellook.com/api/v2/lookup.json?query={city}&lang=en&lookFor=both&limit=10`
- Hotel prices endpoint: `https://engine.hotellook.com/api/v2/cache.json?location={city}&checkIn={date}&checkOut={date}&currency=eur&limit=10`
- Filter by budget: budget = sort by price ASC take cheapest, mid = take middle tier, luxury = sort by stars DESC
- Booking link construction: `https://search.hotellook.com/hotels?destination={city}&checkIn={date}&checkOut={date}&adults={n}`
- Fallback: construct Booking.com deeplink

**IATA Code Resolution:**
- Maintain a lookup map (city name → IATA code) for the 100+ supported cities
- Source: Travelpayouts `/data/en/cities.json` endpoint or hardcoded
- Examples: Berlin=BER, Barcelona=BCN, Paris=CDG, Amsterdam=AMS, Stockholm=ARN, London=LHR, Rome=FCO

**API Keys needed:**
- `TRAVELPAYOUTS_TOKEN` — Travelpayouts API token (set in Supabase secrets)
- `TRAVELPAYOUTS_MARKER` — Affiliate marker for booking links

---

## FUNCTION 2: `enrich-walking`

**Purpose:** Calculate real walking durations between consecutive itinerary slots using OSRM.

### Request:
```json
{
  "slots": [
    { "venue": "Sagrada Familia", "lat": 41.4036, "lng": 2.1744 },
    { "venue": "Casa Batlló", "lat": 41.3916, "lng": 2.1649 },
    { "venue": "La Boqueria", "lat": 41.3816, "lng": 2.1719 },
    { "venue": "Gothic Quarter", "lat": 41.3833, "lng": 2.1761 }
  ],
  "hotel": { "lat": 41.3851, "lng": 2.1734 }
}
```

### Response:
```json
{
  "segments": [
    { "from": "Sagrada Familia", "to": "Casa Batlló", "walking_minutes": 15, "distance_m": 1200, "suggestion": "walk" },
    { "from": "Casa Batlló", "to": "La Boqueria", "walking_minutes": 12, "distance_m": 950, "suggestion": "walk" },
    { "from": "La Boqueria", "to": "Gothic Quarter", "walking_minutes": 5, "distance_m": 400, "suggestion": "walk" }
  ],
  "hotel_to_first": { "walking_minutes": 22, "distance_m": 1800, "suggestion": "walk" },
  "last_to_hotel": { "walking_minutes": 3, "distance_m": 250, "suggestion": "walk" },
  "total_walking_km": 4.6,
  "transit_needed": []
}
```

### Implementation Details:

**OSRM (Open Source Routing Machine):**
- Public API, no key needed, free: `https://router.project-osrm.org`
- Table endpoint (walking matrix): `GET /table/v1/foot/{coordinates}?annotations=duration,distance`
  - `coordinates` = semicolon-separated `lng,lat` pairs
  - Returns NxN duration matrix in seconds
- Route endpoint (single pair, for transit suggestion): `GET /route/v1/foot/{lng1},{lat1};{lng2},{lat2}?overview=false`
- If any segment > 25 minutes walking → mark as "transit recommended" and suggest metro/bus

**Logic:**
1. Take all slots for a single day (with coordinates from review-trip-plan verification)
2. Build coordinate string: hotel + all day slots
3. Call OSRM `/table/v1/foot/{coords}` for the walking time matrix
4. Extract consecutive pairs (hotel→slot1, slot1→slot2, ..., lastSlot→hotel)
5. For segments > 25 min: flag as transit and include note
6. Calculate total walking distance for the day
7. Return per-segment data so frontend can display "15 min walk" between cards

**Rate limits:** OSRM public server allows ~1 req/sec. Batch all day's coordinates in one call (table endpoint handles up to 100 points).

---

## FUNCTION 3: `enrich-booking-links`

**Purpose:** Construct GetYourGuide affiliate deeplinks for bookable activities.

### Request:
```json
{
  "activities": [
    { "name": "Sagrada Familia Skip-the-Line Tour", "city": "Barcelona", "category": "culture" },
    { "name": "Gothic Quarter Food Tour", "city": "Barcelona", "category": "food" }
  ],
  "partner_id": "JOLLIDAY123"
}
```

### Response:
```json
{
  "links": [
    {
      "activity": "Sagrada Familia Skip-the-Line Tour",
      "booking_url": "https://www.getyourguide.com/s/?q=Sagrada+Familia+Skip-the-Line+Tour+Barcelona&partner_id=JOLLIDAY123",
      "provider": "getyourguide"
    },
    {
      "activity": "Gothic Quarter Food Tour",
      "booking_url": "https://www.getyourguide.com/s/?q=Gothic+Quarter+Food+Tour+Barcelona&partner_id=JOLLIDAY123",
      "provider": "getyourguide"
    }
  ]
}
```

### Implementation:
- Simple URL construction: `https://www.getyourguide.com/s/?q={encoded_query}+{city}&partner_id={ID}`
- No API call needed — just builds the deeplink
- Partner ID from env var: `GETYOURGUIDE_PARTNER_ID`
- Future: Add Viator deeplinks as secondary provider

---

## IATA CODE REFERENCE (Hardcoded Lookup)

Build a lookup map for the supported cities. Here are the key ones:

```typescript
const IATA_MAP: Record<string, string> = {
  // Western Europe
  "amsterdam": "AMS", "barcelona": "BCN", "berlin": "BER", "brussels": "BRU",
  "copenhagen": "CPH", "dublin": "DUB", "edinburgh": "EDI", "florence": "FLR",
  "hamburg": "HAM", "helsinki": "HEL", "lisbon": "LIS", "london": "LHR",
  "madrid": "MAD", "malaga": "AGP", "marseille": "MRS", "milan": "MXP",
  "munich": "MUC", "naples": "NAP", "nice": "NCE", "oslo": "OSL",
  "paris": "CDG", "porto": "OPO", "prague": "PRG", "rome": "FCO",
  "seville": "SVQ", "stockholm": "ARN", "venice": "VCE", "vienna": "VIE",
  "zurich": "ZRH", "athens": "ATH", "budapest": "BUD", "dubrovnik": "DBV",
  "krakow": "KRK", "warsaw": "WAW", "split": "SPU", "gothenburg": "GOT",
  "rotterdam": "RTM", "lyon": "LYS",
  // Asia
  "tokyo": "NRT", "kyoto": "KIX", "osaka": "KIX", "bangkok": "BKK",
  "chiang mai": "CNX", "singapore": "SIN", "kuala lumpur": "KUL",
  "hong kong": "HKG", "seoul": "ICN", "busan": "PUS", "hanoi": "HAN",
  "ho chi minh city": "SGN", "bali": "DPS", "taipei": "TPE",
  "dubai": "DXB", "abu dhabi": "AUH", "mumbai": "BOM", "delhi": "DEL",
  "goa": "GOI", "jaipur": "JAI", "phuket": "HKT",
  // Africa & Middle East
  "marrakech": "RAK", "casablanca": "CMN", "cairo": "CAI",
  "nairobi": "NBO", "cape town": "CPT", "johannesburg": "JNB",
  "accra": "ACC", "dakar": "DSS",
  // Americas
  "new york": "JFK", "los angeles": "LAX", "miami": "MIA",
  "mexico city": "MEX", "buenos aires": "EZE", "rio de janeiro": "GIG",
  "sao paulo": "GRU", "bogota": "BOG", "lima": "LIM",
  // Oceania
  "sydney": "SYD", "melbourne": "MEL", "auckland": "AKL",
};
```

---

## ENVIRONMENT VARIABLES NEEDED

Add these to Supabase Edge Function secrets:

```
TRAVELPAYOUTS_TOKEN=<your travelpayouts API token>
TRAVELPAYOUTS_MARKER=<your affiliate marker ID>
GETYOURGUIDE_PARTNER_ID=<your GYG partner ID>
```

Existing secrets (already set):
- `OPENROUTER_API_KEY` — for AI calls
- `GOOGLE_PLACES_API_KEY` — for venue verification + photos
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — for DB access

---

## FRONTEND INTEGRATION

The frontend should call these enrichment functions AFTER the main plan flow completes. The flow becomes:

```
1. User sends message → rzuma-chat streams plan
2. Plan complete → review-trip-plan verifies venues
3. Verified → enrich-destination fetches photos
4. Photos loaded → enrich-pricing adds real prices (background, non-blocking)
5. Display plan → enrich-walking calculates routes (background, non-blocking)
6. Update flight/hotel cards with real prices when enrich-pricing returns
7. Update "X min walk" labels when enrich-walking returns
```

Steps 4-7 are progressive enhancement — the plan displays immediately with AI-estimated data, then real prices/walking times replace the estimates as they arrive.

### Frontend changes needed:
1. After plan loads, call `enrich-pricing` with origin/destination/dates extracted from the plan
2. After plan loads, call `enrich-walking` with coordinates from each day's slots
3. Update flight cards: replace AI price with real price, add "from €XX" label + booking link
4. Update hotel cards: replace AI hotel with real hotel data + booking link
5. Update walking labels between slots with real OSRM durations
6. Show "Prices verified ✓" badge when real data arrives

---

## QUALITY PRINCIPLES (NON-NEGOTIABLE)

1. **Real data > speed.** If Travelpayouts takes 5 seconds, wait. Users trust accurate prices over fast guesses.
2. **Graceful degradation.** If Travelpayouts fails → show Skyscanner/Booking.com deeplinks. If OSRM fails → keep AI estimates. Never break the plan.
3. **Cache aggressively.** Same route + dates = serve cached prices for 1 hour. Same city coordinates = cache OSRM results for 24 hours.
4. **Revenue-first links.** Always use affiliate parameters. Travelpayouts marker in flight links, partner_id in GYG links, affiliate_id in hotel links.
5. **Honest labeling.** Real prices show "from €XX" (they're cached, not live). Walking times show exact minutes from OSRM. Never claim precision you don't have.

---

## BUILD ORDER

**Phase 1: enrich-pricing**
1. Create `supabase/functions/enrich-pricing/index.ts`
2. Implement IATA lookup
3. Implement Travelpayouts flights API call
4. Implement Travelpayouts hotels API call
5. Implement fallback deeplink construction
6. Add response caching (1 hour TTL)
7. Test with 5 routes

**Phase 2: enrich-walking**
8. Create `supabase/functions/enrich-walking/index.ts`
9. Implement OSRM table endpoint call
10. Implement consecutive-pair extraction from matrix
11. Implement transit threshold detection (>25 min)
12. Add response caching (24 hour TTL)
13. Test with Barcelona, Paris, Amsterdam coordinates

**Phase 3: enrich-booking-links**
14. Create `supabase/functions/enrich-booking-links/index.ts`
15. Implement GYG deeplink construction
16. Add Viator deeplink as secondary provider
17. Test with 10 activities

**Phase 4: Frontend wiring**
18. Add enrichment hook in trip detail page (after plan loads)
19. Update flight/hotel card components to show real vs estimated prices
20. Update walking labels between itinerary slots
21. Add "Verified price ✓" indicators
22. Handle loading states gracefully (show estimates → replace with real data)

---

## FILE STRUCTURE

```
supabase/functions/
  _shared/
    aiProvider.ts          (existing — OpenRouter calls)
    auth.ts                (existing — auth + rate limiting)
    planParser.ts          (existing — block extraction)
    iataLookup.ts          (NEW — city → IATA code mapping)
    travelpayouts.ts       (NEW — Travelpayouts API client)
    osrm.ts                (NEW — OSRM walking time client)
  enrich-pricing/
    index.ts               (NEW)
  enrich-walking/
    index.ts               (NEW)
  enrich-booking-links/
    index.ts               (NEW)
  rzuma-chat/
    index.ts               (existing — no changes needed)
  review-trip-plan/
    index.ts               (existing — no changes needed)
  enrich-destination/
    index.ts               (existing — no changes needed)
```

---

## WHAT NOT TO CHANGE

- Do NOT modify `rzuma-chat` — the AI plan generation works well
- Do NOT modify `review-trip-plan` — Google Places verification is solid
- Do NOT modify `enrich-destination` — photo enrichment works
- Do NOT change the frontend plan parser — it handles the fenced block format
- Do NOT replace the Supabase Edge Functions architecture with a separate backend
- Do NOT add a separate database — use the existing Supabase `destination_media` table for caching

---

## TESTING ROUTES

Test these city pairs to validate the pricing function:

| Origin | Destination | Expected Result |
|--------|-------------|-----------------|
| Stockholm (ARN) | Barcelona (BCN) | Should return Ryanair/Norwegian prices |
| London (LHR) | Paris (CDG) | Should return Eurostar alternative note |
| Berlin (BER) | Rome (FCO) | Should return budget airline prices |
| Dubai (DXB) | Tokyo (NRT) | Should return long-haul prices |
| New York (JFK) | Amsterdam (AMS) | Should return transatlantic prices |

---

Start with Phase 1, Step 1. Create the `enrich-pricing` edge function with the IATA lookup and Travelpayouts integration.
