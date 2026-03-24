

# Fix: Make Interactive Map Actually Appear + Ensure All Features Work

## Root Cause
The TripMap component checks `h.lat && h.lng` and `a.lat && a.lng` to build map points. But the system prompt in `supabase/functions/rzuma-chat/index.ts` does NOT instruct the AI to include `lat`/`lng` fields in the hotel or activity JSON. So `mapPoints` is always empty and the map never renders.

## Fix

### `supabase/functions/rzuma-chat/index.ts`
Add `lat` and `lng` fields to the hotel and activity JSON format examples in the system prompt:

- Hotels format: add `"lat":25.1972,"lng":55.2744` (realistic coordinates for the destination)
- Activities format: add `"lat":25.2048,"lng":55.2708`
- Add instruction: "ALWAYS include realistic lat/lng coordinates for every