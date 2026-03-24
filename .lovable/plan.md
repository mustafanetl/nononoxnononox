

# Redesign Trip Detail Page -- Premium, Organized, Worth Paying For

## Problems with Current Page
1. **Wall of sections** -- flights, hotels, activities, itinerary, budget all look the same. No visual hierarchy.
2. **No narrative flow** -- it reads like a database dump, not a trip plan someone would be excited about.
3. **Cards are generic** -- hotel and activity cards look like every other travel site.
4. **Day selector is disconnected** from the content below it -- selecting a day only filters itinerary and map, not the whole page.
5. **No quick overview** -- user has to scroll through everything to understand the trip at a glance.
6. **Mobile (393px)** -- the hero takes up half the screen, info strip is cramped, cards are too similar.

## What Changes

### 1. Restructure Around Days, Not Categories
Instead of "all flights, then all hotels, then all activities" -- organize by **day**. When a day is selected, show that day's itinerary, activities, and relevant hotel in one cohesive section. "All Days" view shows the overview with flights + hotels + budget summary.

### 2. Compact Hero + Floating Action Bar
- Shrink hero to 200px (from 280px) -- less wasted space on mobile
- Move Save/PDF/Share into a **floating bottom action bar** (mobile) or sticky top-right (desktop) -- always accessible, not buried in the hero
- Trip score moves into the action bar as a small badge

### 3. "At a Glance" Summary Section
Right after the hero, add a visual summary grid:
- **Flights**: Origin → Destination with airline logo placeholder and price
- **Stay**: Hotel name with stars and per-night price  
- **Budget**: Single-line total with mini donut
- **Duration**: X days, X nights

This gives users the full picture in 2 seconds without scrolling.

### 4. Day-Based Content Sections
When a day is selected:
- Show a **full-width section** with the day's itinerary (morning/afternoon/evening) as the primary content
- Below it, show any activities assigned to that day as compact action cards with booking buttons
- The map filters to that day's pins (already works)

When "All Days" is selected:
- Show flights section, hotels section, full itinerary, and budget donut (current layout but cleaner)

### 5. Better Activity Cards with Images
- Use wider, horizontal cards on mobile instead of the grid
- Show a gradient overlay on the image with the activity name
- Make the booking button more prominent (filled button, not just a link)

### 6. Smoother Animations
- Section transitions when switching days (fade + slide)
- Cards enter with staggered delay based on scroll position
- Map pins animate when day changes (already works)

## Files to Modify

### `src/pages/TripDetail.tsx`
- Restructure layout: compact hero → at-a-glance grid → day-filtered content
- Add floating action bar component (bottom on mobile)
- Implement day-based content switching (show relevant activities per day)
- Better card layouts (horizontal on mobile for activities)
- "At a Glance" summary grid after hero

### `src/components/ItineraryTimeline.tsx`  
- When showing a single day, expand it fully by default (no need to tap)
- Add subtle connecting line between morning → afternoon → evening

### `src/index.css`
- Add slide-switch animation for day transitions

## Technical Notes
- Day-to-activity mapping uses the existing heuristic (activity index % itinerary length)
- Floating action bar uses `fixed bottom-0` on mobile with backdrop blur
- "At a Glance" grid uses CSS grid with 2 columns on mobile, 4 on desktop
- All existing functionality preserved (modals, booking links, map, PDF export, save)

