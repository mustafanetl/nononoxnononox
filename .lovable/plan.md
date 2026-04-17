

The user asked "Top 10 nature places to visit before I die" — got a list back but no photos. Reason: this is a LOCAL/list-style query, not a TRIP plan. The chat only triggers Google Places enrichment when there's a `destination` field on a trip plan. List-style answers (multiple places, no single destination) skip enrichment entirely, so no images load.

Looking at Chat.tsx enrichment trigger — it runs once per AI message keyed on `destination`. For a top-10 list, the AI either returns prose or activities without a parent destination, so `enrichDestination` is never called per place.

## Plan: Add image enrichment for list-style/multi-place answers

### 1. Update AI prompt (`supabase/functions/rzuma-chat/index.ts`)
For list-style answers ("top X places", "best beaches", "must-see..."), require the AI to emit a structured `places` block:
```
\`\`\`places
[{"name": "Banff National Park", "location": "Alberta, Canada", "why": "..."}]
\`\`\`
```
Each item must include `name` + `location` (country/region) so we can geocode/photo-match each one individually.

### 2. Parse `places` block (`src/pages/Chat.tsx`)
Extract the new `places` array from streamed content alongside existing flights/hotels/activities parsing.

### 3. Per-place photo enrichment
Reuse `enrich-destination` edge function in `imageOnly` mode, calling it once per place in the list (parallel, capped at 10). Cache results by `name+location`. Use the first verified Google Places photo as the card image.

### 4. New `PlaceShowcase` rendering for lists
The `PlaceShowcase.tsx` component already exists — extend or render it as a grid/carousel of place cards (image, name, location, short "why"). Show gradient placeholder while loading, then swap in the verified Google photo. No image = no fake fallback (consistent with existing trust rules).

### 5. Trust badges
Same "Verified" / "AI suggested" badges as activity cards so users know which photos are real Google matches.

## Files to change
| File | Change |
|---|---|
| `supabase/functions/rzuma-chat/index.ts` | Add `places` block format to prompt for list-style queries |
| `src/pages/Chat.tsx` | Parse `places` block, batch-call enrichment in imageOnly mode, render showcase |
| `src/components/PlaceShowcase.tsx` | Render verified place cards with photos + trust badges |

## Outcome
Asking "top 10 nature places to visit" returns a visual gallery — each place shows its real Google Places photo (when verified), location, and a short reason. No more text-only lists.

