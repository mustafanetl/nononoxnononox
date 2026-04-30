
# Landing page redesign — "big brand" feel

Goal: kill the generic-AI-startup vibe. The page should feel like a confident consumer travel brand (think Airbnb / Hopper / Going.com / Linear-level polish), not a Tailwind template. Same black & white palette, same fonts (Inter, per current setup), but with stronger typography, real product proof, and intentional layout.

## What changes, section by section

### 1. Header
- Slim, almost invisible until scroll; logo wordmark + minimal nav.
- Add subtle nav links: `Plan a trip`, `Examples`, `Pricing` (anchor links). Keeps it feeling like a real product.
- Auth/CTA buttons stay top-right.

### 2. Hero (search stays in hero, per your call)
Replace the centered "Plan your next trip with AI" template hero with a **left-aligned editorial hero on a 12-col grid**:

```text
┌────────────────────────────────────────────────────┐
│  [eyebrow: Your AI travel agent]                   │
│                                                    │
│  Trips, planned                                    │
│  in a conversation.        ← oversized display     │
│                              type, tight leading   │
│                                                    │
│  Tell us where. We handle flights, hotels,         │
│  what to eat, what to skip.                        │
│                                                    │
│  ┌────────────────────────────────────┐ [Plan →]   │
│  │ Where do you want to go?           │            │
│  └────────────────────────────────────┘            │
│  Try: Paris · Tokyo · Bali                         │
│                                                    │
│  [tiny row: ★ 4.9  ·  10k+ trips planned  ·  …]    │
└────────────────────────────────────────────────────┘
```

- Display headline ~72–96px on desktop, tracking tight, weight 700.
- No gradient, no animated blob, no "AI sparkle" — just type.
- Search bar keeps current behavior, restyled flatter (single thin border, no heavy shadow).
- Tiny social-proof strip under the search (static, honest copy — no fake numbers).

### 3. NEW — Live product preview ("This is what you get")
The strongest anti-AI-template move. A faux-browser frame showing a real-looking Jolliday plan:

```text
┌─ jolliday.online/trip ─────────────────────────────┐
│  Lisbon · 4 days · for two                         │
│                                                    │
│  Day 1                                             │
│  09:00  Pastéis de Belém — pastry + walk           │
│  11:30  Jerónimos Monastery                        │
│  13:00  Lunch at Cervejaria Ramiro                 │
│  ...                                               │
│  ┌─────┐  ┌─────┐  ┌─────┐                         │
│  │photo│  │photo│  │photo│   ← real Lisbon photos  │
│  └─────┘  └─────┘  └─────┘     (Google Places)     │
└────────────────────────────────────────────────────┘
```

- Static / hand-built mock — no real API call needed on landing.
- Real Google Places photos for Lisbon (already available via the cached enrichment OR commit a few stable URLs).
- Slight tilt / drop shadow to feel like a screenshot of the real app, not a marketing illustration.
- Caption: small, italic — "An actual 4-day Lisbon plan, made by Jolliday in 14 seconds."

### 4. Popular destinations — redesigned (asymmetric magazine grid)
Keep the cities, kill the templated 2-up + 4-up grid. Replace with:

```text
┌──────────────────┬─────────┐
│                  │         │
│   PARIS  (big)   │  TOKYO  │
│                  │         │
├──────────┬───────┴─────────┤
│          │                 │
│  BALI    │  MALDIVES (big) │
│          │                 │
├──────────┴────┬────────────┤
│  BARCELONA    │  DUBAI     │
└───────────────┴────────────┘
```

- Mixed aspect ratios, oversized destination names overlapping the image edge (classic editorial move).
- City name in heavy display type, country/region as tiny caps below.
- Hover: image zooms slowly, name underlines. No buttons.
- Section heading: small uppercase eyebrow `Where people go` + large headline `Start somewhere`.

### 5. NEW — "How it feels" / value props (replaces 1-2-3 step cards)
Drop the templated numbered steps. Replace with **3 short value statements as full-width rows** with a single supporting visual on the right of each:

- `Stop tab-hopping.` — one prompt, full plan.
- `Real places, real photos.` — every spot verified.
- `Yours forever.` — save, edit, share, export.

Each row: large statement (left) + small supporting image or icon-free typographic detail (right). No cards, no borders, just rhythm.

### 6. Closing CTA band
A single quiet band before the footer:
- Headline: `Where to next?`
- One input field (mirrors hero) + one button.
- No background image, no gradient. Just a thin top border and generous padding.

### 7. Footer — refined
Keep the existing 4-column footer but:
- Tighten typography (smaller, more letter-spacing on column titles).
- Add a top row with an oversized wordmark `Jolliday` (display weight) — the kind of touch big brands do.
- Keep all current links.

## Style notes (technical)

- **No new dependencies.** All Tailwind + existing components.
- **Type scale**: introduce 2 utility classes via inline Tailwind for display (`text-6xl md:text-8xl tracking-tight font-bold leading-[0.95]`) — used in hero + closing CTA + footer wordmark.
- **Color**: stay strict B&W. Allowed greys only. No accent color (keeps the "big brand confidence" look).
- **Borders**: single hairline (`border-border`), never doubled.
- **No scroll-triggered reveal animations** (per project memory).
- **Images**: keep current Unsplash city images for the destinations grid for now (they're already in `Index.tsx`). For the product preview mock, use 3 stable Lisbon Google Places photo URLs hardcoded in the component (no live fetch on landing).

## Files

| File | Change |
|---|---|
| `src/pages/Index.tsx` | Replace destinations grid layout, replace "How It Works" section, add product preview section, add closing CTA band, refine footer top |
| `src/components/HeroSection.tsx` | Rewrite to left-aligned editorial layout with display type + social-proof strip |
| `src/components/landing/ProductPreview.tsx` (new) | Faux-browser Lisbon trip mock with real photos |
| `src/components/landing/ValueRows.tsx` (new) | Three full-width value statements replacing step cards |
| `src/components/landing/DestinationsMosaic.tsx` (new) | Asymmetric magazine-grid version of popular destinations |

## Outcome
Same conversion path (search-first hero → destinations → CTA), but the page now reads like a polished consumer brand: confident typography, real product proof instead of generic step cards, and an editorial destinations grid. Nothing on the page screams "Tailwind template" anymore.
