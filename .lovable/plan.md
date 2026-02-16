

# Full Trip Planner with Occasion-Based Activities

## Overview

Transform Rzuma from a flight-finder into a complete trip planner. The AI will suggest activities, itineraries, and experiences tailored to the user's occasion (honeymoon, birthday, family vacation, solo adventure, etc.), displayed as rich interactive cards alongside flights.

## What Changes

### 1. New Activity Cards
A new `ActivityCard` component will display suggested activities with:
- Activity image (from Unsplash, mapped by activity type)
- Activity name, category icon, duration, and estimated price
- Occasion tag (e.g. "Perfect for honeymoons")

These will render in a horizontal carousel just like flight cards.

### 2. Itinerary Cards
A new `ItineraryCard` component for day-by-day plans:
- Day number and date
- Morning / afternoon / evening activity breakdown
- Clickable to expand details

### 3. Activity Detail Modal
When clicking an activity card, a modal shows:
- Full description of the activity
- Best time to visit, tips, and booking links
- Related activities nearby

### 4. Updated AI Prompt
The system prompt in the edge function will be expanded so Rzuma:
- Asks about the occasion if not mentioned (honeymoon, birthday, family, solo, etc.)
- Suggests 3-4 activities tailored to the occasion and destination
- Can generate a day-by-day itinerary when asked
- Uses a new structured format for activities and itineraries

### 5. Updated Chat Parser
The message parser in `Chat.tsx` will handle three block types:
- `flights` (existing)
- `activities` (new)
- `itinerary` (new)

### 6. Updated Suggestions
The welcome screen suggestions will reflect the full trip planning capability:
- "Plan a honeymoon in Bali"
- "Birthday trip to Tokyo"
- "Family vacation to Dubai"
- "Solo adventure in Europe"

## Technical Details

### New files to create:
- `src/components/ActivityCard.tsx` -- card with image, name, category, duration, price, occasion tag
- `src/components/ActivityDetailModal.tsx` -- expanded view with description, tips, booking info
- `src/components/ItineraryCard.tsx` -- day-by-day plan card

### Files to modify:
- `supabase/functions/rzuma-chat/index.ts` -- expand system prompt with activity/itinerary formats and occasion-awareness
- `src/pages/Chat.tsx` -- add parsing for `activities` and `itinerary` blocks, add carousels for each, update suggestions, add state for activity detail modal
- `src/components/FlightDetailModal.tsx` -- minor: no major changes needed

### Activity data format (AI output):
```text
```activities
[
  {
    "id": "1",
    "name": "Sunset Dinner Cruise",
    "category": "dining",
    "duration": "3 hours",
    "price": 120,
    "currency": "$",
    "image": "cruise",
    "occasion": "honeymoon",
    "description": "Romantic dinner on the water..."
  }
]
```
```

### Itinerary data format (AI output):
```text
```itinerary
[
  {
    "day": 1,
    "title": "Arrival & Relaxation",
    "morning": "Check in and explore the hotel",
    "afternoon": "Beach time and lunch at local restaurant",
    "evening": "Sunset dinner cruise"
  }
]
```
```

### Updated system prompt highlights:
- Detect occasion from context or ask about it
- When suggesting a destination, include both flights AND activities
- When user asks to "plan a trip", provide flights + activities + optional itinerary
- Activities sorted by relevance to the occasion
- Keep text concise (2-3 sentences max), let the cards do the talking

