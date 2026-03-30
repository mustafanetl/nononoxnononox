

# Visual Polish — Focused Cleanup

## Changes

### 1. Extract shared `cityImages` to `src/utils/cityImages.ts`
Create a single shared utility with all city image URLs. Export helper functions `getCityImage(city, size)` that return the right Unsplash URL with configurable `w` and `h` params. Remove the duplicate maps from `FlightCard.tsx`, `TripSummaryCard.tsx`, and `TripDetail.tsx` — replace with imports.

### 2. Remove emoji from `CurrencyConverter.tsx`
Line 32: Replace `💱 Currency Converter` with just `Currency Converter` (text only, consistent with the no-emoji brand rule).

### 3. Fix duplicate CTA text in `TripSummaryCard.tsx`
Line 113: Remove the left-side `"View full details"` muted text. The right-side `"View Full Plan →"` is sufficient — having both is redundant.

### 4. Responsive map height in `TripMap.tsx`
Line 154: Change `h-[400px]` to `h-[250px] sm:h-[400px]` so the map doesn't dominate mobile screens (currently takes 69% of the 581px viewport).

## Technical Details

- **New file:** `src/utils/cityImages.ts` — merged superset of all city entries, exports `getCityImage(cityName: string, width?: number, height?: number): string`
- **Modified files:** `FlightCard.tsx`, `TripSummaryCard.tsx`, `TripDetail.tsx` (remove local `cityImages` + helper, import from shared util), `CurrencyConverter.tsx` (remove emoji), `TripMap.tsx` (responsive height)

