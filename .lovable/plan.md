## Goals

1. **Remove stop numbers from map pins** — keep only the photo/dot, no numeric badge or fallback number.
2. **Fix missing activity photos** in plans (Gothenburg has many slots without images).
3. **Better city hero image** — currently Gothenburg shows a flower close-up (from Botanical Garden) instead of a recognizable city shot.

---

## Changes

### 1. `src/components/TripMap.tsx` — remove stop numbers

- Remove the corner number badge for activities (line ~197-199). Hotels keep the bed-icon badge.
- Replace the numeric fallback (used when an activity has no photo) with a small white dot inside the colored circle, so pins still look intentional but never display a number.
- Update tooltip subtitle to drop the "· Stop N" suffix; keep just `Day N` for activities and `Hotel` for hotels.

### 2. Activity photo coverage — backend `supabase/functions/enrich-destination/index.ts`

Root cause: `searchAndValidateActivities` caps the batch at **18 venues** (`.slice(0, 18)`). A 3-day plan with breakfast/lunch/dinner + sights + neighborhoods easily exceeds this, leaving later slots photoless.

- Raise the cap from 18 → **40** activity venues (still bounded; each call is parallel and cheap).
- Raise hotel cap from 8 → **15** for symmetry with multi-city trips.
- Add a third fallback inside `searchAndValidateActivities`: when the strict + name-only matches fail, retry the search with **just `actName` + the country name** (when known via `geo.countryCode`) for foreign-named venues that don't surface under the city-scoped query.
- For Swedish/foreign-character names (Gothenburg = Göteborg), also retry once with the destination wrapped as a generic `near {destination}` query if zero results came back.

### 3. Hero image quality — `getGooglePlacePhotos` in the same edge function

Current query is `"famous landmarks and attractions in {destination}"` with `includedType: "tourist_attraction"`. For Gothenburg the top tourist attraction is the Botanical Garden, so the hero ends up as a flower macro shot.

- Replace the hero-photo fetch path with a two-stage strategy:
  1. **Primary**: text query `"{destination} skyline cityscape"` with NO `includedType` filter — surfaces wide city shots from photographers/landmarks.
  2. **Fallback**: existing query if the primary returns nothing.
- Filter out photos with extreme aspect ratios (height > width) which are typically portrait/macro shots, not cityscapes — keep only landscape (`widthPx >= heightPx * 1.2`) for the first hero slot, then fill remaining slots normally.
- Bump `maxWidthPx` for the primary hero photo to `1920` for crisper full-bleed display.

### 4. Front-end hero selection — `src/pages/TripDetail.tsx`

- When picking `heroImg` (line ~264), prefer the first image whose dimensions look landscape (`width > height`) over raw `[0]`. This guarantees a banner-friendly photo even if the API still returns one portrait shot.

---

## Technical notes

- No DB changes, no new secrets.
- Edge function `enrich-destination` redeployed automatically.
- Existing trips: hero won't change retroactively because `enrichedImages` is cached in `sessionStorage`/`tripData`. New plans (and any plan re-opened after a "Refresh" or hard reload that triggers re-enrichment) will get the better hero.
- Map pin change is purely visual — no data shape changes.

## Files touched

- `src/components/TripMap.tsx`
- `src/pages/TripDetail.tsx`
- `supabase/functions/enrich-destination/index.ts`
