

# Integrate Google Places API for Real Photos & Places

## Why
Currently the app uses Wikimedia Commons for images (often generic/low quality) and Wikipedia geosearch for nearby places (limited data, no ratings, no photos). Google Places API provides high-quality place photos, ratings, reviews, opening hours, and curated place data.

## What's Needed

**Google Places API key** — This is a paid API. Google offers $200/month free credit (~$17/1000 photo requests). You'll need to:
1. Create a Google Cloud project
2. Enable "Places API (New)" 
3. Generate an API key
4. I'll store it securely as a backend secret

## Changes

### 1. Add Google Places API secret
- Use the `add_secret` tool to request your `GOOGLE_PLACES_API_KEY`

### 2. Replace Wikimedia + Wikipedia with Google Places in enrichment
**File: `supabase/functions/enrich-destination/index.ts`**

- **Replace `getWikimediaImages()`** with `getGooglePlacePhotos()` — uses Places Text Search to find the destination, then fetches up to 6 place photos via the Place Photos API. Returns photo URLs served through Google's CDN.
- **Replace `getWikipediaPlaces()`** with `getGoogleNearbyPlaces()` — uses Nearby Search to find top-rated attractions, restaurants, and points of interest. Returns name, rating, user ratings count, opening hours, photo, price level, and lat/lng.
- Keep all other data sources (weather, country info, exchange rates, Xotelo hotels) unchanged.

### 3. Update city images utility
**File: `src/utils/cityImages.ts`**
- Update `setWikimediaImage` → `setPlaceImage` to cache Google-served photo URLs
- Keep Unsplash fallbacks for when API quota is exhausted

### 4. Update components consuming place data
- Components already display `thumbnail`, `title`, `description`, `rating` — Google Places returns richer versions of all these fields, so the shape stays compatible with minimal mapping adjustments.

## API Calls Used (per destination enrichment)
- 1x Text Search (find place) — ~$0.032
- 1x Nearby Search (attractions) — ~$0.032  
- ~6x Place Photos — ~$0.042
- **Total: ~$0.10 per destination** → ~2000 free enrichments/month

## Files to Modify
- `supabase/functions/enrich-destination/index.ts` — replace Wikimedia/Wikipedia functions with Google Places
- `src/utils/cityImages.ts` — update cache to work with Google photo URLs

