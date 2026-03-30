

# AI Chat Experience — Issues & Improvements

## Problems Found

### 1. FlightCard still shows `~` and "Approx." — contradicts cleanup
`FlightCard.tsx` line 127: `"Approx."` label, line 133: `from ~{flight.currency}{flight.price}`. The TripDetail page had these removed but the chat inline cards still show them.

**Fix:** Remove "Approx." label and `~` prefix. Show just `{flight.currency}{flight.price}`.

### 2. HotelCard still shows `~` prefix
`HotelCard.tsx` line 36: `from ~{hotel.currency}{hotel.pricePerNight}/night`.

**Fix:** Remove `~`. Show `from {hotel.currency}{hotel.pricePerNight}/night`.

### 3. ActivityCard still shows `~` prefix
`ActivityCard.tsx` line 83: `~{activity.currency}{activity.price}`.

**Fix:** Remove `~`. Show `{activity.currency}{activity.price}`.

### 4. System prompt still tells AI to say "Prices are approximate" repeatedly
The system prompt doesn't explicitly say this, but the AI's behavior of generating `~` everywhere is driven by the prompt saying "All prices shown are ESTIMATES." This is fine — the issue is the frontend rendering, not the prompt.

### 5. Chat welcome text is outdated
`Chat.tsx` line 349-351: `"I can help you plan trips, find flights, hotels, and discover activities for any occasion."` — doesn't reflect the broader capabilities (date ideas, local experiences) that were updated on the landing page.

**Fix:** Update to match the landing page copy: `"Plan trips, find flights, hotels, local experiences, date ideas, and more."`

### 6. Chat suggestions are narrow
`Chat.tsx` lines 198-203: Only travel-focused suggestions. Missing broader use cases like date nights, local things to do.

**Fix:** Update suggestions to match HeroSection:
- `"Romantic date night in Paris"`
- `"Weekend things to do in Tokyo"`
- `"Family adventure in Bali"`
- `"Solo trip to Barcelona"`

### 7. System prompt quick reply options sometimes feel generic
The prompt says to include quick replies but the examples are all travel-centric. For non-travel queries (date ideas, local activities), the AI should suggest contextual follow-ups.

**Fix:** Add a note to the system prompt: "For date/local activity queries, suggest replies like 'Add dinner reservations', 'Show more options', 'Different area'."

### 8. TripSummaryCard still shows "Prices are approximate"
`TripSummaryCard.tsx` line 113: `"Prices are approximate"` — this was supposed to be removed from everywhere except the footer.

**Fix:** Change to just "View full details" or remove the text entirely.

### 9. "from" prefix on flight/hotel prices is redundant noise
FlightCard line 133: `from ~$850`, HotelCard line 36: `from ~$120/night`. The word "from" alongside a tilde alongside "Approx." is triple-hedging.

**Fix:** Remove "from" as well. Just show the price.

### 10. System prompt uses exclamation marks excessively
Line: `"Bali is such a dreamy choice for a honeymoon!"` — the AI tends to be excitable. The prompt says "casual like a quick text from a friend" but the actual output can feel over-enthusiastic.

**Fix:** Add to system prompt: `"Avoid exclamation marks. Keep tone warm but not excitable."`

## Summary of Changes

### Files to modify:
1. **`src/components/FlightCard.tsx`** — Remove "Approx.", `from`, and `~` from price display
2. **`src/components/HotelCard.tsx`** — Remove `from ~` from price display
3. **`src/components/ActivityCard.tsx`** — Remove `~` from price display
4. **`src/components/TripSummaryCard.tsx`** — Remove "Prices are approximate" text
5. **`src/pages/Chat.tsx`** — Update welcome text and suggestion chips to reflect broader capabilities
6. **`supabase/functions/rzuma-chat/index.ts`** — Add tone guidance ("avoid exclamation marks") and contextual quick reply examples for non-travel queries

