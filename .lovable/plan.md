

# Real API Data Integration

## Overview
Replace AI-generated fake flights, hotels, activities, and photos with real data from Amadeus, Google Places, and Unsplash APIs. The AI will output **search intents** instead of fake data, and the frontend will resolve them against real APIs via edge functions.

## Architecture Change

```text
Current flow:
  User message → AI → fake flights/hotels/activities JSON → render cards

New flow:
  User message → AI → search intent blocks → frontend calls edge functions → real API data → render cards
```

## API Keys Required (3 secrets to add)

1. **AMADEUS_API_KEY** + **AMADEUS_API_SECRET** — Free signup at developers.amadeus.com (500 calls/month free tier). Covers flights + hotels.
2. **GOOGLE_PLACES_API_KEY** — Google Cloud Console → Enable Places API. Covers activities, restaurants, and real photos.
3. **UNSPLASH_ACCESS_KEY** — Free at unsplash.com/developers (50 req/hr). Used for hero/city images.

## Changes

### 1. New edge function: `search-flights`
Calls Amadeus Flight Offers Search API. Accepts origin, destination, date, adults. Returns real flight data (airline, times, price, stops). Amadeus uses OAuth2 client credentials flow — the function handles token exchange internally.

### 2. New edge function: `search-hotels`
Calls Amadeus Hotel Search API. Accepts city code, check-in/check-out dates. Returns real hotel names, star ratings, prices, coordinates.

### 3. New edge function: `search-places`
Calls Google Places Nearby Search + Place Details. Accepts destination, category (restaurant, attraction, etc.). Returns real place names, ratings, photos (via Places Photos API), coordinates, descriptions.

### 4. Update edge function: `rzuma-chat`
Modify the system prompt so the AI outputs **search intent blocks** instead of fake data:

```
\`\`\`flight_search
{"from":"JFK","to":"CDG","date":"2025-06-15","returnDate":"2025-06-22","adults":2}
\`\`\`

\`\`\`hotel_search  
{"city":"Paris","checkIn":"2025-06-15","checkOut":"2025-06-22","adults":2}
\`\`\`

\`\`\`place_search
{"destination":"Paris","categories":["restaurant","museum","landmark"],"occasion":"honeymoon"}
\`\`\`
```

The AI still generates itinerary, travelinfo, weather, and quickreplies blocks directly (those don't need real APIs). It also still provides a text response.

### 5. Update `src/pages/Chat.tsx` — parse search intents
Modify `parseMessageContent` to detect `flight_search`, `hotel_search`, `place_search` blocks. When found, trigger async calls to the new edge functions and render loading skeletons while data loads, then swap in real cards.

### 6. Update `src/hooks/useRzumaChat.ts` — add search resolution
Add a post-processing step after streaming completes: scan the final assistant message for search intent blocks, call the edge functions in parallel, and replace the intent blocks with real data blocks.

### 7. Update `src/utils/cityImages.ts`
Add an `getUnsplashSearchImage(query)` function that calls the Unsplash Search API for real destination photos. Fall back to the current static map if the API key isn't set or the request fails.

### 8. Update card components for real data fields
Minor adjustments to `FlightCard`, `HotelCard`, `ActivityCard` to handle real API response fields (e.g., Amadeus returns prices in a different structure, Google Places returns `place_id` for photos).

## Files to create
- `supabase/functions/search-flights/index.ts`
- `supabase/functions/search-hotels/index.ts`
- `supabase/functions/search-places/index.ts`

## Files to modify
- `supabase/functions/rzuma-chat/index.ts` — update system prompt for search intents
- `src/pages/Chat.tsx` — parse intent blocks, call APIs, render loading states
- `src/hooks/useRzumaChat.ts` — post-stream search resolution
- `src/utils/cityImages.ts` — add Unsplash search function
- `src/components/FlightCard.tsx` — adapt to Amadeus data shape
- `src/components/HotelCard.tsx` — adapt to Amadeus hotel data
- `src/components/ActivityCard.tsx` — adapt to Google Places data

## Implementation Order
1. Add API secrets (Amadeus key+secret, Google Places key, Unsplash key)
2. Create the 3 search edge functions
3. Update the AI system prompt for search intents
4. Update frontend parsing and resolution logic
5. Adapt card components for real data fields

