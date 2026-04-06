

# Real Place Images During Discovery (Google API)

## Problem
The current `PlaceShowcase` component uses hardcoded Unsplash stock photos from `cityImageSets`. The AI sends `place_images` blocks but they show generic stock — not real Google Places photos. The user wants real images from Google API shown during discovery, one place at a time, making the conversation feel authentic and personal.

## Strategy

Replace the stock Unsplash approach with real Google Places photos fetched on-demand. When the AI mentions a place during discovery (via `place_images` block), the frontend calls the existing `enrich-destination` edge function with `imageOnly: true` to get 2-3 real Google photos. This costs 1 Google API call per place shown.

Also fix the AI prompt to be more natural — show ONE place at a time, ask what they think, react, then maybe show another. Not dumping `place_images` blocks everywhere.

## Changes

### 1. `src/components/PlaceShowcase.tsx` — Fetch real Google images

Instead of reading from `cityImageSets`, call `enrich-destination?imageOnly=true` with the place name. Show a skeleton loader while fetching, then display real Google Places photos in the carousel. Fallback to Unsplash stock only if Google returns nothing.

- Add `useEffect` that calls `fetchEnrichment(place, undefined, undefined, true)` on mount
- Store fetched images in state
- Show skeleton/shimmer while loading
- Display real photos with proper attribution
- Keep the existing carousel UI (just swap image sources)

### 2. `supabase/functions/enrich-destination/index.ts` — Return 3 photos in imageOnly mode

Currently `imageOnly` fetches only 1 photo. Change to fetch 3 photos so the carousel has content. Still just 1 Google API call (the search), only the photo URLs change.

### 3. `supabase/functions/rzuma-chat/index.ts` — Fix AI discovery behavior

Rewrite the discovery flow instructions to be more natural:
- Show ONE place per message, not multiple
- After showing a place, ask "what do you think?" or "does this vibe with you?"
- Based on their reaction, either continue with that place or suggest a different one
- Remove the instruction to show two places for comparison — keep it focused
- Make the AI react genuinely to user responses before moving on
- Remove the rigid "STEP 1, STEP 2, STEP 3" structure — let it flow naturally but still gather the same info

### 4. `src/pages/Chat.tsx` — Import `fetchEnrichment` for PlaceShowcase

Pass `fetchEnrichment` or the Supabase URL to `PlaceShowcase` so it can fetch images. Alternatively, have `PlaceShowcase` call the edge function directly (simpler — it already has access to env vars).

## Files

| File | Change |
|------|--------|
| `src/components/PlaceShowcase.tsx` | Fetch real Google Places photos via enrich-destination edge function |
| `supabase/functions/enrich-destination/index.ts` | Return 3 photos in imageOnly mode instead of 1 |
| `supabase/functions/rzuma-chat/index.ts` | Make discovery more natural — one place at a time, react, ask what they think |

## Cost Impact
- Each `place_images` block = 1 Google Places API call (Text Search)
- Typically 2-3 places shown during discovery = 2-3 API calls total
- This is acceptable — it's the hook that makes users want to pay

