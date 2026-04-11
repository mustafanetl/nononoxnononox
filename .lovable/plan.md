

# Plan: Switch to Gemini Flash, Remove Weather, Redesign Plan Output

## Summary
Switch the AI model back to Gemini Flash, remove the weather block entirely, and overhaul the system prompt + plan structure to generate genuinely useful, actionable travel plans instead of generic filler content.

## Changes

### 1. Switch model to Gemini Flash
**File:** `supabase/functions/rzuma-chat/index.ts`
- Change `model: "google/gemini-2.5-pro"` to `model: "google/gemini-3-flash-preview"`

### 2. Remove weather block entirely
**File:** `supabase/functions/rzuma-chat/index.ts`
- Remove the `weather` code block format from the system prompt
- Remove weather from the "FULL TRIP PLAN must include" list

**File:** `src/pages/Chat.tsx`
- Remove `WeatherCard` import and all weather parsing/rendering
- Remove `PackingList` rendering tied to weather
- Remove weather from `parseMessageContent` return type
- Remove weather merging from enrichment data

**File:** `src/components/TripSummaryCard.tsx`
- Remove `WeatherData` import and `weather` from `TripPlanData`

**File:** `src/pages/TripDetail.tsx`
- Remove any weather references

### 3. Redesign system prompt for actually useful plans
**File:** `supabase/functions/rzuma-chat/index.ts`

Rewrite the plan output to solve real travel problems:

**Itinerary overhaul** — Instead of vague "Explore the neighborhood" entries, require:
- Specific venue names with addresses for every time slot
- Walking/transit time between locations
- Reservation-needed flags (e.g. "Book 2 weeks ahead")
- Cost per slot so users can see daily spend
- Logical geographic flow (morning spots near each other, not zig-zagging across the city)

**Activities overhaul** — Require:
- Opening hours
- "Book ahead" flag (true/false) for things that sell out
- A "why" field explaining why this specific place over alternatives
- Neighborhood/area name for spatial context

**Itinerary data format update:**
```
{day, title, slots: [{time: "9:00", activity: "...", venue: "...", neighborhood: "...", duration: "1.5h", cost: 25, bookAhead: false, transitNext: "10 min walk"}]}
```

**Hotels** — Add:
- Neighborhood context ("5 min walk to metro, heart of old town")
- "Best for" tag (e.g. "couples", "budget", "families")

**Travelinfo** — Make actionable:
- Add `tipping` field
- Add `simCard` field (how to get data/connectivity)
- Add `transport` field (how to get around — metro/taxi/bike)
- Remove `bestSeason` and `safety` (generic filler)

**Quick replies** — Make them action-oriented modifications:
- "Make it cheaper", "Add a free day", "More food spots", "Swap Day 2 activities"
- Not generic "Tell me more about the plan"

### 4. Update frontend components for new data shapes

**File:** `src/components/ItineraryCard.tsx`
- Redesign to show time-slotted activities with venue names, costs, transit info
- Each slot shows: time, venue name, neighborhood, duration, cost, book-ahead badge

**File:** `src/components/TravelInfoCard.tsx`
- Add tipping, simCard, transport fields
- Remove bestSeason, safety

**File:** `src/components/ActivityCard.tsx`
- Add opening hours display
- Add "Book ahead" badge
- Add neighborhood label

## Technical Details

| File | Change |
|---|---|
| `supabase/functions/rzuma-chat/index.ts` | Switch to gemini-3-flash-preview, remove weather block, rewrite prompt for actionable plans |
| `src/pages/Chat.tsx` | Remove WeatherCard/PackingList imports + rendering, remove weather parsing |
| `src/components/TripSummaryCard.tsx` | Remove weather from TripPlanData type |
| `src/components/ItineraryCard.tsx` | Redesign for time-slotted format with venues, costs, transit |
| `src/components/TravelInfoCard.tsx` | Add tipping/simCard/transport, remove bestSeason/safety |
| `src/components/ActivityCard.tsx` | Add hours, book-ahead badge, neighborhood |
| `src/pages/TripDetail.tsx` | Remove weather, update for new itinerary/activity shapes |

