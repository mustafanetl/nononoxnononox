

# Fix: AI Discovery Flow + Plan Gating for Free Users

## Problems Found

1. **AI shows place images too early** — The prompt tells it to show `place_images` for every place mentioned. User wants natural chat first with quick reply suggestion buttons, no images until deeper in the conversation.

2. **Full plan leaks to free users** — The `isFullPlan` detection on line 647 only counts flights, hotels, and activities. It **misses itinerary**, so LOCAL/DATE plans (activities + itinerary, no flights/hotels) slip through as `cardTypeCount = 1` and render all cards directly.

3. **AI rushes to plan** — Despite "3-4 exchanges" rule, the AI often generates the plan too fast. Need stronger enforcement.

## Changes

### 1. `supabase/functions/rzuma-chat/index.ts` — Fix AI behavior

- **Remove `place_images` from early discovery.** The AI should NOT show place images in the first 2-3 messages. It should chat naturally, ask questions, and use quickreplies for suggestions. Only show `place_images` after the user has shared enough info (who, when, vibe) and you want to confirm a specific spot.
- **Strengthen the "don't rush" rule.** Add explicit counting: "Count the exchanges. If fewer than 4 user messages, do NOT generate a plan. Keep asking."
- **Make quickreplies more prominent in early messages.** Every discovery message should end with 2-3 contextual quickreplies that help the user share preferences.
- **Add FOMO/personal touch in the "let me cook" message.** After discovery, the teaser message should mention specific things: "I found this insane rooftop bar you're gonna love..."

### 2. `src/pages/Chat.tsx` — Fix plan detection

- **Add itinerary to `isFullPlan` count** (line 647): Include `parsed.itinerary.length > 0` in the array so LOCAL/DATE plans also get gated.
- This single fix ensures ALL plan types show `PlanPreviewGate` for free users instead of leaking the full cards.

### 3. No changes needed to `PlanPreviewGate.tsx`

The component already looks good — hero image, blurred activities, inline paywall with 3-day trial. The issue was just that it wasn't being triggered for all plan types.

## Files

| File | Change |
|------|--------|
| `supabase/functions/rzuma-chat/index.ts` | Remove early `place_images`, enforce 4+ exchanges, better quickreplies |
| `src/pages/Chat.tsx` | Add itinerary to `isFullPlan` detection (line 647) |

## Summary

Two targeted fixes: (1) rewrite the AI prompt so it chats naturally first without images, uses quickreplies, and only shows `place_images` later in discovery; (2) fix the plan detection to include itinerary so all plan types get properly gated behind the paywall for free users.

