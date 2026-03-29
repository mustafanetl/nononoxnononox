

# Trip Detail Page — Quality Overhaul

## Problems Found

### 1. "Trip Score" is gimmicky and adds no real value
The `calcTripScore` function and `TripScoreBadge` component give an arbitrary score (0-100) based on how many card types are present. Tips like "Add flights to boost your score" feel gamified and cheap — not something worth paying for. It appears in 3 places: mobile action bar, day view budget strip, and the scoring logic itself.

**Fix:** Remove `calcTripScore`, `TripScoreBadge`, and all references. This is filler, not premium value.

### 2. Map markers use emojis (🏨, 🎯)
`TripMap.tsx` line 98-99 uses emoji characters inside map markers. Inconsistent with the SaaS aesthetic.

**Fix:** Replace emojis with simple SVG icons or single letters (H for hotel, A for activity) rendered as text inside the colored circles.

### 3. Flight Detail Modal fabricates a "Return" flight
`FlightDetailModal.tsx` lines 226-257 show a return flight section that just mirrors the outbound flight with swapped cities and identical times/duration. This is misleading — the AI only generates one-way data.

**Fix:** Remove the fake "Return" flight block entirely. Just show the outbound flight info.

### 4. "Tap to read more" text in itinerary cards
`ItineraryTimeline.tsx` line 135: `"Tap to read more"` is casual mobile-app language.

**Fix:** Remove this text. Users can still tap to expand — no instruction needed.

### 5. Redundant "Prices are approximate" text appears 4+ times
- Section headers for Flights, Hotels, Activities all say it
- Budget section says it again
- Bottom footer says it again
- Summary card says it

**Fix:** Keep it only once at the bottom footer. Remove from section headers and budget section.

### 6. Budget donut `~` prefix on every price everywhere
Every single price shows `~$850`, `~$120`, `~$350`. The tilde on every number is noisy.

**Fix:** Show prices without `~` prefix in the detail cards. Keep the word "estimated" in one place (the bottom footer).

### 7. "Your Trip" label above destination name is unnecessary
Line 301: `"Your Trip"` in tiny uppercase text adds no information.

**Fix:** Remove it. The destination name is self-explanatory.

### 8. Section header "Where You'll Stay" is inconsistent
Other sections use noun-based headers (Flights, Activities & Experiences). "Where You'll Stay" is conversational.

**Fix:** Change to "Hotels".

### 9. Day view shows "Your plan for the day" — unnecessary subtitle
Line 513: filler text.

**Fix:** Remove the subtitle.

### 10. Desktop action bar floats over hero image with no background context
Lines 592-602: the desktop action buttons float at top-right with `shadow-lg` but can overlap the hero. On scroll they look disconnected.

**Fix:** Move the desktop actions into the hero area (beside the back button) or into a sticky header bar that appears on scroll, matching the day selector bar style.

## Summary of Changes

### Files to modify:
1. **`src/pages/TripDetail.tsx`**
   - Remove `calcTripScore` function and `TripScoreBadge` component
   - Remove all TripScoreBadge usage (mobile bar, day view)
   - Remove `~` prefix from all price displays
   - Remove "Your Trip" label
   - Remove "Prices are approximate" from section headers
   - Remove "Prices are approximate" from budget section
   - Change "Where You'll Stay" → "Hotels"
   - Remove "Your plan for the day" subtitle
   - Move desktop action buttons into a sticky header bar instead of floating

2. **`src/components/TripMap.tsx`**
   - Replace emoji markers (🏨, 🎯) with clean text letters (H, A)

3. **`src/components/FlightDetailModal.tsx`**
   - Remove the fabricated "Return" flight section (lines 226-257)
   - Change "Round trip total" label to just the price without the misleading round-trip claim

4. **`src/components/ItineraryTimeline.tsx`**
   - Remove "Tap to read more" text

