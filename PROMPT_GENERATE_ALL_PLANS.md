# Goal: Generate & Cache ALL Possible Trip Plans for Rotterdam

## Context

I have an AI trip planner called Jolliday. When a user asks for a trip plan, the system checks a cache first. If the plan exists in cache → serve instantly ($0 cost). If not → AI generates it ($0.001-0.08 cost).

I want to PRE-GENERATE every possible plan combination for Rotterdam so users almost NEVER hit the AI. Everything served from cache.

## My Database

I have a Supabase database with a `destination_media` table containing ~300-400 scraped venues for Rotterdam:

**Cache key format:** `rotterdam|5|foodie|couple` = destination + duration + vibe + travelerType

The cache key does NOT include origin city, dates, or hotel preference. This means:
- User flying from Stockholm → hits cache ✓
- User flying from London → hits SAME cache ✓
- User wants different hotel → hits SAME cache ✓
- Flights + hotels are added dynamically at display time from live APIs

**Table: `destination_media`**
- `destination` = "rotterdam"
- `type` = "venue" (Google Maps scraped) or "gyg_activity" (GetYourGuide tours)
- `name` = venue name
- `url` = photo URL (on my server)
- `metadata` (JSONB) contains:
  - `category`: dining | cafe | nightlife | culture | sightseeing | outdoor | shopping | wellness | experience
  - `meal_type`: ["breakfast"] | ["lunch"] | ["dinner"] | ["drinks"] | ["snack"] | []
  - `vibes`: ["foodie", "romantic"] | ["nightlife", "mixed"] | ["cultural"] | etc.
  - `travelers`: ["couple", "friends", "solo", "family"]
  - `price_level`: "budget" | "mid" | "luxury"
  - `time_of_day`: "morning" | "afternoon" | "evening" | "night"
  - `season`: "all" | "summer" | "winter"
  - `rating`: 4.7
  - `review_count`: 1234
  - `address`: "Street 123, Rotterdam"
  - `lat`, `lng`: coordinates
  - `hours`: opening hours
  - `cuisine`: "Italian" | "Asian" | etc.
  - `photos`: ["url1", "url2", "url3", "url4"]
  - `neighborhood`: "Katendrecht"

**Table: `cached_plans`**
- `cache_key` = "rotterdam|5|foodie|couple" (destination|duration|vibe|travelerType)
- `plan_content` = full AI response text (markdown with code blocks)
- `destination`, `duration`, `vibe`, `traveler_type`, `hit_count`

## Plan Format

Each cached plan must be a single text string containing these markdown code blocks:

```
```flights
[{"id":"1","airline":"...","from":"ARN","to":"RTM",...},{"id":"2",...}]
```

```hotels
[{"id":"1","name":"...","stars":4,"pricePerNight":150,"currency":"€","image":"boutique","location":"...","description":"...","bestFor":"couples","lat":...,"lng":...}]
```

```activities
[{"id":"1","name":"...","category":"dining","duration":"2 hours","price":45,"currency":"€","image":"food","occasion":"date","description":"...","neighborhood":"...","hours":"...","bookAhead":true,"why":"...","lat":...,"lng":...}]
```

```itinerary
[{"day":1,"title":"...","slots":[{"time":"9:00","activity":"...","venue":"...","neighborhood":"...","duration":"1h","cost":15,"bookAhead":false,"transitNext":"5 min walk"},...]}]
```

```weather
{"destination":"Rotterdam","period":"...","temperature":"...","conditions":"...","packingTip":"..."}
```

```destination_enrich
{"destination":"Rotterdam","country":"Netherlands","continent":"Europe","language":"Dutch","timezone":"CET","bestMonths":"May-September"}
```

```quickreplies
["Make it cheaper","More nightlife","Add a day trip","Swap a restaurant","More romantic spots"]
```
```

## What I Need You To Do

### Step 1: Query my venue database

Connect to my Supabase DB and fetch all Rotterdam venues:
- URL: check `.env` for `VITE_SUPABASE_URL`
- Key: check `.env` for `SUPABASE_SERVICE_ROLE_KEY`
- Query: `SELECT * FROM destination_media WHERE destination = 'rotterdam' AND type IN ('venue', 'gyg_activity')`

### Step 2: Generate ALL plan combinations

For Rotterdam, generate plans for every combination:

**Durations:** 3, 5, 7, 10, 14, 21, 30 days
**Vibes:** foodie, romantic, adventure, cultural, nightlife, relaxed, family-friendly, mixed
**Traveler types:** couple, solo, friends, family

That's 7 × 8 × 4 = **224 plans**

But many combos are rare (30-day nightlife solo trip). Prioritize the most common:
1. First: 3, 5, 7 days × all vibes × couple, friends = 48 plans
2. Then: 3, 5, 7 days × all vibes × solo, family = 48 plans
3. Then: 10, 14 days × all vibes × couple, friends = 32 plans
4. Then: 21, 30 days × romantic, foodie, mixed, relaxed × couple = 8 plans (honeymoon trips)
5. Then: 10, 14, 21, 30 days × remaining combos

### Step 3: Build each plan from MY venue data

For each plan:
1. Filter venues by matching `vibes`, `travelers`, `season`
2. Pick venues for each day:
   - Breakfast (meal_type includes "breakfast", time_of_day = "morning")
   - Morning activity (category = culture/sightseeing, time_of_day = "morning")
   - Lunch (meal_type includes "lunch", time_of_day = "afternoon")
   - Afternoon activity (category = sightseeing/outdoor/shopping)
   - Coffee/drinks (category = cafe, time_of_day = "afternoon")
   - Dinner (meal_type includes "dinner", time_of_day = "evening")
   - Evening (category = nightlife, time_of_day = "night") — optional based on vibe
3. Cluster by neighborhood (venues near each other on same day)
4. Don't repeat venues across days
5. Use GYG activities for 2-3 slots (these have affiliate booking links)
6. Write natural day titles and "why" descriptions

### Step 4: Save each plan to `cached_plans` table

For each generated plan:
```sql
INSERT INTO cached_plans (cache_key, destination, duration, vibe, traveler_type, plan_content)
VALUES ('rotterdam|5|foodie|couple', 'rotterdam', 5, 'foodie', 'couple', '<full plan text>');
```

### Step 5: Hotels & Flights

- **DO NOT include flights block** in cached plans. Flights depend on user's origin city and dates — they're fetched live from Travelpayouts API at display time.
- **DO NOT include hotels block** in cached plans. Hotels depend on user's budget and dates — they're fetched live from Travelpayouts API at display time.
- The cached plan should ONLY contain: activities, itinerary, weather, destination_enrich, quickreplies
- This way the cache key is just `rotterdam|5|foodie|couple` — it hits regardless of where the user flies from or which hotel they pick.

## Rules

- Every venue name in the plan MUST exist in my `destination_media` table
- Use exact names from the DB (the frontend matches them to photos/booking links)
- Every day must have breakfast + lunch + dinner (3 meals minimum)
- 6-8 slots per day
- Venues should flow geographically (check lat/lng — nearby venues on same day)
- Never include hotels or airports in the itinerary
- Use GYG activities (type=gyg_activity) when they genuinely fit the plan and improve the experience — don't force them
- The goal is the PERFECT plan for the user to enjoy, not monetization
- For long trips (14-30 days): spread GYG activities naturally (maybe 1 every 2-3 days). Most days should be restaurants + free attractions + cafés + bars from the Google Maps venue pool
- A 21-day trip needs ~5-7 paid activities total, NOT 42. The rest is dining, walking, exploring, relaxing
- Never repeat a venue in the same plan (with 300+ venues in the DB, you have plenty)
- Price estimates should match the venue's `price_level` tag

## Environment

- Supabase project: check `.env` file in project root
- The `cached_plans` table already exists with the schema above
- Use the service role key to write to the DB (bypasses RLS)

## Success Criteria

After this is done, when a user asks "5 days foodie couple Rotterdam" → the system finds it in `cached_plans` and serves it instantly with $0 AI cost. Photos, booking links, and real data are already in the venue DB.
