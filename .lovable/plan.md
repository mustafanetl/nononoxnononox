

# Make Trip Detail Page Interactive & Engaging

## Current State
The Trip Detail page is a static scroll of sections — hero, info strip, flights, hotels, activities, itinerary timeline, budget. It works but feels like a document, not an app.

## What Changes

### 1. Interactive Map as the Centerpiece
Transform the small static map into a full-width interactive experience:
- **Day-based filtering**: Clickable day pills above the map (Day 1, Day 2, etc.) that filter which pins are visible
- **Animated markers**: Pins pulse/bounce when their day is selected
- **Connected route line**: Draw a polyline connecting locations in order, animated on day change
- **Click a pin → scroll to that card** below, highlighting it briefly
- **Map is taller** (400px) and sticky on desktop so it stays visible while scrolling content

### 2. Horizontal Day Selector with Progress
Replace the vertical timeline with a **horizontal scrollable day selector strip** at the top (sticky below hero):
- Pill-style buttons: `Day 1` `Day 2` `Day 3` etc.
- Selecting a day scrolls to that day's content and filters the map
- A thin progress bar underneath shows "trip completion" (visual engagement)
- Active day pill is highlighted with primary color + scale animation

### 3. Card Hover/Click Animations
- Cards get a subtle **scale + shadow lift** on hover (already partial, enhance it)
- When a card is "focused" from map pin click, it gets a **glow border pulse** animation
- Activity cards get a **staggered fade-in** when their section scrolls into view

### 4. Itinerary as Interactive Cards (not just collapsible text)
Redesign the itinerary section:
- Each day is a **swipeable/scrollable horizontal card** showing Morning → Afternoon → Evening as 3 mini-cards with gradient backgrounds matching time of day (amber → orange → indigo)
- Tapping a time-slot card expands it with a subtle scale animation
- Connect to the map: each itinerary time slot highlights relevant pins

### 5. Budget as Animated Donut Chart
Replace the plain progress bars with:
- An **animated donut/ring chart** showing the budget breakdown (flights vs hotels vs activities)
- Numbers count up with a simple animation when scrolled into view
- Color-coded segments matching the category icons

### 6. "Trip Score" Gamification Widget
Add a fun engagement element:
- A circular **Trip Score** (0-100) that rates how complete/well-planned the trip is
- Criteria: Has flights (+20), has hotels (+20), has activities (+20), has itinerary (+20), has 5+ days (+10), has budget under X (+10)
- Animated ring that fills up as score increases
- Tooltip explaining what would improve the score ("Add more activities to boost your score!")

## Files to Modify

### `src/pages/TripDetail.tsx`
- Add sticky day selector strip
- Add trip score widget in hero area
- Integrate day filtering with map
- Add scroll-to-card on map pin click
- Replace budget bars with donut chart
- Add staggered animations on sections
- Connect day selector to itinerary + map

### `src/components/TripMap.tsx`
- Accept `activeDay` prop to filter pins
- Draw polyline connecting day's locations
- Add animated/pulsing markers
- Emit `onMarkerClick` callback
- Make map taller, add day-based transitions

### `src/components/ItineraryTimeline.tsx`
- Redesign as horizontal scrollable time-of-day cards per day
- Gradient backgrounds (morning amber, afternoon orange, evening indigo)
- Scale animation on tap/click

### `src/index.css`
- Add keyframes: `count-up`, `glow-pulse`, `pin-bounce`, `ring-fill`

### `tailwind.config.ts`
- Add new animation utilities for the above keyframes

