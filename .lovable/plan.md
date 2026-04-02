

# Improve Chat Quality & AI Results

## Problems Identified

1. **System prompt produces inconsistent results** — the AI sometimes generates incomplete plans (missing card types), gives overly verbose text, or doesn't follow the conversational flow (asking questions first, then generating cards).

2. **No "thinking" indicator when AI starts streaming** — loading dots disappear as soon as the first token arrives, but parsing/rendering may lag behind.

3. **Quick replies only show on the last message** — if the user scrolls up, they can't interact with earlier suggestions.

4. **Paywall blocks TripDetail but is hardcoded to `isPremium = true`** — confusing Crown icon still shows even though paywall is bypassed. Clean this up.

5. **Chat suggestions are static** — the 4 starter prompts never change and don't reflect seasons, trending destinations, or variety.

6. **No typing animation on AI text** — text appears in chunks rather than feeling smooth, making the experience feel mechanical.

7. **Error state clears the user's message** — in `useRzumaChat`, on error, the user message is removed from the conversation, so the retry button in Chat.tsx may not work correctly since the message is gone from the conversation history.

8. **AI sometimes outputs malformed JSON blocks** — partial or broken JSON in streaming causes cards to not render at all, with no fallback.

## Plan

### Step 1: Improve system prompt for better, more consistent results
**File: `supabase/functions/rzuma-chat/index.ts`**
- Add clearer sequencing rules: "ALWAYS ask questions first unless the user provided destination + dates + group size"
- Add explicit instruction: "When generating a full plan, you MUST include ALL of these blocks: flights, hotels, activities, itinerary, travelinfo, weather, destination_enrich, quickreplies. Never skip any."
- Add quality guardrails: "Each activity MUST have a unique, specific name — never generic names like 'City Tour'. Include the actual place/venue name."
- Add price consistency rule: "Make sure the total budget adds up — don't suggest $50/night hotels alongside $500/night activities"
- Trim remaining redundancy in examples

### Step 2: Fix error handling & retry flow
**File: `src/hooks/useRzumaChat.ts`**
- Stop removing the user message on error — keep it in the conversation so retry works naturally
- Instead, add a `failed` flag on the last user message so the UI can show it differently

**File: `src/pages/Chat.tsx`**
- Update retry to simply re-send the last user message content (already works if we stop deleting it)

### Step 3: Remove paywall cruft
**File: `src/components/TripSummaryCard.tsx`**
- Remove the `useSubscription` hook, `PaywallModal`, and `Crown` icon
- Make `handleClick` always navigate directly to `/trip/view`
- This simplifies the component and removes confusing UI

### Step 4: Add graceful fallback for malformed JSON blocks
**File: `src/pages/Chat.tsx`**
- In `parseMessageContent`, when `JSON.parse` fails on a block, instead of silently skipping, check if the block looks nearly complete (e.g., has `[{` but missing closing `]}`). If so, try to auto-close and re-parse.
- This helps during streaming when blocks arrive incomplete.

### Step 5: Improve starter suggestions
**File: `src/pages/Chat.tsx`**
- Rotate suggestions based on current month/season (e.g., "Beach getaway in Cancun" in winter, "Fall foliage in Vermont" in autumn)
- Add more variety: include a local experience, a budget trip, and a luxury option

### Step 6: Better loading states
**File: `src/pages/Chat.tsx`**
- Show typing dots whenever `isLoading` is true AND no assistant content has appeared yet (not just when last message is from user)
- Add a subtle pulsing effect on the AI avatar while streaming

## Files to Modify
- `supabase/functions/rzuma-chat/index.ts` — improved system prompt
- `src/hooks/useRzumaChat.ts` — fix error handling (keep failed messages)
- `src/pages/Chat.tsx` — JSON fallback parsing, seasonal suggestions, better loading states
- `src/components/TripSummaryCard.tsx` — remove paywall/subscription code

