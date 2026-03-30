

# Full Trip Flow — Audit & Improvements

## Current State Summary
The trip flow works: User chats → AI generates structured blocks (flights, hotels, activities, itinerary, weather, travelInfo) → Chat renders a TripSummaryCard → clicking it opens TripDetail page with day-by-day view, map, budget donut, and action bar. Live enrichment (weather, currency, country info, Wikimedia images, Wikipedia places) runs via edge functions.

## Issues Found

### 1. TripDetail uses hardcoded Unsplash images for activities
`TripDetail.tsx` has its own `activityImageMap` (line 31-46) and `ActivityRow` uses it directly (line 652), completely ignoring the `realPhoto` field from Wikipedia/Wikimedia enrichment. The enriched real photos never appear on the trip detail page.

### 2. TripDetail hero image doesn't use Wikimedia cache
`getHeroImage` calls `getCityImage` which checks `wikimediaCache`, but the cache is only populated during Chat.tsx rendering. If the user navigates directly or refreshes, the cache is empty and falls back to Unsplash.

### 3. Enrichment data not passed to TripDetail
When the TripSummaryCard stores data to sessionStorage (`jolliday-trip-detail`), it only saves the parsed `TripPlanData` — it does NOT include enriched weather/travelInfo/images from the `enrichedData` state. So the TripDetail page never shows "Live" badges or real enriched data.

### 4. MyTrips action buttons hidden on mobile
The "Continue Planning" and "Delete" buttons use `opacity-0 group-hover:opacity-100` (line 139, 157) which is invisible on mobile touch devices. The memory says these should be "always visible" but the code still has hover-only visibility.

### 5. Weather forecast data not displayed
The `WeatherCard` accepts a `forecast` array but never renders it — only shows the summary (high/low/conditions/rainfall). The 7-day forecast from Open-Meteo goes unused.

### 6. TravelInfo missing exchange rate display
`TravelInfoCard` has `exchangeRate` in its type but the `infoItems` array doesn't include it, so live exchange rates are never shown.

### 7. No loading state for enrichment
When the edge function fetches live data, there's no visual indicator. Cards just silently update (or don't).

### 8. ActivityDetailModal ignores realPhoto
The detail modal uses its own hardcoded `imageMap` (line 7-23), so even if an activity has a `realPhoto`, the modal shows a generic Unsplash image.

## Plan

### Step 1: Pass enrichment data to TripDetail
In `Chat.tsx`, when building the `TripPlanData` for `TripSummaryCard`, merge enriched data into the parsed content before passing it. Store the enriched images array in sessionStorage alongside the trip data so `TripDetail` can access them.

### Step 2: Fix TripDetail to use real photos
- Update `ActivityRow` in `TripDetail.tsx` to use `activity.realPhoto` when available, falling back to `activityImageMap`
- Store and restore Wikimedia hero images so `TripDetail` uses them
- Pass enriched `travelInfo` and `weather` (with `isLive` flag) so the detail page shows Live badges

### Step 3: Show 7-day weather forecast
Add a simple daily forecast row in `WeatherCard.tsx` when `forecast` data exists — show date, high/low, and condition icon for each day.

### Step 4: Show exchange rate in TravelInfoCard
Add `exchangeRate` to the `infoItems` array in `TravelInfoCard.tsx` so it renders when available.

### Step 5: Fix MyTrips mobile button visibility
Remove `opacity-0 group-hover:opacity-100` from the Continue and Delete buttons — make them always visible.

### Step 6: Use realPhoto in ActivityDetailModal
Update `ActivityDetailModal.tsx` to prefer `activity.realPhoto` over the hardcoded image map.

### Step 7: Add enrichment loading indicator
Show a small shimmer/skeleton on weather and travel info cards while enrichment is in progress.

## Files to Modify
- `src/pages/Chat.tsx` — merge enrichment into TripSummaryCard data, store enriched images in sessionStorage
- `src/pages/TripDetail.tsx` — use real photos, show live badges, restore Wikimedia cache
- `src/components/WeatherCard.tsx` — render 7-day forecast
- `src/components/TravelInfoCard.tsx` — add exchange rate row
- `src/components/ActivityDetailModal.tsx` — use realPhoto
- `src/pages/MyTrips.tsx` — fix mobile button visibility

