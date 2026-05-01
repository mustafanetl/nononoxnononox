## Goal

Replace the current "Crafting your plan…" progress-bar/spinner with a cinematic animated map that:
1. Shows a flight line drawing itself from the user's origin city to the destination.
2. Then drops circular photo "pins" of the destination + each planned activity, one by one, connected by drawn lines.

This plays during the ~12s plan-crafting window (and stays in sync with streaming end), in the same spot the current crafting card occupies.

## Visual sequence (~12s)

```text
phase 1 (0–4s)  flight leg
  origin ●———————————————✈———————————————→ ● destination
  (animated dashed line drawing left→right, plane glyph traveling along it,
   destination circle pops in with city photo)

phase 2 (4–11s)  activities
  destination ●——→ ◯ activity 1 (photo)
                 \
                  ——→ ◯ activity 2 (photo)
                       \
                        ——→ ◯ activity 3 ...
  (each new circle fades+scales in with its Google Places photo, line draws
   from the previous point to it, count "1 of 5… 2 of 5…" updates below)

phase 3 (11–12s)  settle
  full route visible, soft pulse on destination, then fade out as the real
  plan content reveals.
```

Photos are circular thumbnails (`rounded-full`, 56–72px) with a thin white ring + soft shadow, matching the existing minimalist B/W aesthetic.

## What replaces what

In `src/pages/Chat.tsx` (lines ~1006–1057), the entire "Plan crafting animation" block (Compass icon + label + progress bar) is replaced by a new component `<PlanCraftingMap />`.

Caption underneath stays minimal:
- Phase 1: `Plotting your route to {destination}…`
- Phase 2: `Pinning {activity name}… (2 of 5)`
- Phase 3: `Almost ready…`

No percentage number, no progress bar.

## New component: `src/components/PlanCraftingMap.tsx`

Props:
- `originCity: string` (e.g. "Stockholm")
- `destinationCity: string` (e.g. "Linköping")
- `activities: { name: string; photo?: string }[]` — derived from the streamed `activities` / `itinerary` blocks as they arrive
- `progress: number` (0–100, drives which phase to show)

Implementation:
- An SVG canvas (~100% width × 280px) draws a stylised world/region backdrop using a single subtle SVG path (no real map tiles — keeps it lightweight and on-brand).
- A `<path>` for the flight leg uses `stroke-dasharray` + animated `stroke-dashoffset` to "draw" itself (~3.5s).
- A small ✈ glyph (`<animateMotion>` along the same path) flies from origin to destination.
- Circular photo nodes are absolutely positioned `<div>`s overlaid on the SVG using percentage coords; each one mounts in sequence using staggered timeouts driven by `progress` thresholds.
- Lines between activity pins are additional SVG `<path>`s that animate their dash-offset on mount.
- Photos come from `enrichedData[activity.name]?.photo` if available, otherwise a B/W initials placeholder circle (consistent with existing "no stock images" rule).

Everything scales down gracefully on mobile (height 220px, smaller circles).

## Wiring in `Chat.tsx`

1. Build a memo `craftingActivities` that, whenever `messages[last].content` updates during crafting, parses the streamed ` ```activities` and ` ```itinerary` blocks and extracts up to ~6 activity names (deduped, in order).
2. Pull `originCity` from user profile / settings (already used elsewhere as "home city"); fall back to `"Home"`.
3. Replace the existing crafting JSX with:
   ```tsx
   <PlanCraftingMap
     originCity={originCity}
     destinationCity={craftingPlan.destination || "your destination"}
     activities={craftingActivities}
     progress={craftingPlan.progress}
   />
   ```
4. Keep all existing timing / `craftingActive` / streaming-done logic untouched — only the visual is swapped.

## Photo source

Reuses the existing `enrichedData` map already populated by `enrich-destination` for the streaming message. No new API calls. If a photo isn't ready when a circle appears, we render the initials placeholder and swap to the real photo when it arrives (simple `useEffect` on `enrichedData`).

## Files touched

- **new** `src/components/PlanCraftingMap.tsx` — the animated SVG map component
- **edit** `src/pages/Chat.tsx` — swap the crafting block, add `craftingActivities` memo, pass props

No backend, edge function, or schema changes.

## Out of scope

- Real interactive Leaflet map (kept for the actual trip view; this is pure animation).
- Changing the 12s timing or the streaming/QA controller.
- Adding new images — only photos already enriched via Google Places are used.