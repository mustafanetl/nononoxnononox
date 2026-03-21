

# Redesign Trip Display & Improve Data Accuracy

## Problem
1. Trip results in chat are cluttered -- too many cards dumped inline (flights, hotels, activities, weather, etc.)
2. Flight prices and details are fabricated by the AI with no grounding in reality

## Solution

### 1. Trip Summary Card in Chat
Instead of showing every card inline, show a **single clickable "Trip Summary" card** in the chat that summarizes the plan at a glance, then navigates to a **dedicated Trip Detail page** with all the information organized in tabs.

**Trip Summary Card** (shown in chat):
- Destination name + hero image
- Trip dates, occasion badge
- Quick stats: X flights found, X hotels, X activities
- "View Full Plan →" button

**Trip Detail Page** (`/trip/:id` or generated from chat data):
- Tabbed layout: Overview | Flights | Hotels | Activities | Itinerary | Info
- Each tab shows the relevant cards in a clean grid
- Weather, packing list, travel info in the Overview tab
- Map view showing all points of interest
- Export/Save/Share buttons in the header

### 2. Improve Data Accuracy
The AI currently invents prices and flight details. Fix this by:

- **Update the system prompt** to explicitly tell the AI to use realistic, approximate price ranges based on common knowledge (e.g., "Economy JFK→DXB typically $600-$1200") and add a disclaimer on every price
- **Add "Prices are approximate" disclaimers** on all cards
- **Add real booking links** that pre-fill actual search engines (Skyscanner, Booking.com, GetYourGuide) so users see real prices with one click
- **Label prices as "from ~$X"** instead of exact amounts to set correct expectations

### Files to Create
- `src/pages/TripDetail.tsx` -- full-page trip view with tabs
- `src/components/TripSummaryCard.tsx` -- compact card shown in chat

### Files to Modify
- `src/pages/Chat.tsx` -- replace inline card dumps with TripSummaryCard, store parsed trip data for navigation
- `src/App.tsx` -- add `/trip/:id` route
- `supabase/functions/rzuma-chat/index.ts` -- update system prompt for realistic pricing, add disclaimers, add "from" prefix on prices
- `src/components/FlightCard.tsx` -- show "from ~$X" and add "Book on Skyscanner" link
- `src/components/HotelCard.tsx` -- show "from ~$X/night" and add "Book on Booking.com" link
- `src/components/ActivityCard.tsx` -- show "from ~$X" and add "Book on GetYourGuide" link

### How the New Flow Works

```text
User: "Plan a honeymoon in Bali"

Chat shows:
┌─────────────────────────────┐
│  🌴 Bali, Indonesia        │
│  Honeymoon · 7 days        │
│  3 flights · 3 hotels      │
│  4 activities               │
│                             │
│  [View Full Plan →]         │
└─────────────────────────────┘

Click → /trip/abc123

┌─ Overview ─ Flights ─ Hotels ─ Activities ─ Itinerary ─┐
│                                                          │
│  Weather card, travel info, map, packing list            │
│  (or flight cards, hotel cards, etc. per tab)            │
└──────────────────────────────────────────────────────────┘
```

