

# Next-Level Features for Rzuma

## Overview

These features fill real gaps that would make users come back and actually rely on Rzuma for trip planning.

---

## 1. Multi-City / Multi-Leg Trip Support

Currently Rzuma only handles single-destination trips. Many travelers want multi-city routes (e.g., "Paris to Rome to Barcelona").

**What it does:**
- Users can say "Plan a 2-week Europe trip: Paris, Rome, Barcelona"
- Rzuma generates flights between each city, hotels for each stop, and a combined itinerary
- A visual trip timeline shows each leg of the journey

**Technical:**
- Update the system prompt to handle multi-city requests and output a `legs` structure
- Create `src/components/TripTimeline.tsx` showing a visual step-by-step of the multi-city route
- Parse a new `timeline` block in Chat.tsx

---

## 2. Chat History Persistence

Right now, refreshing the page loses everything. Users need their conversations saved.

**What it does:**
- Conversations persist in localStorage so they survive page refreshes
- Sidebar shows recent chats that users can switch between
- "New chat" actually creates a separate conversation

**Technical:**
- Update `src/hooks/useRzumaChat.ts` to save/load messages from localStorage keyed by conversation ID
- Create a conversation list manager in the sidebar
- Each conversation gets a generated title from the first user message

---

## 3. Visa & Travel Requirements Info

A huge pain point for travelers -- knowing visa requirements, COVID rules, etc.

**What it does:**
- When planning a trip, Rzuma automatically mentions visa requirements based on the user's origin
- A dedicated "Travel Info" card showing entry requirements, best travel season, currency, time zone, and language

**Technical:**
- Create `src/components/TravelInfoCard.tsx` with destination metadata
- Update the system prompt to include a `travelinfo` block format with fields: visa, currency, language, timezone, bestSeason, safety
- Parse and render the new block in Chat.tsx

---

## 4. Price Comparison View

Users want to compare options side-by-side rather than scrolling through carousels.

**What it does:**
- A "Compare" button on flight and hotel cards that adds them to a comparison tray
- A comparison modal that shows selected options in a table format (price, rating, duration, stops)
- Helps users make quick decisions

**Technical:**
- Add compare state to TripContext
- Create `src/components/ComparisonModal.tsx` with a table layout
- Add a "Compare" toggle on FlightCard and HotelCard

---

## 5. Weather Forecast for Destination

Show weather expectations so users know what to pack.

**What it does:**
- A weather card showing average temperature, rainfall, and conditions for the travel dates
- Packing suggestions based on weather

**Technical:**
- Create `src/components/WeatherCard.tsx` with temperature, conditions, and packing tips
- Update the system prompt to include a `weather` block format
- Parse and render in Chat.tsx

---

## 6. Quick Reply Buttons

After the AI responds, show contextual follow-up buttons so users don't have to type.

**What it does:**
- After showing flights: "Show hotels too", "Find cheaper options", "Different dates"
- After showing a full plan: "Export this plan", "Adjust budget", "Add more days"
- Makes the app feel more interactive and guided

**Technical:**
- Update the system prompt to include a `quickreplies` block with 2-4 suggested follow-ups
- Create `src/components/QuickReplies.tsx` as clickable chips below assistant messages
- On click, send the reply text as a new user message

---

## Files to Create
- `src/components/TripTimeline.tsx` -- visual multi-city route display
- `src/components/TravelInfoCard.tsx` -- visa, currency, timezone card
- `src/components/ComparisonModal.tsx` -- side-by-side comparison table
- `src/components/WeatherCard.tsx` -- destination weather and packing tips
- `src/components/QuickReplies.tsx` -- contextual follow-up buttons

## Files to Modify
- `src/hooks/useRzumaChat.ts` -- add localStorage persistence and conversation management
- `src/pages/Chat.tsx` -- parse new block types, render new components, wire up sidebar with saved chats
- `src/contexts/TripContext.tsx` -- add comparison state
- `supabase/functions/rzuma-chat/index.ts` -- expand system prompt with new block formats (travelinfo, weather, quickreplies, timeline)

