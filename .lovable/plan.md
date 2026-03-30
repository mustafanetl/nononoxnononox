

# Real Data from Free Public APIs (No API Keys Needed)

## Overview
Replace hardcoded/AI-fabricated data with real data from completely free, no-key-required public APIs. Flights and hotels have no free public API, so those stay as AI estimates with real booking links — but weather, currency rates, and country info become real.

## Free APIs to integrate

| Data | API | Key needed? |
|------|-----|-------------|
| Weather forecast | [Open-Meteo](https://open-meteo.com) | No |
| Currency rates | [Frankfurter](https://frankfurter.app) | No |
| Country info (visa, language, timezone) | [REST Countries](https://restcountries.com) | No |
| Geocoding (lat/lng from city name) | [Nominatim/OSM](https://nominatim.openstreetmap.org) | No |

## Changes

### 1. New edge function: `enrich-destination`
Single edge function that takes a destination name and calls all 4 free APIs in parallel:
- **Nominatim** — geocode city to lat/lng + country code
- **Open-Meteo** — get 7-day weather forecast for those coordinates
- **REST Countries** — get currency, language, timezone, visa info for the country
- **Frankfurter** — get live exchange rate for destination currency vs USD

Returns a combined payload with real weather, real country info, and real exchange rates.

### 2. Update `rzuma-chat` system prompt
Add a new `destination_enrich` intent block. When the AI plans a trip, it emits:
```
\`\`\`destination_enrich
{"destination":"Paris","travelMonth":"June"}
\`\`\`
```
The frontend detects this and calls the edge function for real data.

AI still generates flights/hotels/activities as estimates (no free public API for those), but the prompt is updated to explicitly label prices as "estimated" and always include booking links.

### 3. Update `src/pages/Chat.tsx` — parse and resolve enrichment
Detect `destination_enrich` blocks in streamed responses. Call the edge function. Replace the AI-generated weather/travelinfo/currency blocks with real API data. Show a small "live data" badge on weather and travel info cards.

### 4. Update `CurrencyConverter.tsx` — live rates
Replace hardcoded `RATES` object. On mount, fetch live rates from Frankfurter API (`https://api.frankfurter.app/latest?from=USD`). Fall back to hardcoded rates if fetch fails.

### 5. Update `WeatherCard.tsx` — show real forecast
Add a "live" indicator. Accept optional `forecast` array (daily high/low for 7 days) from the enrichment response.

### 6. Update `TravelInfoCard.tsx` — real country data
Accept enriched REST Countries data (official currency, languages, timezone). Show alongside AI-provided context (visa, safety, best season — those remain AI-generated as no free API covers them well).

## Files to create
- `supabase/functions/enrich-destination/index.ts`

## Files to modify
- `supabase/functions/rzuma-chat/index.ts` — add `destination_enrich` intent to prompt
- `src/pages/Chat.tsx` — parse `destination_enrich`, call edge function, merge real data
- `src/components/CurrencyConverter.tsx` — fetch live rates from Frankfurter
- `src/components/WeatherCard.tsx` — accept real forecast data, show "live" badge
- `src/components/TravelInfoCard.tsx` — merge real country data with AI context

## What stays AI-generated (no free API available)
- Flight suggestions (estimates with Skyscanner booking links)
- Hotel suggestions (estimates with Booking.com links)
- Activity suggestions (AI knowledge with Google Maps links)
- Visa requirements, safety info, best season (AI knowledge)

## Technical Details
- All 4 public APIs are rate-limited but generous for normal use (Nominatim: 1 req/sec, Open-Meteo: unlimited, REST Countries: unlimited, Frankfurter: unlimited)
- Edge function adds a 1-second delay between Nominatim calls to respect their policy
- Frontend caches enrichment results per destination in session to avoid repeat calls
- No API keys or secrets needed — zero setup for the user

