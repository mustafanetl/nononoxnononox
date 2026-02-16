

# Enhance Rzuma - Major Feature Upgrades

## Overview

This plan adds several high-impact features to make Rzuma a genuinely useful trip planning app: budget tracking, hotel recommendations, markdown rendering for AI responses, a trip summary/export feature, dark mode toggle, and an improved landing page.

---

## 1. Budget Tracker

Add a running budget sidebar/panel that automatically totals up flights and activities the user has viewed or "added" to their trip.

**What it does:**
- A collapsible budget panel on the chat page showing selected flights, activities, and total estimated cost
- "Add to trip" buttons on flight and activity detail modals
- Running total updates in real-time as items are added/removed

**Technical:**
- Create `src/components/BudgetPanel.tsx` with state managed via React context
- Create `src/contexts/TripContext.tsx` to hold selected flights, activities, and budget
- Add "Add to trip" / "Remove" toggle buttons in `FlightDetailModal` and `ActivityDetailModal`
- Show a small floating budget indicator in the chat header

---

## 2. Hotel Recommendations

Extend the AI to suggest hotels alongside flights and activities.

**What it does:**
- New hotel cards with name, star rating, price per night, image, and a "Book" link to Booking.com
- Rendered in the same horizontal carousel style

**Technical:**
- Create `src/components/HotelCard.tsx` with fields: name, stars, pricePerNight, currency, image, location, bookingUrl
- Create `src/components/HotelDetailModal.tsx` with full details and booking link
- Update the system prompt in `supabase/functions/rzuma-chat/index.ts` to include a `hotels` block format
- Update `parseMessageContent` in `Chat.tsx` to extract and render hotel cards

---

## 3. Markdown Rendering for AI Responses

Currently AI text responses render as plain text. Adding markdown support makes responses with bold text, links, and formatting look polished.

**Technical:**
- Install `react-markdown` package
- Replace the plain `<p>` tag for assistant text in `Chat.tsx` with `<ReactMarkdown>` wrapped in prose styling

---

## 4. Dark Mode Toggle

The CSS already has dark mode variables defined but no way to switch.

**What it does:**
- A sun/moon toggle button in the chat header and landing page
- Persists preference in localStorage

**Technical:**
- The project already has `next-themes` installed
- Wrap `App.tsx` with `ThemeProvider`
- Add a toggle button component in the chat header and landing page nav

---

## 5. Share / Export Trip Summary

Let users share or copy their planned trip as a clean summary.

**What it does:**
- A "Share trip" button that generates a text summary of the conversation (flights, activities, itinerary) and copies to clipboard or opens a share dialog

**Technical:**
- Create `src/utils/tripSummary.ts` with a function that parses all messages and extracts trip data into a formatted text
- Add a share button in the chat header
- Use the Web Share API with clipboard fallback

---

## 6. Improved Landing Page

The current landing page is basic. Enhance it with destination cards users can click to jump directly into planning.

**What it does:**
- Popular destination cards (Dubai, Bali, Tokyo, Paris) with images that link to `/chat` with a pre-filled message
- Testimonial section for social proof

**Technical:**
- Update `src/pages/Index.tsx` with a destination grid section and testimonials
- Each destination card navigates to `/chat?q=Plan a trip to Dubai` and auto-sends the message

---

## Files to Create
- `src/components/HotelCard.tsx`
- `src/components/HotelDetailModal.tsx`
- `src/components/BudgetPanel.tsx`
- `src/components/ThemeToggle.tsx`
- `src/contexts/TripContext.tsx`
- `src/utils/tripSummary.ts`

## Files to Modify
- `src/App.tsx` -- wrap with ThemeProvider and TripContext
- `src/pages/Chat.tsx` -- add hotel parsing, budget panel, markdown rendering, share button, dark mode toggle
- `src/pages/Index.tsx` -- add destination cards and testimonials
- `src/components/FlightDetailModal.tsx` -- add "Add to trip" button
- `src/components/ActivityDetailModal.tsx` -- add "Add to trip" button
- `supabase/functions/rzuma-chat/index.ts` -- add hotel block format to system prompt
- `package.json` -- add `react-markdown` dependency

