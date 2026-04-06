

# Shift Discovery from "Been There?" to Vibe & Personality Profiling

## What Changes

**File: `supabase/functions/rzuma-chat/index.ts`** — Rewrite the discovery flow (lines 18-25)

### Current problem
Step 1 always asks "Have you been to [destination] before?" which feels repetitive and isn't the most useful signal. Users can mention past visits naturally or edit their plan later.

### New discovery flow

Replace the rigid 4-step sequence with a **vibe-first** approach:

- **STEP 1 (MANDATORY):** Ask about the **vibe** they're going for. Use quickreplies like: `["Chill & relaxed", "Adventure & adrenaline", "Foodie exploration", "Culture & history"]`
- **STEP 2 (mode-specific):**
  - **TRIP:** Ask who they're going with and energy level: `["Solo — surprise me", "Couple getaway", "Friends trip", "Family friendly"]`
  - **LOCAL:** Ask travel radius: `["Walking distance", "Up to 30 min drive", "Up to 1 hour away"]`
  - **DATE:** Ask about the other person's personality/vibe: `["They love surprises", "Outdoorsy type", "Total foodie", "Artsy & creative", "Keep it classic"]` — then ask the stage: `["First date", "Few months in", "Anniversary", "Just vibes"]`
- **STEP 3:** Logistics — departure city (TRIP only), dates, budget
- **Remove** the mandatory "Have you been there?" question. If the user mentions it naturally, use that info. If preferences context includes visited places, silently avoid those.

### Also update rule #4
Add: "If the user's preferences show visited places, silently skip those — don't ask about them. Focus on understanding what kind of experience they want, not where they've already been."

## Files to Modify
- `supabase/functions/rzuma-chat/index.ts` — rewrite discovery steps in system prompt

