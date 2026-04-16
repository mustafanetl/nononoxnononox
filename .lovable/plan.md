
Goal: make Jolliday feel trustworthy by showing fewer, better, verified recommendations instead of flashy but random ones.

What’s actually going wrong
- The AI is being asked to invent very specific venues, prices, hotel picks, and itinerary details with no verification step, so it can hallucinate.
- The image layer then tries to match those invented names to Google Places, which can return the wrong business/photo.
- The frontend cache keys enrichment only by destination/month, so old photos can be reused for a different set of activities/hotels in the same city.
- Hotels are currently replaced wholesale with generic live hotel results, which breaks the connection between the AI’s plan and what the user sees.
- Destination fallback photos are still reused in places where they don’t represent the actual item.

Implementation plan

1. Rework the AI output to reduce hallucinations
- Update `supabase/functions/rzuma-chat/index.ts` so the AI:
  - asks short follow-ups when key trip facts are missing
  - generates fewer recommendations, but each one must be specific and practical
  - avoids exact claims it cannot know confidently
  - prioritizes neighborhoods, sequencing, and rationale over made-up details
- Tighten the prompt so flights/hotels are only included when trip inputs are actually sufficient.

2. Add a validation layer before trusting plan details
- Extend `supabase/functions/enrich-destination/index.ts` to validate each activity and hotel against Google Places using:
  - normalized name matching
  - destination/city matching
  - category/type matching
  - confidence thresholds
- Return verification metadata per item, such as:
  - matched place name
  - formatted address
  - rating
  - confidence score
  - verified photo URLs
- If confidence is low, do not attach a random photo or fake metadata.

3. Stop swapping the plan out from under the user
- Update `src/pages/Chat.tsx` so AI-generated hotels are not blindly replaced by generic hotel listings.
- Keep the original plan items, then enrich only the ones that can be confidently matched.
- If live hotel data is shown, present it as alternative booking options instead of silently replacing the plan.

4. Fix image relevance and stale-photo bugs
- Change the enrichment cache key in `src/pages/Chat.tsx` to include destination + activity names + hotel names, not just destination/month.
- Only show Google photos when the item match is confident.
- Remove misleading destination-photo fallbacks for hotels/flights/activities where there is no exact match.
- Keep destination hero images only for destination-level cards.

5. Make trust visible in the UI
- Update `src/components/ActivityCard.tsx`, `src/components/HotelCard.tsx`, and relevant detail modals/pages to show:
  - verified place/address when available
  - “verified” vs “suggested” state
  - cleaner fallback UI when an item is not verified
- This makes it obvious what is real-time matched versus AI suggestion.

6. Improve usefulness of the plan itself
- Refine itinerary generation so it solves travel pain points:
  - realistic geographic flow
  - practical transit between stops
  - book-ahead warnings
  - fewer filler items
  - clearer daily pacing
- Keep the focus on decisions users actually need: where to stay, what to book first, and how to structure the day.

7. Add safeguards for bad outputs
- In `supabase/functions/rzuma-chat/index.ts`, detect incomplete/truncated AI output and handle it safely instead of trusting partial plan data.
- If validation fails for too many items, fall back to a simpler, more honest plan rather than rendering messy, low-confidence content.

Files to update
- `supabase/functions/rzuma-chat/index.ts`
- `supabase/functions/enrich-destination/index.ts`
- `src/pages/Chat.tsx`
- `src/components/ActivityCard.tsx`
- `src/components/HotelCard.tsx`
- likely `src/components/ActivityDetailModal.tsx`
- likely `src/components/HotelDetailModal.tsx`
- possibly `src/components/TripSummaryCard.tsx` / `src/pages/TripDetail.tsx` for verified-state display consistency

Expected outcome
- Better venue accuracy
- Better image relevance
- No stale/random photos from previous enrichments
- No confusing hotel replacement
- Plans that feel simpler, more grounded, and more useful for real travel decisions

Technical notes
- I recommend keeping Google APIs as the source of truth for images and place verification.
- The AI should handle taste, structure, and personalization.
- The backend enrichment step should handle verification, metadata, and trust scoring.
- The UI should clearly separate verified facts from AI suggestions.
