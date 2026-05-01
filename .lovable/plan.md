## Trip View redesign — built to be screen-record-worthy

The current page is solid but flat: hero → quote → map → flights → hotels → day-by-day list → activities → footer. Everything has the same rhythm, the day-by-day section visually plateaus, and the page rewards reading more than it rewards scrolling.

The redesign keeps the magazine spirit but adds **motion, rhythm, and a clear narrative arc** so a screen recording feels like a trailer for the trip — not a list.

### The new flow

```text
HERO  →  AT-A-GLANCE STATS  →  MAP  →  FLIGHTS + HOTELS (compact)
                                          ↓
                                 DAY RAIL (sticky)
                                          ↓
                              DAY 1 · DAY 2 · DAY 3 …
                                  (alternating layout)
                                          ↓
                               EXPERIENCES (mosaic)
                                          ↓
                                   CLOSING CARD
```

### What changes

**1. Hero — alive instead of static.**
- Slow Ken-Burns zoom on the hero image (`transform: scale(1) → scale(1.08)` over 12s, infinite alternate).
- Title fades + rises in on mount (one-time, ~600ms, staggered: eyebrow → city → stats).
- Replace the "Your Jolliday" eyebrow with the trip dates if available (e.g. `MAR 12 – MAR 18 · 6 NIGHTS`); fall back to the current eyebrow.
- Add a subtle grain/noise overlay on the hero gradient for editorial feel.

**2. At-a-glance stat strip (new, replaces the pull-quote block).**
A horizontal row of 4 tiles right after the hero — big numbers, small labels. Days · Stops · Stays · From-budget. Each tile animates its number with a count-up on first view (`animate-count-up`, already in `index.css`).
The pull-quote moves to a smaller card next to the map.

**3. Map — keep it, but tighten.**
- Reduce default height (`280px → 360px`) and add a soft gradient mask at the bottom edge so it blends into the page.
- Add a one-line caption under it: `Tap a pin to open the stop.` (educates the recorder/viewer).

**4. Flights + Hotels — collapse into one "Logistics" band.**
Today they take two big stacked sections before the actual plan. New layout: a **single "Logistics" section** with two side-by-side columns on desktop (Flights left, Hotels right), each scrollable horizontally if there are many. Smaller, denser cards. This shortens the page significantly and gets to the itinerary faster.

**5. Day-by-day — the centerpiece, redesigned.**
This is where most of the visual upgrade lives.

- **Sticky day rail** at the top of the section: pill buttons `Day 1 · Day 2 · Day 3 …` that scroll-spy and highlight the active day. Clicking jumps to that day. Stays pinned just under the global header while scrolling through the itinerary.
- **Alternating layout per day**: odd days show photo on the left + slot list on the right; even days flip. Breaks the monotony of a single column.
- **Day banner upgrade**: full-bleed image with a soft parallax (translateY -10px on scroll), large day number `01` as outlined typography on the left, day title + one-line summary on the right.
- **Slot rail upgrade**: keep the timeline column but replace the dot with a numbered chip (`1 · 9:00`). On hover, the slot card lifts (`translateY(-2px)` + soft shadow). Photo strip already exists — keep it but auto-scroll a couple of pixels on hover to hint there's more.
- **Transit pill**: the `→ 12 min walk` line becomes a small rounded pill with a walking/transit icon, centered between slots, instead of an italic line buried in the text. Reads much cleaner on video.

**6. Experiences — mosaic instead of grid.**
Replace the uniform 3-col grid with a **bento mosaic**: first card spans 2 cols × 2 rows, others fill around it. Adds visual hierarchy and looks great in a scroll-by recording. Falls back to single column on mobile.

**7. Closing card — make it shareable.**
Instead of the current quiet footer line, end with a **branded share card**: trip name, days, "Crafted by Jolliday" wordmark, and big `Share` / `Download PDF` buttons. This is the moment a recorder pauses on; give them something worth pausing on.

**8. Micro-motion across the page.**
- Add `IntersectionObserver`-driven fade/slide-up on each section as it enters the viewport (one-shot, ~400ms, staggered children). Reuses existing `animate-stagger-in` utility.
- Soft hover lift on every clickable card (already partially there — make it consistent).
- Smooth scroll behavior globally on this page.

### What stays the same

- All data sources, modals (`FlightDetailModal`, `HotelDetailModal`, `ActivityDetailModal`), lightbox, save/share/PDF actions, map click handlers, swap-activity flow, owner vs. shared mode logic.
- The black-and-white SaaS aesthetic, DM Sans / Space Grotesk, no emojis in UI, no fake urgency. Per project memory.
- Free vs. premium gating is unchanged (this page is post-paywall).

### Technical notes

- Single file primarily affected: `src/pages/TripDetail.tsx`. Sub-components (`Section`, `FlightRow`, `HotelCardBig`, `ActivityTile`) get restyled in place; new `StatTile`, `DayRail`, `TransitPill`, `ClosingCard` added in the same file to keep the page self-contained.
- `src/index.css`: add 3 small keyframes (`ken-burns`, `parallax-y`, `scroll-spy-underline`) and one utility for the bento mosaic. No design-token changes — all colors stay HSL semantic tokens.
- Sticky day rail uses CSS `position: sticky; top: <header-height>` plus `IntersectionObserver` on each `<article id="day-N">` to drive the active state. No new deps.
- Count-up uses a 12-line `useCountUp` hook (no library).
- Bento grid is `grid-template-areas` with a mobile fallback to a single column.
- Map height tweak is local to this page — `TripMap` takes its container size, no prop changes needed.
- No backend, no schema, no edge function, no new package.

### Out of scope

- Reordering/editing slots inline (still done via the existing swap modal).
- Video/audio backgrounds (heavy, off-brand).
- Changing the map library or pin design (untouched).

Approve and I'll implement.