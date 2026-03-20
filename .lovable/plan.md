

# Next Enhancements for Rzuma

## What's Already Built
Auth, saved trips, budget tracker, hotel/flight/activity cards, comparison, PDF export, packing list, weather, travel info, quick replies, dark mode, pricing page, chat persistence.

## What's Missing (High-Impact Features)

### 1. Re-open Saved Trips in Chat
Currently users save trips but can't reload them. The My Trips page shows cards but clicking them does nothing useful.

- Add a "Continue Planning" button on each saved trip card in MyTrips
- On click, navigate to `/chat` and load the saved `data_json.messages` into the chat hook
- Add an `openSavedTrip` function to `useRzumaChat` that creates a conversation from saved data

### 2. Voice Input
Let users speak instead of type -- huge for mobile UX.

-