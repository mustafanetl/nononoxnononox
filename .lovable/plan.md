

# Make Trip Planner Chat More Personal

## What Changes

Update the AI system prompt so Rzuma asks short, friendly qualifying questions before generating a full trip plan. This creates a conversational flow that gathers key details (dates, budget, travelers, vibe) resulting in much better personalized recommendations.

## Changes

### 1. Update System Prompt (`supabase/functions/rzuma-chat/index.ts`)

Add a new **CONVERSATION FLOW** section near the top of the system prompt with these rules:

- **First message about a destination**: Don't immediately dump flights/hotels/activities. Instead, ask 2-3 short casual questions to understand the trip better. Use quick reply buttons for easy answers.
- **Questions to gather** (one at a time or 2-3 grouped casually):
  - When are you thinking of going? (dates/month)
  - How many days?
  - Solo, couple, family, or friends?
  - What's the vibe -- chill & relax, adventure, culture, party, or mix?
  - Any budget range in mind?
  - Special occasion?
- **After 2-3 exchanges of Q&A**: Generate the full personalized plan with all card types (flights, hotels, activities, itinerary, etc.)
- **If user provides details upfront** (e.g., "Plan a 5-day honeymoon in Bali for $3000"): Skip questions, go straight to the plan
- Quick replies on question messages should be answer options (e.g., "Solo", "Couple", "Family", "Friends")

### 2. Update Initial Quick Replies for Context

When Rzuma asks questions, the `quickreplies` block will contain answer options instead of generic follow-ups, making it tap-friendly and fast.

## Files to Modify
- `supabase/functions/rzuma-chat/index.ts` -- Update SYSTEM_PROMPT with conversation flow rules

