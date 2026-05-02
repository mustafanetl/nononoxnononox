
## Make the in-chat plan card look like the Trip page

Right now, when the AI finishes a plan in chat, the card that appears is a small, generic 2xl-rounded thumbnail with a tiny `📍 City` label and three icon counters (`✈ 2 flights · 🏨 3 hotels · ✨ 8 activities`) and a `View Full Plan →` link. The premium gate (`PlanPreviewGate`) is the same thing with a paywall stacked underneath. It feels like a notification — not the moment a TikTok viewer screenshots.

We'll rebuild both cards to feel like a **mini Trip page** — cinematic hero, big editorial typography, stat tiles, animated entrance. Same data, same click → `/trip/view`, same paywall logic. Just dramatically more shareable.

### New card anatomy (used by both `TripSummaryCard` and `PlanPreviewGate`)

```text
┌──────────────────────────────────────────┐
│  [Ken-Burns hero image, 240–280px tall]  │
│   ░░ noise + bottom gradient ░░          │
│                                          │
│  MAR 12 – MAR 18 · 6 NIGHTS              │ ← eyebrow (or "YOUR JOLLIDAY")
│  Lisbon                                  │ ← huge serif-ish title, letter-rise
│  Six days of pastéis, miradouros…        │ ← one-line poetic subtitle
└──────────────────────────────────────────┘
   ┌──────┬──────┬──────┬──────┐  ← stat tiles, overlapping hero by -24px
   │  6   │  12  │  3   │ $1.2k│
   │ DAYS │STOPS │STAYS │ FROM │
   └──────┴──────┴──────┴──────┘

   [Day rail preview: ●─●─●─●─●─●]  ← thin dotted timeline w/ day numbers
   "Day 1 — Alfama wander · Day 2 — Sintra…"  ← single line scrolling teaser

   ── divider ──
   ┌─────────────────────────────┐
   │  Open full plan      →      │   ← black pill button, full width
   └─────────────────────────────┘
```

For `PlanPreviewGate` (free users), the **stat tiles + day-rail teaser stay**, then below the divider we keep the existing paywall (features list, plan toggle, CTA) — but it sits inside the same cinematic frame so the whole card reads as one premium artifact, not two stacked widgets.

### Visual details (matching TripDetail)

- **Hero image**: `animate-ken-burns` + `animate-punch-in` (already in `index.css`), with `noise-overlay` and the same `bg-gradient-to-b from-black/55 via-black/15 to-card` wash.
- **Title**: `text-4xl sm:text-5xl font-bold tracking-tight`, white, `letter-rise` per character (same util used on Trip page).
- **Eyebrow**: prefer `MMM DD – MMM DD · N NIGHTS` if `tripData.startDate/endDate` exist; otherwise `YOUR JOLLIDAY` with the `Compass` icon. `text-[10px] uppercase tracking-[0.35em] text-white/85`.
- **Stat tiles**: reuse the visual style of `StatTile` from `TripDetail.tsx` — small rounded card, thin border, big number + tiny uppercase label + icon. Overlap the hero by `-mt-6` to mirror the Trip page's `-mt-12` overlap (smaller because the card is smaller).
- **Day rail**: 6–8 small numbered dots connected by a 1px dotted line. First dot is `bg-primary`, rest are `border-border`. Below it, one truncated line: `Day 1 — {first slot title} · Day 2 — {first slot title} …`.
- **CTA**: full-width black pill (`bg-primary text-primary-foreground`) with the same hover lift used elsewhere. For the paywall variant, the existing `Start Free Trial — 3 Days Free` button stays; we just restyle its container to match.
- **Card frame**: `rounded-3xl` (was `rounded-2xl`), `border border-border`, `shadow-xl`, `overflow-hidden`. Width grows from `max-w-sm` to `max-w-md` so the hero has room to breathe in chat.
- **Entrance**: `animate-stagger-in` on the whole card, staggered children for eyebrow → title → subtitle → stats → day rail → CTA (same rhythm as TripDetail hero rise).

### What stays the same

- Click → `sessionStorage.setItem("jolliday-trip-detail", …)` then `navigate("/trip/view")`.
- Paywall trigger logic for free users (still routes through `PaywallModal` / `startCheckout`).
- All data sources (`enrichedImages`, `useCityHeroImage`, `data.itinerary/flights/hotels/activities`).
- Black & white SaaS palette, DM Sans / Space Grotesk, no emojis in UI, no fake urgency. Per project memory.
- Free vs. premium gating logic in `Chat.tsx` is untouched — it still picks `TripSummaryCard` or `PlanPreviewGate`.

### Files touched

- `src/components/TripSummaryCard.tsx` — full rewrite of the JSX (logic unchanged). Add internal `StatTile` and `DayRailMini` components.
- `src/components/PlanPreviewGate.tsx` — restyle the hero block to match the new `TripSummaryCard` hero (same Ken-Burns, same eyebrow/title/subtitle, same stat tiles, same day rail). The paywall block (features + plan toggle + CTA) stays functionally identical, just rewrapped to sit below the divider inside the same `rounded-3xl` frame.
- `src/index.css` — no new animations needed; reuses existing `animate-ken-burns`, `animate-punch-in`, `animate-hero-rise`, `letter-rise`, `noise-overlay`, `animate-stagger-in`. If any utility is page-scoped to TripDetail, lift it to a global utility so the chat card can use it.

### Out of scope

- Changing what data the AI returns or how the plan is generated.
- Touching the actual `/trip/view` page (already redesigned).
- New backend, schema, edge function, or package.
- Reordering cards in chat or changing the streaming/quick-replies flow.

Approve and I'll implement.
