

# Visual Discovery: Show Places While Chatting

## Concept

During the discovery conversation, the AI will embed inline destination/place images as it mentions them. When it says "how about Bali?" it shows a photo carousel of Bali right there in the chat. This makes the experience feel immersive and real — users see the places as they discuss them, building emotional investment before the paywall.

All images use Unsplash stock photos (zero API cost). No Google API calls during discovery.

## Changes

### 1. New card block: `place_images` (AI prompt + parser)

Add a new markdown block format the AI can emit during discovery:

```
```place_images
{"place":"Bali","images":["beach","temple","sunset","food"]}
```
```

The `images` array maps to Unsplash photo IDs from a curated set per destination. The parser extracts this like other blocks.

### 2. New component: `PlaceShowcase.tsx`

A horizontal image carousel that renders inline in chat during discovery. Shows 2-4 beautiful photos of a place with the place name overlaid. Compact, swipeable, visually rich. Uses curated Unsplash IDs — no API calls.

### 3. Expand `cityImages.ts` with multi-image sets

Currently stores 1 image per city. Expand to store 3-4 images per destination covering different vibes (beach, food, architecture, nightlife). These are all free Unsplash photo IDs.

### 4. Update AI system prompt (`rzuma-chat/index.ts`)

Add instruction: during discovery steps, when mentioning a specific place, include a `place_images` block to show photos. Different behavior per mode:
- **TRIP**: Show destination photos — "how about Bali?" + beach/temple/sunset images
- **LOCAL**: Show venue/neighborhood vibes — restaurant interiors, street scenes
- **DATE**: Show romantic spot imagery — cozy restaurants, rooftop bars, sunset views

Also instruct the AI to sometimes show 2 places side by side for comparison: "Rome or Barcelona?" with images of both.

### 5. Update `Chat.tsx` parser + renderer

- Add `placeImages` to `parseMessageContent` output
- Render `PlaceShowcase` inline in message flow (between text and quickreplies)
- Works for both free and premium users (no gating — this is the hook)

## Files

| File | Action |
|------|--------|
| `src/utils/cityImages.ts` | Add multi-image sets per destination |
| `src/components/PlaceShowcase.tsx` | New — inline image carousel component |
| `src/pages/Chat.tsx` | Parse + render `place_images` blocks |
| `supabase/functions/rzuma-chat/index.ts` | Update prompt with `place_images` format + per-mode instructions |

## What This Achieves

- Discovery feels visual and alive — users see real photos as they chat
- Zero API cost — all Unsplash stock IDs, no Google calls
- Builds emotional investment before paywall ("I can already picture myself there")
- Differentiates modes visually (trip vs date vs local get different imagery vibes)

