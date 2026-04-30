## Goal

Right now the day-by-day itinerary is a clean text timeline — venue, time, neighborhood, cost — but **no photos per slot**. Activities have photos in the gallery below, but the timeline itself feels flat. We'll add real Google Places photos to every itinerary slot (matched by venue name), plus a swipeable "reels-style" mini-gallery for venues that have multiple photos.

## What changes

### 1. Edge function: return multiple photos per activity
`supabase/functions/enrich-destination/index.ts` — `searchAndValidateActivities` currently returns only one `photo` per venue. Extend it (mirroring the hotel logic) to also return a `photos: string[]` array of up to 4 photos. No new API calls — Google's response already includes multiple photo refs.

### 2. TripDetail itinerary slots: photos + reels gallery
`src/pages/TripDetail.tsx`

For each slot in the day timeline:

- **Match slot → activity** by `slot.venue` name (token-overlap, similar to existing `nameMatches` in the edge function — case-insensitive, ignore punctuation/stopwords). If matched, pull `realPhoto` and `realPhotos[]` from the activity.
- **Hero photo** beside the slot text on desktop (left column = photo ~160×160 rounded, right column = existing text). On mobile: photo on top, full-width, ~h-44.
- **Reels-style mini-gallery**: if the venue has 2+ photos, show a horizontally swipeable carousel of square tiles below the slot photo (snap scrolling, ~96px tiles, no scrollbar). Tapping a tile opens it in the existing `ActivityDetailModal` for the matched activity.
- **Fallback**: if no matched activity / no photo, show a small gradient tile with the venue's category icon (so the layout stays balanced — no empty space).
- Keep the existing timeline dot, time, transit-next line, and book-ahead badge.

### 3. Re-enrichment hook
The existing on-mount re-enrich already populates `realPhoto` per activity. Update the merge logic to also store the new `photos` array as `realPhotos` on each activity, and persist back to `sessionStorage` so reels survive reloads.

## Layout sketch (per slot)

```text
┌────────────┬─────────────────────────────────────┐
│            │ 10:30  · book ahead                  │
│  [photo]   │ Shinjuku Gyoen                       │
│  160×160   │ Morning Blossoms                     │
│            │ 📍 Shinjuku · ⏱ 2.5h · €3            │
│            │ [▣][▣][▣][▣]  ← reels strip          │
│            │ → 10 min walk                        │
└────────────┴─────────────────────────────────────┘
```

## Out of scope
- Real video reels (TikTok-style autoplaying clips). Google Places returns photos only, not video. We're using "reels-style" to mean the swipeable photo strip aesthetic. If you want actual video later, we'd need a separate provider (YouTube Data API search by venue name) — happy to add that as a follow-up.
- Touching activity gallery, hotels, or hero (those already have photos).

## Files
- `supabase/functions/enrich-destination/index.ts` — return `photos[]` per activity
- `src/pages/TripDetail.tsx` — slot photo column + reels strip + venue→activity matcher; persist `realPhotos`
