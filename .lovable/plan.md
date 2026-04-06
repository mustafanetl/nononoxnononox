

# Fix: AI Must Ask About Past Experiences Before Planning

## Problem
The system prompt has conflicting instructions:
- **PERSONALIZATION section** (line 15-22): Says to ask "Have you been to [destination] before?"
- **CRITICAL RULES #3** (line 27): Says "Ask 2-3 quick questions max" and lists only: departure city, dates, group size, budget

The AI follows the more restrictive CRITICAL RULES and skips personalization entirely.

## Fix

**File: `supabase/functions/rzuma-chat/index.ts`**

Merge the personalization question INTO the critical rules flow so there's no conflict:

- Change CRITICAL RULE #3 to include the "been there before" question as the FIRST question asked, before logistics
- Update the question flow to be sequential:
  1. First question: "Have you been to [destination] before?" with quickreplies
  2. Then ask logistics (departure city for TRIP, radius for LOCAL, vibe for DATE)
  3. Then dates/budget/group
- Increase question limit from "2-3" to "3-4" to accommodate the personalization question
- Remove the separate PERSONALIZATION section and fold its rules directly into CRITICAL RULES to eliminate ambiguity

The key change is making the "been there before" question non-optional by placing it in the same numbered list the AI actually follows.

## Files to Modify
- `supabase/functions/rzuma-chat/index.ts` — restructure prompt to prioritize personalization question

