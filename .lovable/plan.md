

# Plan: Fix Image Repetition, Bugs & UX Improvements on Plan Page

## Problems Identified

### 1. Repetitive Images (Main Issue)
- **Activity cards** use a small static `imageMap` (~15 entries) in `ActivityCard.tsx` and `activityImageMap` in `TripDetail.tsx`. Activities with similar categories all get the same fallback image (e.g., all "beach" activities get the same beach photo).
- **Hotel cards** use a small static `hotelImages` map (~7 entries) in `HotelCard.tsx`. Multiple hotels with the same type (e.g., "luxury") show identical images.
- **Flight cards** use `cityImages.ts` which has ~16 entries — flights to unknown cities all get the same default image.
- **The enrichment system** already fetches real Google Places photos per-activity and per-hotel (via Xotelo), but these real images only apply when enrichment completes. The static fallbacks are too limited and repetitive.

### 2. Leaflet Runtime Error
- `Cannot read properties of undefined (reading '_leaflet_pos')` — occurs when the map container is removed/unmounted while Leaflet is mid-animation (zoom transition). The cleanup in `TripMap.tsx` doesn't guard against this race condition.

### 3. UX/UI Improvements for Trip Detail Page
- **Activity images on TripDetail** fall back to the same small `activityImageMap` — even when `realPhoto` is available from enrichment, it's not always passed through `sessionStorage`.
- **No visual distinction between days** in the overview itinerary — all days look the same.
- **Weather and travel info not shown** on the TripDetail page despite being available in the data.
- **Day view shows the same hotel** regardless of which day is selected — feels redundant.

## Implementation Plan

### File: `src/utils/cityImages.ts`
- Expand `cityImageIds` with ~15 more popular destinations (istanbul, seoul, lisbon, marrakech, cairo, prague, vienna, etc.) to reduce default fallback usage.

### File: `src/components/ActivityCard.tsx`
- Expand `imageMap` with ~10 more category images (wine, cooking, gardens, nightlife, ruins, etc.) to reduce repetition.
- Add a hash-based selector so activities with the same `image` key but different names get visually distinct fallback photos from the expanded set.

### File: `src/components/HotelCard.tsx`
- Expand `hotelImages` with more hotel type variants (modern, historic, eco, apartment, etc.).
- Add hash-based fallback selection so same-type hotels show different images.

### File: `src/pages/TripDetail.tsx`
- Expand `activityImageMap` to match `ActivityCard.tsx` expansions.
- Add hash-based image selection for activities and hotels to avoid identical images in the plan view.
- Add weather forecast section to the overview (data already exists in `data.weather`).
- Add travel info strip with live exchange rates to the overview (data already exists in `data.travelInfo`).
- Stop showing hotel in every day view if it's the same hotel — only show once in overview.

### File: `src/components/TripMap.tsx`
- Fix leaflet `_leaflet_pos` crash by wrapping cleanup in a try-catch and checking if the map container still exists before calling `.remove()`.
- Guard `updateMarkers` against stale map instance after unmount.

### File: `src/pages/Chat.tsx`
- Ensure enriched `realPhoto` and `realImage` data is properly passed through to `sessionStorage` when navigating to TripDetail, so real Google Photos persist across page loads.

## Summary
- ~6 files modified
- Fixes: repetitive images, leaflet crash, missing enriched photos on plan page
- UX: weather + travel info on plan page, smarter image variety, cleaner day views

