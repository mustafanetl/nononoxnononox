

# Let the AI Talk More + View Plan Card

## What Changes

The user wants the AI to feel more conversational — not restricted to 1 sentence — while still showing the "View Plan" summary card when a full plan is ready.

### Step 1: Update system prompt to allow more natural conversation
**File: `supabase/functions/rzuma-chat/index.ts`**

- Change "max 1 sentence of plain text per reply" → allow 2-3 sentences of friendly, conversational text. The AI should feel like a friend texting — casual, warm, helpful.
- Remove the strict "1 sentence MAX" rule (line 19). Replace with: "Keep it short and friendly — 2-3 sentences max. Be conversational, share a thought or tip about the destination. Don't repeat what cards already show."
- Keep the rule about not using exclamation marks and staying chill.

### Step 2: No changes needed to card/plan rendering
The current flow already works correctly:
- AI generates all card blocks → `isFullPlan` detects 2+ card types → shows TripSummaryCard with "View Full Plan" button
- User clicks → navigates to `/trip/view` with full detail page

This is purely a prompt tone adjustment — no frontend changes needed.

## Files to Modify
- `supabase/functions/rzuma-chat/index.ts` — relax the 1-sentence constraint to 2-3 sentences

