

# Plan: Replace All Stock Images with Google Places API Photos

## Problem
Activities, hotels, flights, and the hero image all fall back to hardcoded Unsplash stock photos when enrichment data hasn't loaded or doesn't have a match. The user wants zero stock images — everything should come from Google Places API.

## Current Flow
1. **Enrichment edge function** already fetches per-activity Google Places photos and destination-level Google photos
2. **Chat.tsx** applies `realPhoto` to activities using enrichment data, and replaces hotels with Xotelo data (which may or may not have `realImage`)
3. **Fallback**: When `realPhoto`/`realImage` is missing, components use Unsplash stock image maps
4. **Hero image** on TripDetail uses `cityImages.ts` which is all Unsplash
5. **Flight cards** use `cityImages.ts` Unsplash fallbacks

## Solution

### 1. `src/components/ActivityCard.tsx`
- Remove the entire `imageMap` and `fallbackImages` arrays (all Unsplash URLs)
- Use `realPhoto` directly; if missing, show a simple gradient/placeholder with the category icon instead of stock photos

### 2. `src/components/HotelCard.tsx`
- Remove the entire `hotelImages` and `defaultPool` arrays
- Use `realImage` directly; if missing, show a styled placeholder with hotel name/stars

### 3. `src/components/ActivityDetailModal.tsx`
- Remove the `imageMap` object (Unsplash URLs)
- Use `activity.realPhoto` only; placeholder if missing

### 4. `src/pages/TripDetail.tsx`
- Remove `activityImageMap` and `activityFallback` arrays
- Remove `getActivityImage` function
- For hero image: use the first enriched Google image from `tripData.enrichedImages` instead of `getCityImage()` (Unsplash)
- For activity/hotel images in the detail view: use `realPhoto`/`realImage` directly with gradient placeholder fallback

### 5. `src/components/FlightCard.tsx`
- Stop using `getCityImage()` for the flight card background
- Use the enriched destination image if available via prop; otherwise show a gradient placeholder

### 6. `src/utils/cityImages.ts`
- Remove all Unsplash image IDs and sets
- `getCityImage()` returns only from `placeImageCache` (Google Places); returns empty string if no cached image
- `getPlaceImages()` same — only returns real cached images

### 7. `src/pages/Chat.tsx`
- After enrichment, also apply Google destination images to hotels that lack `realImage` from Xotelo
- Pass enriched Google images through to `FlightCard` via a new prop or by setting the city image cache

### 8. `src/components/TripSummaryCard.tsx`
- Already prefers `enrichedImages[0]` — just ensure the Unsplash fallback from `getCityImage` is replaced with a gradient placeholder

## Placeholder Design
When no Google image is available (enrichment pending or failed), show:
- A gradient background using the app's primary colors
- The relevant icon (plane, hotel, activity category) centered
- This ensures no broken images and a clean look while enrichment loads

## Files Modified
| File | Change |
|---|---|
| `src/components/ActivityCard.tsx` | Remove Unsplash maps, use realPhoto or placeholder |
| `src/components/HotelCard.tsx` | Remove Unsplash maps, use realImage or placeholder |
| `src/components/ActivityDetailModal.tsx` | Remove Unsplash map, use realPhoto or placeholder |
| `src/components/FlightCard.tsx` | Remove getCityImage usage, use placeholder |
| `src/pages/TripDetail.tsx` | Remove Unsplash maps, use enriched images or placeholder |
| `src/pages/Chat.tsx` | Apply Google images to hotels without realImage |
| `src/utils/cityImages.ts` | Remove all Unsplash IDs, return only cached Google images |
| `src/components/TripSummaryCard.tsx` | Replace Unsplash fallback with placeholder |

