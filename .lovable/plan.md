## What's actually wrong (from the screenshot)

Looking at the Stockholm map you sent, three real problems stack up:

1. **Hotel pin is an empty white circle.** The image URL is set but the photo never loads (broken/blocked Google Places URL → CSS background renders nothing). There's no fallback bed icon visible inside.
2. **Day 1 is missing entirely.** Filter chips show "All days · Day 2 · Day 3 · Hotel" — Day 1 has zero pins. Same reason most other slots are missing: only **3 stops total for a 3-day trip**.
3. **Pins look inconsistent in size.** Hotel reads as bigger and emptier than the activity pins.

## Root cause of missing pins

`slotCoords()` in `TripDetail.tsx` only looks up coordinates from `data.activities` (the AI-generated activity cards). When the AI's `itinerary.slots` reference a venue that *isn't* in the small `activities` list — which is most of the time — we drop the pin.

Meanwhile, the `enrich-destination` edge function already calls Google Places Text Search for every venue, but its FieldMask **doesn't request `places.location`**, so we throw away the real lat/lng Google would have given us. Same for hotels.

Result: the map only ever shows the 3-4 venues that happen to also be in the activities list, instead of all itinerary stops.

## The fix

### 1. Get real coordinates from Google Places (backend)
In `supabase/functions/enrich-destination/index.ts`:
- Add `places.location` to the FieldMask in both `searchAndValidateActivities` and `searchAndValidateHotels`.
- Store `lat: bestPlace.location?.latitude` and `lng: bestPlace.location?.longitude` in the result objects (alongside `photo`, `address`, etc.).

### 2. Use those coordinates everywhere (frontend)
In `src/pages/TripDetail.tsx`:
- Extend the `VenuePhotoMatch` type to include optional `lat`/`lng`.
- Update `slotCoords()` to try the photo-match first, then fall back to the `activities` list, then return null.
- For hotels, when a hotel object lacks `lat`/`lng`, look it up in the photo-match collection too.

This unlocks pins for **every** itinerary stop and the hotel, not just the handful that appear in the activities array.

### 3. Hotel pin: bulletproof fallback (frontend)
In `src/components/TripMap.tsx`:
- Replace the CSS `background-image` photo path with a real `<img>` tag. If the image fails to load, swap it for the colored bed-icon fallback via an `onerror` handler.
- Same for activity photos — broken photo URLs should reveal the day-color number, not a white void.

### 4. Visual consistency
- Make hotel and activity base size identical (44px) — drop the special 46px for hotels. Keep focused activity at 50px.
- Keep the day-color outline ring and corner badge as they are now.

### 5. Re-enrich existing trips (optional, low risk)
Since current trips were enriched before the FieldMask change, their cached `itineraryVenuePhotos` won't have `lat`/`lng` until re-enriched. The map will simply work for new trips immediately and progressively improve as old trips get re-opened (each open triggers enrichment of any venues missing from the cache, but only if they were already missing photos). For best results, the user can re-generate the trip — but no migration is required.

## Files to edit
- `supabase/functions/enrich-destination/index.ts` — add `places.location` to both FieldMasks; store `lat`/`lng` in results.
- `src/pages/TripDetail.tsx` — extend `VenuePhotoMatch` type; update `slotCoords` and `hotelPins` to use Places coordinates.
- `src/components/TripMap.tsx` — `<img>` with `onerror` fallback; unified pin size.

## Out of scope
No changes to the AI prompt, the click/modal logic, the day-filter chips, or polylines.
