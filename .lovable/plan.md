

# Simplified Paywall Gate: "Your Plan is Ready" Card

## What Changes

Right now, free users see a `PlanPreviewGate` that shows 2 teaser activities + blurred rest. The user wants something simpler and more enticing: just a beautiful destination card that says "Your plan is ready — View Full Plan" behind the paywall. No activity details leaked.

The discovery phase (AI asking questions one by one) already feels real and personal — real place names, real vibes. That stays as-is. The change is only what happens when the full plan is generated.

### Flow

```text
User chats → AI asks questions (real places, personal) → AI generates full plan →

FREE USER:
  - Skip ALL enrichment API calls (already done)
  - Show a simple card: hero image (stock/Unsplash) + destination name + stats (days/activities/hotels) + "View Full Plan" button → paywall

PREMIUM USER:
  - Full enrichment (Google Places, Xotelo, weather, etc.)
  - Show TripSummaryCard → navigates to TripDetail page
```

### Changes

**`src/components/PlanPreviewGate.tsx`** — Simplify to just a destination card with no teaser activities. Show:
- Hero image (stock Unsplash via `getCityImage`)
- Destination name + trip stats overlay
- "Your {destination} plan is ready" text
- Single "View Full Plan" button that triggers paywall
- No activity previews, no blurred section — just a clean, enticing card

**`src/pages/Chat.tsx`** — No changes needed (already gates enrichment behind `isPremium` and renders `PlanPreviewGate` for free users)

### What stays the same
- Discovery questions feel real (AI uses real venue names, reacts naturally)
- Enrichment is already skipped for free users
- PaywallModal already has contextual copy with destination + stats
- Premium users get full enriched TripSummaryCard → TripDetail

## Technical Details
- Only 1 file modified: `PlanPreviewGate.tsx`
- Remove the teaser activities section and blurred section
- Keep the hero image + stats overlay
- Make the card more visually compelling with a larger hero and prominent CTA

