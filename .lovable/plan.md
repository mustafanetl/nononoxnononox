

# Full AI Overhaul: Personal Memory, Real Photos Everywhere, Better Personality

## Current State

1. **Preferences are shallow** — Only stores liked/disliked categories and visited places. No user profile context (name, home city, travel style, budget preference, dietary restrictions, etc.) is sent to the AI.
2. **Photos only apply to activities** — Google Places photos enrich activity cards, but the enrichment uses a single `searchNearby` call for the whole destination. Individual activities (e.g., "Pierchic Restaurant") never get their own specific Google photo lookup.
3. **Memory is localStorage-only for guests** — The `user_preferences` table exists but is barely used. Preferences sync once on login and are never read back from the DB.
4. **AI still feels generic** — The prompt has personality rules but no user-specific context beyond basic category likes/dislikes.

## Plan

### 1. Expand user memory with a proper profile context table

**New migration**: Add columns to `user_preferences` for richer personal data:
- `home_city` (text) — so AI knows where you are for LOCAL mode
- `travel_style` (text) — e.g., "budget", "mid-range", "luxury"
- `dietary_restrictions` (jsonb, default `[]`) — vegan, halal, etc.
- `past_trips` (jsonb, default `[]`) — auto-populated from saved_trips destinations
- `display_name` (text) — pulled from profiles for personalization

**Why**: This lets the AI say "hey Sarah, since you loved that ramen spot in Tokyo last time..." instead of generic responses.

### 2. Load preferences from DB on login, merge with localStorage

**File: `src/hooks/useRzumaChat.ts`**
- On login, fetch `user_preferences` from DB and merge into local state
- On every preference update, write back to DB (debounced)
- Send the full profile context (home city, name, travel style, dietary, past trips) to the edge function

### 3. Pass rich user context to the AI

**File: `supabase/functions/rzuma-chat/index.ts`**
- Accept expanded `preferences` payload including home_city, display_name, travel_style, dietary_restrictions, past_trips
- Build a detailed system message: "The user's name is Sarah. She lives in Rotterdam. She prefers mid-range budget. She's visited Tokyo (loved it), Paris (okay). She's vegan. She likes nightlife and hates museums."
- Update the system prompt to reference this context naturally

### 4. Fetch Google Places photos per-activity (not just per-destination)

**File: `supabase/functions/enrich-destination/index.ts`**
- Accept an optional `activities` array in the request body (list of activity names)
- For each activity name, do a Google Places Text Search scoped to the destination city to find the exact venue and its photo
- Return a map: `{ "Pierchic Restaurant": { photo: "...", rating: 4.7, ... } }`
- This replaces the fuzzy-match cycling approach with exact per-activity lookups

**File: `src/pages/Chat.tsx`**
- After parsing activities from the AI response, pass activity names to the enrichment call
- Map returned per-activity photos directly onto activity cards

### 5. Add a Settings section for user preferences

**File: `src/pages/Settings.tsx`**
- Add "Travel Preferences" section below Profile:
  - Home city input
  - Travel style selector (Budget / Mid-range / Luxury)
  - Dietary restrictions multi-select
- Save to `user_preferences` table on change

### 6. Auto-learn from conversations

**File: `src/hooks/useRzumaChat.ts`**
- After a trip is saved, auto-extract the destination and add it to `past_trips` in preferences
- When user rates an activity (thumbs up/down in the detail modal), update liked/disliked categories

## Files to Modify
- **Migration**: Add columns to `user_preferences` (home_city, travel_style, dietary_restrictions, past_trips)
- `supabase/functions/enrich-destination/index.ts` — per-activity Google Places photo lookup
- `supabase/functions/rzuma-chat/index.ts` — accept and use rich user profile context
- `src/hooks/useRzumaChat.ts` — load/save preferences from DB, send rich context
- `src/pages/Chat.tsx` — pass activity names to enrichment, map per-activity photos
- `src/pages/Settings.tsx` — add travel preferences UI

## Technical Notes
- Per-activity photo lookup will use Google Places Text Search API with query like `"Pierchic Restaurant Dubai"` — this is highly accurate for specific venue names
- Rate limiting: batch activity lookups into a single edge function call to avoid N separate requests
- Google API cost: ~$5 per 1000 Text Search calls, reasonable for 3-5 activities per plan

