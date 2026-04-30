## Plan

I’ll apply your solution. It is a good fix, and I’ll enforce it everywhere the app searches for activity or restaurant photos so the place lookup is always tied to the destination city.

### What I’ll update

1. Tighten activity and restaurant photo search queries
- Update the backend enrichment logic so every activity/place lookup always includes the city context explicitly.
- Use a stronger query format than the current loose search, so restaurant/activity lookups are consistently scoped to the destination.
- Keep matching strict so the app prefers “right place in the right city” over “some place with the same name elsewhere.”

2. Fix the first hydration path in chat
- Update the chat page logic so it stops assigning generic destination images to activities when a place match fails.
- Only use verified place photos for activities/restaurants.
- If no verified match exists, show no photo instead of the wrong city or wrong venue.

3. Restore multi-photo activity galleries
- Keep up to 4 real place photos when the provider returns them.
- Ensure the first photo becomes the main image and the remaining ones appear as supporting photos.
- Preserve the dedupe logic so the same image does not appear twice in different sizes.

4. Keep trip detail behavior aligned
- Make sure the trip detail page uses the same verified, city-scoped photo set.
- Prevent day cards, slot cards, and activity modals from falling back to unrelated venue photos.

5. Verify the result in the preview
- Check that a Rotterdam activity with a valid place match gets the correct city-specific photo set.
- Confirm that activities/restaurants can show up to 4 real images again when available.
- Confirm that unmatched places stay blank instead of showing the wrong image.

## Expected outcome

- Activities and restaurants will be searched with city context every time.
- Wrong-city matches should drop sharply.
- If Google Places has 4 photos for a matched venue, those 4 will be available again.
- If a place cannot be matched confidently, the UI will avoid fake or misleading images.

## Technical details

Files likely involved:
- `supabase/functions/enrich-destination/index.ts`
- `src/pages/Chat.tsx`
- `src/pages/TripDetail.tsx`
- `src/components/ActivityDetailModal.tsx`
- `src/utils/photoGallery.ts`

Concrete implementation notes:
- Replace weak activity fallbacks in `Chat.tsx` that currently use destination hero images.
- Standardize activity photo assignment to prefer `match.photo` plus `match.photos.slice(0, 4)`.
- Strengthen lookup queries in the enrichment function to always include destination/city context for restaurants and activities.
- Keep the existing duplicate-photo protection so 1600px and 400px variants of the same Google photo are treated as one image.

If you approve, I’ll apply these changes now.