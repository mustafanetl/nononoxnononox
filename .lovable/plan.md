

# Smarter AI + Real City Images + Local Experiences

## Problems

1. **AI assumes every request is an international trip** — generates flights even for "things to do tonight" or "date ideas in my city"
2. **AI never asks where the user is flying FROM** — picks random departure airports like JFK
3. **AI talks too much** — verbose text that repeats what the cards already show
4. **City images on TripDetail hero are static Unsplash** — not using the real Wikimedia images from enrichment
5. **Starter suggestions are all travel-focused** — no local/date/experience options

## Plan

### Step 1: Rewrite system prompt to handle multiple intents
**File: `supabase/functions/rzuma-chat/index.ts`**

Restructure the prompt around 3 modes the AI must detect:

- **Trip mode** — user wants to travel somewhere (flights, hotels, itinerary). AI MUST ask: departure city, dates, group size, budget, occasion before generating a plan.
- **Local mode** — user wants things to do in their own city (no flights, no hotels). AI asks: what kind of experience (date, friends, family, solo), vibe (chill, adventure, nightlife), budget, time of day.
- **Date mode** — user wants date ideas. AI asks: what stage (first date, anniversary, casual), vibe (romantic, fun, adventurous), budget, any dietary preferences. Generate activities + itinerary only, no flights/hotels.

Key prompt rules:
- "NEVER generate flights unless the user explicitly mentions traveling to a different city. If they say 'things to do in Paris' and they're IN Paris, that's local mode."
- "ALWAYS ask where they're flying from before generating flights. Never assume a departure city."
- "Keep text to 1 sentence max. The cards speak for themselves."
- "For dates: ask about personalities, interests, and relationship stage to personalize suggestions."
- "Ask 2-3 questions maximum before generating. Use quickreplies for the questions."

### Step 2: Update starter suggestions to include local + date options
**File: `src/pages/Chat.tsx`**

Replace `getSeasonalSuggestions` with a mix of trip AND local suggestions:
- Keep 2 seasonal travel suggestions
- Add "Date night ideas in my city"
- Add "Fun things to do this weekend"

Update the welcome text: "Plan a trip, find a date spot, or discover what's happening near you."

### Step 3: Use real Wikimedia images on TripDetail hero
**File: `src/pages/TripDetail.tsx`**

The enrichment data already fetches Wikimedia images and stores them via `setWikimediaImage`. The `getCityImage` function already checks the Wikimedia cache first. The issue is that `TripDetail` loads from sessionStorage and may not have the cache populated.

- On mount, check sessionStorage for `enrichedImages` and restore the Wikimedia cache before rendering
- This ensures `getHeroImage(destination)` returns the real photo instead of the Unsplash fallback

### Step 4: Conditional card rendering based on mode
**File: `src/pages/Chat.tsx`**

No code change needed for rendering — the AI simply won't emit `flights` or `hotels` blocks in local/date mode, so those cards won't appear. The existing parser already handles missing blocks gracefully.

## Files to Modify
- `supabase/functions/rzuma-chat/index.ts` — complete prompt rewrite for multi-intent AI
- `src/pages/Chat.tsx` — updated starter suggestions
- `src/pages/TripDetail.tsx` — restore Wikimedia cache on mount for real hero images

