

# Fix Google Photos + Remove GetYourGuide

## Problems
1. **Google Place photos fetched but barely used** — The edge function returns images and nearby places with photos, but the client only uses the first image as a city hero. Activity cards still show generic Unsplash fallbacks because `realPhoto` comes from AI output (which doesn't have real URLs).
2. **GetYourGuide booking links** need to be removed from activity cards and detail modals.

## Changes

### 1. Use Google Places photos for activities
**File: `src/pages/Chat.tsx`** (lines 549-553 area)

After merging hotels from enrichment, also match enriched `places` to activities by name similarity:
- For each activity in `parsed.activities`, find the closest match in `enrichData.places` (fuzzy name match)
- If matched, set `activity.realPhoto = place.thumbnail` and `activity.isReal = true`
- Also set Google Place photos as fallback images for activities that don't match — cycle through available place photos

### 2. Use Google photos in TripSummaryCard
**File: `src/components/TripSummaryCard.tsx`**

The `enrichedImages` prop is already passed but never used for the card image. Use the first enriched image instead of Unsplash fallback:
- Line 52: Change `getCityImage(destination)` to use `enrichedImages?.[0]?.url || getCityImage(destination)`

### 3. Remove GetYourGuide references
**Files:**
- `src/components/ActivityDetailModal.tsx` — Remove the "Book on GetYourGuide" button entirely, keep only the "Add to Trip" button
- `src/pages/TripDetail.tsx` — Remove the GetYourGuide "Book" link from activity rows (lines 672-675), remove the import of `getGetYourGuideUrl`
- `src/utils/bookingLinks.ts` — Remove the `getGetYourGuideUrl` function

### 4. Pass Google Place photos to activity cards in non-summary view
**File: `src/pages/Chat.tsx`** (lines 611-617)

When rendering activity cards outside TripSummaryCard (the `else` branch), also apply enriched place photos to activities the same way as step 1.

## Files to Modify
- `src/pages/Chat.tsx` — merge Google place photos into activities
- `src/components/TripSummaryCard.tsx` — use enriched images for hero
- `src/components/ActivityDetailModal.tsx` — remove GetYourGuide button
- `src/pages/TripDetail.tsx` — remove GetYourGuide links from activity rows
- `src/utils/bookingLinks.ts` — remove `getGetYourGuideUrl`

