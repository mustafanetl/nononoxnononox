
## What's actually broken

Looking at the message you pasted, three problems compounded:

1. **AI1 dropped the code fences.** It wrote `activities\n[{...}]` instead of ` ```activities\n[{...}]\n``` `. Our parser in `Chat.tsx` only recognizes fenced blocks, so the raw JSON leaked into the chat as text and no cards rendered.
2. **AI1 (gemini-2.5-flash) invented venues.** "The Nest Cocktail Bar" in Brunkebergstorg, generic "Etoile" descriptions, etc. The reviewer (AI2) only checks the text — it can't actually verify the place exists on Google Maps.
3. **No real photos.** The activities used `"image":"food"` (generic gradient placeholder) because the venue names didn't match a real Google Place, so enrichment dropped the photos.

## The fix — three layers

### Layer 1 — Stronger AI1 + fence-tolerant parser

```text
User → AI1 (upgraded model, stricter fence rules)
         ↓
       Parser: tolerate missing fences, recover blocks anyway
```

- **Switch AI1 from `google/gemini-2.5-flash` → `google/gemini-3-flash-preview`** (better instruction-following, far less likely to drop fences).
- **Add to system prompt** an explicit "FORMATTING IS NON-NEGOTIABLE" section with a wrong-vs-right example showing the exact ` ``` ` fences.
- **Patch `parseMessageContent` in `src/pages/Chat.tsx`** to also recognize **unfenced** blocks: if it sees a line that is exactly `activities` / `itinerary` / `hotels` / `flights` / `destination_enrich` / `travelinfo` / `quickreplies` / `places` followed by a JSON array or object, treat it as that block. This is the safety net so old/sloppy responses still render as cards.

### Layer 2 — Real Google Places verification for every venue (AI2 → real API)

Right now `review-trip-plan` is just another LLM guessing whether places are real. It isn't. We replace its core check with the actual Google Places API.

```text
AI1 plan → Reviewer
              ├─ for each venue (activities + itinerary slots + hotels):
              │     Google Places Text Search (name + destination)
              │     ↓
              │     ├─ found? → swap in the REAL place_id, name, lat/lng, photo_reference
              │     └─ not found? → flag as issue + suggest alternative
              │
              ├─ all venues verified → approve, return ENRICHED plan
              └─ any unverified → request_revision with concrete swap suggestions
```

Files:
- **Rewrite `supabase/functions/review-trip-plan/index.ts`** to:
  - Parse all venue names out of the plan blocks.
  - For each venue, call Google Places **Text Search (New)** — `https://places.googleapis.com/v1/places:searchText` with `textQuery: "<venue> <destination>"`, fields `id,displayName,location,photos,rating,formattedAddress`.
  - If a result exists: keep the venue, attach `placeId`, real `lat`/`lng`, `photo` (first photo name), and `rating`.
  - If no result: add to `issues[]` with text like `"Tak in Stockholm — couldn't verify on Google Maps. Replace with a real Stockholm fine-dining venue (e.g., Operakällaren, Frantzén, Mathias Dahlgren)."`
  - Return either `{approved:true, enrichedPlan: <patched markdown>}` or `{approved:false, issues:[...]}`.
- The reviewer becomes a **fact-checker**, not a second opinion.

### Layer 3 — Use the verified data downstream

- **`useRzumaChat.ts`**: if review returns `enrichedPlan`, replace `assistantContent` with it before showing — so the cards render with verified names + real coords.
- **`Chat.tsx` enrichment step** (already calls `enrich-destination`): now that AI2 has guaranteed every venue is a real Google Place, the existing photo-fetch will succeed for ~all activities/hotels instead of dropping them or showing gradient placeholders.

## Files changed

| File | Change |
|---|---|
| `supabase/functions/rzuma-chat/index.ts` | Model → `google/gemini-3-flash-preview`; add stronger fencing rules + wrong/right example to system prompt |
| `supabase/functions/review-trip-plan/index.ts` | Replace LLM-only review with Google Places Text Search verification of every venue; return enrichedPlan with real coords + placeIds, or concrete swap suggestions |
| `src/pages/Chat.tsx` | `parseMessageContent`: add fallback regex for unfenced blocks (`^activities\n[...]`) |
| `src/hooks/useRzumaChat.ts` | If reviewer returns `enrichedPlan`, swap it into the assistant message before final render |

## Trade-offs

- **+1 Google Places call per venue** during review — typically 8–15 calls per plan. Costs ~$0.005/plan at current Places pricing. Worth it for 100% real venues.
- **+2–4s latency** during the QA "verifying" phase (already shown to user). No change to streaming feel.
- **AI2 no longer hallucinates approvals** — it has hard evidence (or no evidence) for every venue.
- Reviewer `MAX_REVISIONS` stays at 3, but with real Places data, attempt 1 will usually pass.

Approve and I build.
