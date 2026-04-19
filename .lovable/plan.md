

User wants: every result must have a real photo. No photoless cards, no fake/wrong photos either.

Current behavior:
- `enrich-destination` (after recent verification work) returns `verified: false` + no photo when name match isn't confident → cards render with gradient placeholder + "AI suggested" badge.
- `PlacesGallery` shows placeholder cards when no photo found.
- Same for `ActivityCard` / `HotelCard`.

User's rule: if we can't get a real verified photo, **don't show the item at all**. Better to show 6 solid items than 10 with gray boxes.

## Plan: Hide unverified items, keep only ones with real Google photos

### 1. Backend: be honest about photo source
`supabase/functions/enrich-destination/index.ts`
- Keep strict Jaccard/word-token matching already in place.
- For each activity / hotel / place: only return `photo` URL if Google Places returned an actual photo for a confidently matched venue.
- Add `hasRealPhoto: true/false` flag explicitly so frontend can filter.

### 2. Frontend: filter out photoless items before render
`src/pages/Chat.tsx`
- After enrichment resolves, drop activities/hotels where `hasRealPhoto !== true`.
- If a day ends up empty after filtering, show a small note ("a few suggestions couldn't be verified — ask me to find more").

`src/components/PlacesGallery.tsx`
- After photo fetch resolves, remove items with no photo from the rendered list (instead of showing gradient + "AI suggested").
- If everything fails (rare), show a single "couldn't find verified photos for these — try a more specific query" message.

### 3. AI prompt nudge
`supabase/functions/rzuma-chat/index.ts`
- Add: "Prefer iconic, well-photographed places. The system will hide any suggestion we can't verify with a real photo, so quality > quantity."
- Bump list requests slightly (ask for 12 instead of 10) so after filtering we still land near the requested count.

### 4. Loading UX
- Keep skeleton placeholders during fetch (so the list doesn't flicker shorter).
- Only filter once all enrichment promises settle.

## Files to change
| File | Change |
|---|---|
| `supabase/functions/enrich-destination/index.ts` | Add explicit `hasRealPhoto` flag; never attach photo unless Google returned one for a verified match |
| `supabase/functions/rzuma-chat/index.ts` | Prompt: prefer iconic places; ask for ~20% more items to absorb filtering |
| `src/pages/Chat.tsx` | Filter activities/hotels missing real photos before rendering |
| `src/components/PlacesGallery.tsx` | Drop unphotoed places after enrichment settles |

## Outcome
Every card the user sees has a real Google Places photo of the actual place. Nothing photoless, nothing faked. If we can't verify it, it doesn't show up.

