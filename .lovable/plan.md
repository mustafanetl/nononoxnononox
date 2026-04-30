## Goal

Right now, every photo in an itinerary slot (the big hero AND the small thumbnail strip below) does the exact same thing: opens the activity modal. So the extra Google Places photos feel pointless. Let's make them feel like a real photo gallery — Instagram/reels style — that the user actually wants to scroll through.

## What changes for the user

**On the trip detail page (each itinerary slot):**
- The hero photo gets a subtle "1 / 6" counter and a small "View photos" hint when there are extras.
- Tapping the hero photo still opens the activity modal (for booking / details).
- Tapping any thumbnail in the strip below opens a new **full-screen lightbox** focused on that photo — not the activity modal.
- The thumbnail strip is restyled as a polished "reel" row: rounded portrait tiles, soft gradient overlay, a "+N" indicator on the last visible tile if there are more photos than fit.

**New full-screen photo lightbox (`PhotoLightbox`):**
- Black, immersive, edge-to-edge image with the venue name and "3 / 8" counter at the top.
- Swipe left/right on mobile, arrow buttons + keyboard arrows on desktop to move between photos.
- Bottom strip with all thumbnails — current one highlighted, tap to jump.
- A clear "View activity details" button at the bottom that closes the lightbox and opens the existing activity modal — so users can still get to booking info, but only when they want to.
- Esc closes; tap outside image area closes; swipe down on mobile closes.

**Activity modal itself (small upgrade):**
- Replace the static single hero image with a mini carousel using the same `realPhotos` array (left/right arrows, dot indicators), so opening the modal also shows all photos rather than just one.

## Technical notes

Files to touch:

1. **New: `src/components/PhotoLightbox.tsx`**
   - Props: `photos: string[]`, `startIndex: number`, `venueName: string`, `open`, `onOpenChange`, `onViewDetails?: () => void`.
   - Built on existing `Dialog` (full-screen variant: `max-w-none w-screen h-screen p-0 bg-black`).
   - Internal `currentIndex` state, keyboard listener (ArrowLeft/Right/Escape), touch swipe handlers (track `touchStartX`).
   - Bottom thumbnail rail (horizontal scroll, snap), highlight active.
   - "View activity details" button only renders if `onViewDetails` is provided.

2. **`src/pages/TripDetail.tsx` (slot rendering block, lines ~432–558)**
   - Add state: `lightboxOpen`, `lightboxPhotos`, `lightboxIndex`, `lightboxVenue`, `lightboxOnDetails`.
   - Hero `<button>` keeps `onClick={openModal}`. Add a "1 / N" badge in the corner when `reels.length > 1`.
   - Thumbnail strip buttons change `onClick` to `openLightbox(reels, ri, slot.venue, matched ? openModal : undefined)`.
   - Last visible tile shows "+N" overlay if `reels.length > 5`.
   - Render `<PhotoLightbox … />` once at the bottom of the page next to the existing modals.

3. **`src/components/ActivityDetailModal.tsx`**
   - Replace the single `<img>` in the 48-height header with a small carousel:
     - Use `activity.realPhotos ?? (activity.realPhoto ? [activity.realPhoto] : [])`.
     - Local `idx` state, prev/next chevron buttons (only when length > 1), dot indicators at the bottom of the image.
     - Same overlay/title structure preserved.

4. **No backend / data changes.** All photos are already being passed through via `realPhotos` from the prior fix.

## Out of scope

- Video reels (Google Places API doesn't return video; would need a separate provider — flag this for later if user asks).
- Pinch-to-zoom inside the lightbox (can add later if requested).

## Acceptance check

- Open a Tokyo (or any) itinerary with multiple photos per venue.
- Tap hero → activity modal opens (with carousel inside).
- Tap a thumbnail → full-screen lightbox opens on that photo, can swipe through all of them.
- "View activity details" button in lightbox opens the activity modal.
- Esc / tap outside / swipe down closes the lightbox.
