

# Polish the Conversion Funnel: Real Images + Build Anticipation

## Summary

Three targeted changes to make the free-user experience feel premium and worth paying for:

1. **Real Google Places hero image on the paywall card** — fetch just 1 city photo (no hotels, weather, etc.) for free users so the "View Full Plan" card looks stunning with a real photo instead of generic Unsplash stock.

2. **"Crafting your plan" loading animation** — when the AI generates a full plan (detected by streaming multiple card blocks), show a progress state with destination name: *"Putting together your Bali plan..."* with a subtle progress bar. This builds anticipation and makes the user feel effort went into it.

3. **AI prompt tuning** — instruct the AI to take at least 3-4 discovery steps before generating the plan. Add a rule: "NEVER generate the full plan until you've asked at least 3 questions. Make the user feel heard." Also reinforce personalization per mode.

## Changes

### 1. Lightweight image fetch for free users (`Chat.tsx`)

When a free user's message contains `destination_enrich`, fetch **only** a Google Places city photo (1 API call, no hotels/weather/Xotelo). Create a new minimal edge function or add a `imageOnly=true` param to the existing `enrich-destination` function.

**`supabase/functions/enrich-destination/index.ts`** — Add support for `imageOnly: true` in the request body. When set, skip weather, country, hotels, activity photos — only run `getGooglePlacePhotos(destination, 1)` and return `{ images: [...] }`. This costs 1 Google API call vs ~10+ for full enrichment.

**`src/pages/Chat.tsx`** — For free users (`!isPremium`), when `destinationEnrich` is detected, call `fetchEnrichment` with a new `imageOnly` flag. Store the result so `PlanPreviewGate` gets `enrichedImages`.

### 2. Plan crafting animation (`Chat.tsx` + `PlanPreviewGate.tsx`)

When the AI is streaming and we detect it's building a full plan (content contains ` ```flights` or ` ```hotels` or ` ```activities`), show a "crafting" overlay instead of raw streaming cards:

- Text: "Putting together your {destination} plan..." 
- Subtle animated progress bar
- Small destination image in background
- Once streaming completes → fade into the `PlanPreviewGate` card

This replaces the current behavior where free users watch cards stream in then get blocked. Instead they see a beautiful loading state, then the polished gate card.

### 3. AI prompt: slow down discovery (`rzuma-chat/index.ts`)

Add to the system prompt:
- "NEVER generate the full plan until you've completed at least 3 discovery steps. The user should feel like you're really thinking about their trip."
- "After the last discovery question is answered, say something like 'okay give me a sec, putting this together for you...' before generating the plan blocks. This builds anticipation."
- Reinforce showing `place_images` during each discovery step.

## Files

| File | Change |
|------|--------|
| `supabase/functions/enrich-destination/index.ts` | Add `imageOnly` mode — returns only 1 Google Places photo |
| `src/pages/Chat.tsx` | Fetch image-only enrichment for free users; add plan crafting detection + animation |
| `src/components/PlanPreviewGate.tsx` | Accept + display enriched Google image as hero |
| `supabase/functions/rzuma-chat/index.ts` | Add minimum 3-step rule + anticipation message before plan |

## What this achieves

- Free users see a **real photo** of their destination on the paywall card — feels premium
- The "crafting" animation makes them feel effort went into their plan — increases willingness to pay
- Slower discovery with more questions = more emotional investment before the gate
- Only 1 Google API call per free plan generation (vs 10+ for premium) — cost controlled

