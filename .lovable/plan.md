

# Real Hotel Data via Xotelo API (Free, No Key Required)

## What's Possible

Xotelo provides a **completely free, no-API-key** hotel data API based on TripAdvisor data. We can get:
- **Real hotel names, images, addresses** via `/search` endpoint
- **Real prices from Booking.com, Expedia, Hotels.com, Agoda** via `/rates` endpoint
- **Hotel lists by location** with price ranges, ratings, and coordinates via `/list` endpoint

## How It Works

```text
User asks for trip to Tokyo
        ↓
AI generates plan with estimated hotels (as today)
        ↓
enrich-destination edge function runs
        ↓
NEW: calls Xotelo /search?query=Tokyo&location_type=geo
        → gets location_key (e.g. g298184)
        ↓
NEW: calls Xotelo /list?location_key=g298184&limit=6&sort=best_value
        → gets real hotel names, images, price ranges, ratings, coords
        ↓
Frontend replaces AI-estimated hotels with real hotel data
Cards show real images, real price ranges, "Live" badge instead of "Est."
```

## Plan

### Step 1: Add Xotelo hotel search to enrich-destination edge function
**File: `supabase/functions/enrich-destination/index.ts`**
- Add `searchXoteloLocation(destination)` → calls `/search?query=...&location_type=geo` to get the `location_key`
- Add `getXoteloHotels(locationKey, limit=6)` → calls `/list?location_key=...&limit=6&sort=best_value`
- Include both in the existing `Promise.all` block alongside weather/country/images
- Return `hotels` array in the enrichment response with: name, image, price range (min/max), rating, coordinates, hotel_key (for future rate lookups)
- Apply 8-second timeout (already exists via `fetchWithTimeout`)

### Step 2: Update HotelData type to support real data
**File: `src/contexts/TripContext.tsx`**
- Add optional fields: `realImage?: string`, `priceRange?: { min: number; max: number }`, `rating?: number`, `isLive?: boolean`, `hotelKey?: string`

### Step 3: Merge real hotel data in Chat.tsx
**File: `src/pages/Chat.tsx`**
- When enrichment returns `hotels` array, replace or augment the AI-generated hotel cards with real Xotelo data
- Map Xotelo fields to HotelData: use real image URL, real price range, real name/location
- Set `isLive: true` on real hotels

### Step 4: Update HotelCard to show real data
**File: `src/components/HotelCard.tsx`**
- When `hotel.isLive` is true, show "Live" badge instead of "Est." badge
- When `hotel.realImage` exists, use it instead of the static Unsplash map
- Show price range (e.g. "$120–$180/night") when available instead of single price
- Show TripAdvisor rating if available

### Step 5: Update HotelDetailModal for real data
**File: `src/components/HotelDetailModal.tsx`**
- Use `realImage` when available
- Show price comparison range
- Show "Live prices" indicator

## Files to Modify
- `supabase/functions/enrich-destination/index.ts` — add Xotelo API calls
- `src/contexts/TripContext.tsx` — extend HotelData type
- `src/pages/Chat.tsx` — merge real hotel data from enrichment
- `src/components/HotelCard.tsx` — render real images, prices, live badge
- `src/components/HotelDetailModal.tsx` — render real data in detail view

## Limitations
- Xotelo is free but rate-limited — we fetch once per destination enrichment
- `/rates` (per-hotel real-time pricing) is slower and requires a hotel_key per hotel — we can add this as a "Check live prices" button in the detail modal later
- Images come from TripAdvisor CDN — quality is good but varies

