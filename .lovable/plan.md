

# Plan: Google Places Photos for Hotels & Flights

## Problem
Hotels get images from Xotelo (`h.photo`), which is often `null`. The fallback is generic city-level Google images — not specific to each hotel. Flights similarly get generic destination photos. The user wants every item to have its own Google Places photo.

## Solution

### 1. `supabase/functions/enrich-destination/index.ts`
- Add a new `searchHotelPhotos()` function (similar to `searchActivitiesPhotos`) that does a per-hotel Google Places Text Search using `"{hotelName} hotel in {destination}"` to get a photo specific to each hotel
- Call it in the main `Promise.all` alongside activities
- Return `hotelPhotos` map in the response (hotel name → photo URLs)
- For flights: add a `searchCityPhoto()` that searches the destination city and the origin city to get distinct photos for each flight card

### 2. `src/pages/Chat.tsx`
- After enrichment, apply `hotelPhotos` to hotels: match by name, set `realImage` from Google Places before falling back to Xotelo or destination images
- For flights: apply city-specific Google images per flight destination city

### Files Modified
| File | Change |
|---|---|
| `supabase/functions/enrich-destination/index.ts` | Add `searchHotelPhotos()` for per-hotel Google Places lookup |
| `src/pages/Chat.tsx` | Apply per-hotel Google photos from enrichment response |

