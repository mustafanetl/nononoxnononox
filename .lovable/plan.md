

# Redesign Trip Detail Page

## Problem
The Trip Detail page is boring -- it's just plain cards in tabs with generic travel info (visa, weather, currency converter) that feels like filler. Nothing actionable, nothing that makes users want to pay.

## What Changes

### 1. Beautiful Hero Header with Quick Stats
Replace the plain text header with a full-width destination hero image, gradient overlay, and key trip stats (dates, budget estimate, number of days). Add Save, Export PDF, and Share buttons right in the hero.

### 2. Kill the "Overview" Tab -- Merge Useful Bits, Remove Filler
- Remove the standalone TravelInfoCard and WeatherCard as separate sections (they're boring walls of text)
- Instead, show a **compact info strip** at the top: weather icon + temp, currency, timezone -- one line, glanceable
- Move the map to be always visible at the top (not buried in a tab)
- Remove CurrencyConverter from the detail page (it's a utility, not a trip plan feature)
- Remove PackingList from this page (move to PDF export only)

### 3. Redesign Flight/Hotel/Activity Cards for the Detail Page
Make the cards wider and more informative on this page (not the tiny 260px chat cards):
- **Flights**: Full-width cards with prominent "Search on Skyscanner" button, showing route visually
- **Hotels**: Larger cards with description visible, "Check on Booking.com" button prominent
- **Activities**: Show description, duration, price, and "Find on GetYourGuide" button

### 4. Better Itinerary -- Visual Timeline
Replace the grid of itinerary cards with a **vertical timeline** layout. Each day flows into the next with connecting lines, time-of-day icons, and expandable details.

### 5. Estimated Budget Summary
Add a budget breakdown section showing:
- Total estimated cost (flights + hotels x nights + activities)
- Per-category breakdown with visual bars
- "This is an estimate" disclaimer

### 6. Actionable Buttons Throughout
- Every card gets a prominent booking link button
- "Save This Trip" button in header (persists to database)
- "Export PDF" button that generates a polished PDF of this specific trip
- "Share" copies a formatted summary

## Files