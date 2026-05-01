## Why the current map feels messy

Reading `src/pages/TripDetail.tsx` and `src/components/TripMap.tsx`:

1. **Wrong day assignment.** Activity pins get a day via `(i % itinerary.length) + 1` — pure round-robin, not based on the actual itinerary slots. Day badges and per-day filtering are lying.
2. **Pins don't reflect the real plan.** Map points come from `data.activities` (3–5 generic cards), not from the itinerary slots the user actually sees on the page (6–8 stops × N days). So the map and the day-by-day timeline disagree.
3. **Click handler is unreliable.** `data.activities.find(a => a.name === name)` only matches a small slice; itinerary slot venues mostly fall through and nothing opens. When it does open it's the wrong activity.
4. **Visual mess.** 40px photo bubbles overlap heavily in dense city centers, with thick white rings + day badges + photos all fighting. No way to focus on a single day.
5. **Polyline is wrong.** It connects everything in insertion order (hotels then activities), zig-zagging across the city instead of tracing each day's route.

## What we'll build

A clean, itinerary-driven map that mirrors the day-by-day section, with a day filter, ordered route, smaller numbered chips, and a click that always opens the matching activity card.

### 1. Rebuild map points from the itinerary (`src/pages/TripDetail.tsx`)

Replace the current `mapPoints` derivation. New logic:

- For each `day.slots[i]` with resolvable lat/lng (via the matched activity from `matchActivity` or from `resolveVenuePhotoMatch` address fallback): emit one point with `{ name: slot.venue, lat, lng, day: day.day, order: i+1, photo, type: "activity" }`.
- Skip slots without coords instead of inventing them.
- Add hotel(s) once with `type: "hotel"`, no day, no order number.
- Drop the round-robin `(i % itinerary.length) + 1` assignment entirely.

This makes the map match what's shown in the day-by-day section exactly.

### 2. Add per-day filter UI in the map header

In `TripMap.tsx`, render a small pill row above the map (or in the header bar): `All · Day 1 · Day 2 · …` derived from the unique days in `points`. Selecting one filters markers + polyline and refits bounds. "All" shows everything.

State for `activeDay` lives inside `TripMap` (so other parts of the page don't need to change), default `null` = All.

### 3. Cleaner marker design

Smaller, calmer chips that don't fight each other:

- 28×28 numbered chip (white bg, 1px border, day-tinted). Number = slot order within its day (1, 2, 3 …).
- Hotel = small bed-icon chip in primary color, no number.
- When the user hovers, the chip scales to 36×36 and shows a tiny tooltip with the venue name.
- When a single day is selected, that day's chips get a subtle ring + the connecting polyline becomes solid (currently dashed) and tinted.
- Drop the photo-as-marker (caused the "messy" look). Photos still appear in the popup tooltip and the modal.

### 4. Per-day route polyline

Instead of one polyline through all points, draw one polyline per day connecting that day's slots in `order` (1 → 2 → 3 …). When `activeDay` is set, only that day's line shows; otherwise show all days dimmed.

### 5. Reliable click → modal (`TripDetail.tsx`)

Replace the brittle `name`-equality lookup. The map's `onMarkerClick` will pass `{ name, day, slotIdx, type }`. Then:

- `type === "hotel"` → open `HotelDetailModal` with the matched hotel.
- `type === "activity"` → reuse the same `openModal` logic the day-by-day section uses (matchActivity + resolveVenuePhotoMatch + fallback synthetic activity), so every pin opens the same rich card the user already sees in the timeline.

Refactor the `openModal` body from inside the slot `.map` into a reusable `openSlotModal(day, slotIdx)` helper at component scope so both the map and the timeline call the same code path.

### 6. Smooth UX details

- Default zoom: fit bounds with `padding: [60,60]`, `maxZoom: 15`, `animate: true`.
- Day-pill changes use `flyToBounds` with a 0.6s ease for smoothness.
- Marker hover uses CSS transform (GPU), no re-render.
- Cleanup: keep existing dispose guards; nothing to add.

### Files to edit

- `src/components/TripMap.tsx` — new marker style, per-day filter, per-day polylines, richer click payload.
- `src/pages/TripDetail.tsx` — rebuild `mapPoints` from itinerary slots; extract `openSlotModal` helper; wire it to `onMarkerClick`.

### Out of scope

- No backend changes, no new dependencies.
- Plan-crafting map (`PlanCraftingMap.tsx`) is untouched.
