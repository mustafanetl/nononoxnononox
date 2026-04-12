

# Plan: Improve Google Places Image Relevance

## Problem
The current Google Places searches use generic queries that often return irrelevant photos — e.g. searching "Paris" might return a random business photo instead of iconic city imagery. Activity and hotel fallback photos cycle through these low-quality destination images.

## Changes

### 1. Improve destination-level photo queries
**File:** `supabase/functions/enrich-destination/index.ts`
- Change `getGooglePlacePhotos` textQuery from just `destination` to `"top attractions in {destination}"` or `"{destination} travel landmarks"` — this biases Google Places toward scenic/iconic results
- Add `includedType: "tourist_attraction"` to the Places Text Search request to filter for landmarks instead of businesses
- Request `maxResultCount: 3` places (not 1) and gather photos across all of them for variety — currently we only look at the first place result

### 2. Improve per-activity photo searches
**File:** `supabase/functions/enrich-destination/index.ts`
- In `searchActivitiesPhotos`, add the activity category to the query (e.g. `"Bar BenFiddich cocktail bar in Tokyo"` instead of just `"Bar BenFiddich in Tokyo"`) for more precise matching
- Request `maxResultCount: 3` places and pick the best photo (first result with photos) rather than blindly taking the first result which might not have photos

### 3. Improve per-hotel photo searches
**File:** `supabase/functions/enrich-destination/index.ts`
- In `searchHotelPhotos`, add `includedType: "lodging"` to constrain results to actual hotels
- Grab multiple photos per hotel (first 2) so the detail modal can show more than one image

### 4. Better fallback logic — no generic city photos on activities
**File:** `src/pages/Chat.tsx`
- Stop cycling generic destination images onto activities that didn't get a specific match — it's misleading. Instead, leave `realPhoto` empty so the gradient placeholder with category icon shows (which is more honest than a random city photo)
- Keep destination images only for the TripSummaryCard hero and PlaceShowcase

### 5. Clean up dead weather code in enrichment
**File:** `supabase/functions/enrich-destination/index.ts`
- Remove `getWeather()`, `weatherCodeToCondition()`, and weather processing — already removed from frontend but still runs server-side wasting time

## Files Modified
| File | Change |
|---|---|
| `supabase/functions/enrich-destination/index.ts` | Better search queries, type filters, multi-place photo gathering, remove dead weather code |
| `src/pages/Chat.tsx` | Stop assigning generic city photos to unmatched activities |

