

# Real Data Integration — What's Possible Without API Keys

## Honest Assessment

| Data type | Free no-key API? | Solution |
|-----------|------------------|----------|
| City/destination photos | Yes — **Wikimedia Commons** | Fetch real photos of any city/landmark via their free API |
| Activities/attractions | Yes — **Wikipedia API** | Get real points of interest, descriptions, coordinates |
| Country/weather/currency | Already done | Open-Meteo, REST Countries, Frankfurter |
| Real-time flight prices | **No** | No free public API exists for live flight data. Amadeus/Skyscanner all require keys. Keep AI estimates with direct booking links. |
| Real-time hotel prices | **No** | Same — no free API. Keep AI estimates with Booking.com links. |

## Changes

### 1. New edge function: `search-wikimedia-images`
Calls `https://commons.wikimedia.org/w/api.php` to fetch real Creative Commons photos for any destination, hotel name, or landmark. Returns actual photo URLs — not AI-generated or hardcoded stock images. No API key needed.

### 2. New edge function: `search-wikipedia-places`
Calls Wikipedia's `geosearch` and `extracts` API to find real notable places, landmarks, and attractions near a destination's coordinates. Returns names, descriptions, coordinates, and thumbnail images. No API key needed.

### 3. Update `enrich-destination` edge function
Add Wikimedia image search and Wikipedia places lookup to the existing enrichment pipeline. Return real destination hero images and real nearby attractions alongside existing weather/country/currency data.

### 4. Update `src/utils/cityImages.ts`
Replace the hardcoded Unsplash photo map with a function that first checks a cache of Wikimedia results, then falls back to Unsplash statics. New function: `fetchRealCityImage(city)` that calls the edge function.

### 5. Update `src/pages/Chat.tsx`
When enrichment data arrives, use real Wikimedia images for destination cards and real Wikipedia places for activity suggestions. Show "Real data" badges. For flights/hotels, keep AI estimates but add a clear "Estimated prices" label.

### 6. Update card components
- **FlightCard / HotelCard** — add "Estimated" badge so users know prices are approximate
- **ActivityCard** — support Wikipedia-sourced activities with real photos and descriptions
- **HotelCard / FlightCard images** — use real Wikimedia destination photos instead of hardcoded Unsplash

### 7. Update `rzuma-chat` system prompt
Tell the AI to emit a `real_places_search` intent block with destination + categories. Frontend resolves it via Wikipedia for real attraction data. AI still generates flight/hotel estimates (clearly labeled).

## What becomes real
- Destination photos (Wikimedia Commons — real CC-licensed images)
- Nearby attractions/landmarks (Wikipedia geosearch)
- Weather, currency, country info (already live)

## What stays AI-estimated (no free API exists)
- Flight prices and schedules — labeled as "Estimated" with Skyscanner/Google Flights booking links
- Hotel prices — labeled as "Estimated" with Booking.com links

## Files to create
- `supabase/functions/search-wikimedia-images/index.ts`
- `supabase/functions/search-wikipedia-places/index.ts`

## Files to modify
- `supabase/functions/enrich-destination/index.ts` — add image + places search
- `supabase/functions/rzuma-chat/index.ts` — add `real_places_search` intent, label estimates
- `src/pages/Chat.tsx` — resolve real places, use real images
- `src/utils/cityImages.ts` — dynamic Wikimedia lookup with fallback
- `src/components/FlightCard.tsx` — "Estimated" badge
- `src/components/HotelCard.tsx` — "Estimated" badge, real destination images
- `src/components/ActivityCard.tsx` — support Wikipedia-sourced data with real photos

