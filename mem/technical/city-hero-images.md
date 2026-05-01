---
name: City hero images
description: How city hero/card images are resolved — curated stock + Wikipedia REST fallback for unlisted cities
type: feature
---
City hero images (TripDetail hero, TripSummaryCard chat card, PlanPreviewGate)
all use the `useCityHeroImage(city)` hook from `src/hooks/useCityHeroImage.ts`.

Resolution order:
1. **Curated stock** — `STOCK_CITY_HEROES` in `src/utils/cityImages.ts`, ~80 hand-picked Unsplash skylines for major cities. Instant, no network.
2. **Wikipedia lead image** — `fetchWikipediaCityImage()` hits `en.wikipedia.org/api/rest_v1/page/summary/<title>` and reads `originalimage.source` (or `thumbnail.source`). Free, no API key, accurate for any city. Cached in memory + sessionStorage (`jolliday-wiki-img:<key>`) so only one fetch per city per session.
3. **Generic pool** — last-resort skyline from `GENERIC_HERO_POOL` (deterministic by city hash).

Why: the curated list alone caused wrong images (e.g. Baghdad showing a Paris skyline). Wikipedia guarantees the right city. Google Places photos are still preferred for activities/places — only city-level heroes use this hook.

Do NOT remove the Wikipedia fetch in favour of asking the AI for image URLs — Wikipedia is more reliable and cheaper.