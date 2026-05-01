## Goal
Make the trip map pins feel calm, consistent and "right-sized". Fix the hotel marker so it always shows something nice (image when we have one, otherwise a clean bed icon — never a broken/empty circle).

## Problems today
1. **Hotel circle has no image** — when `h.realPhoto` / `h.image` are missing, the marker still goes through the photo path with an empty url, leaving a blank white disc.
2. **Pin sizes feel off** — pins are large (48–56px), the focused state inflates them by ~17%, and the white ring + outer 1px shadow ring + number badge makes them look noisy and inconsistent next to each other (especially hotel vs activity).
3. **Visual hierarchy is unclear** — every pin competes for attention; nothing reads as "primary" vs "secondary" at a glance.

## Fix

### 1. Robust hotel pin (TripDetail.tsx)
Tighten the photo source so we never pass an empty string into the map:
- Try `realPhoto` → first `realPhotos[]` → `image` → `thumbPhoto` → `undefined` (not `""`).
- Pass `undefined` instead of falsy strings so the map cleanly falls back to the icon variant.

### 2. Calmer, smaller, consistent pins (TripMap.tsx)
- **Sizes**: activity = 36px, hotel = 40px, focused activity = 42px. (Down from 48/56.)
- **One ring, not two**: drop the `box-shadow: 0 0 0 1px accent` outer ring. Keep a single 2px white inner ring + soft drop shadow. The day color shows on the number badge / icon background, not as a second halo.
- **Number badge**: smaller (16px), bottom-right instead of top-right so it doesn't collide with the tooltip arrow, only shown for activities with a photo.
- **Hotel pin**: when no photo, render a solid `--primary` circle with a white `Bed` icon (already in code) — but at the new 40px size and without the double ring. When a photo exists, show the photo with a small bed badge in the corner so users still recognize it as a hotel.
- **Dimmed (non-active day)**: lower opacity to 0.4 and remove drop shadow so focused day truly pops.
- **Hover**: subtle `transform: scale(1.08)` via existing transition; no size jump on "focused" day selection beyond +6px to avoid jitter.

### 3. Tooltip offset
Recompute tooltip `offset` from the new sizes so it sits just above the pin, not floating in space.

## Files to edit
- `src/pages/TripDetail.tsx` — harden hotel `photo` resolution (lines ~407-415).
- `src/components/TripMap.tsx` — pin size constants, single-ring style, badge position, hotel-with-photo bed badge, tooltip offset.

## Out of scope
No changes to itinerary data, day filter UI, polylines, or click/modal behavior — those are working well.
