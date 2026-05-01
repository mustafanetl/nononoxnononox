# Use stock city hero on the city card

## Problem
The city card shown in chat (and the free-user preview gate) currently picks the first **Google Places** image returned by enrichment. That image is often random — a building interior, a single landmark detail, or a low-quality crop — instead of a recognizable skyline.

The TripDetail hero was already fixed to prefer the curated `getStockCityImage()` lookup (high-quality Unsplash skyline per city, with a deterministic generic fallback). The chat card and preview gate were not updated, so the card and the hero can show very different images for the same city.

## Goal
Make the **city card in chat** and the **free-user preview** use the same high-quality stock city hero as TripDetail, falling back to Google Places enrichment only when no curated/generic stock image is available.

## Changes

### 1. `src/components/TripSummaryCard.tsx`
- Import `getStockCityImage` from `@/utils/cityImages`.
- Compute `heroImg = getStockCityImage(destination) || enrichedImages?.[0]?.thumbUrl || enrichedImages?.[0]?.url`.
- Render the `<img>` whenever `heroImg` is truthy (which it almost always will be, since `getStockCityImage` has a deterministic generic-pool fallback). Drop the gradient/MapPin placeholder branch in practice but keep it as a final safety net.

### 2. `src/components/PlanPreviewGate.tsx`
- Currently: `const heroImg = enrichedImages?.[0]?.url || enrichedImages?.[0]?.thumbUrl || getCityImage(destination, 800, 500);`
- Change priority to: `const heroImg = getStockCityImage(destination) || enrichedImages?.[0]?.url || enrichedImages?.[0]?.thumbUrl || getCityImage(destination, 800, 500);`
- Add the `getStockCityImage` import alongside `getCityImage`.

### 3. No changes needed
- `src/utils/cityImages.ts` — `getStockCityImage` already covers ~dozens of cities + a stable generic-pool fallback by hash, so every destination resolves to a high-quality image.
- `src/pages/TripDetail.tsx` — already uses the same priority; this just brings the card in line.

## Result
The city card in chat will show the same recognizable skyline as the trip detail hero (e.g. Lisbon → Lisbon skyline, not a random restaurant interior). Behavior is consistent across chat card → preview gate → trip detail hero.

## Note on project memory
Project memory currently says "NO stock images; use Google Places API exclusively." Your recent direction (curated stock heroes in `cityImages.ts` + TripDetail) overrides that, and this change extends the same approach to the card. After approval I'll update the memory to reflect the new rule: *curated city heroes are allowed for the city hero/card; activities and places still use Google Places only.*
