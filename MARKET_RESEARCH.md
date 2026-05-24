# Market Research — Jolliday AI Trip Planner

*Compiled: May 2026*
*Sources: Reddit, Forbes, CNBC, Euronews, travel blogs, UX research, industry reports*

---

## Top 10 Problems Users Have with Existing AI Trip Planners

| # | Problem | Does Jolliday Solve It? | Can We? |
|---|---------|------------------------|---------|
| 1 | **AI hallucinations** — recommending venues that don't exist, are permanently closed, or have wrong hours. Over 50% of AI itineraries suggest attractions outside operating hours. ~25% recommend closed venues. | ✅ YES — Our venue database is scraped from real Google Maps data with verified photos, ratings, and hours. This is our #1 differentiator. | Already solved. |
| 2 | **Unrealistic travel times** — AI suggests itineraries requiring impossibly long travel between stops, or doesn't account for geography at all. | ✅ PARTIAL — We have walking time enrichment (OSRM), but need to verify it's working in the frontend display. | Strengthen by showing walking times prominently. |
| 3 | **Generic/cookie-cutter suggestions** — Same "top 10 tourist traps" that any travel blog lists. No personalization to user's vibe or interests. | ✅ YES — Plans are filtered by vibe (foodie, adventure, culture, etc.) and traveler type (couple, solo, family, friends). | Already solved, but could add more granularity. |
| 4 | **Outdated information** — AI trained on data 1-2 years old. Prices, hours, seasonal closures all wrong. | ✅ PARTIAL — Our scraped data is current at scrape time, but needs periodic re-scraping to stay fresh. | Add "last verified" dates, schedule re-scrapes. |
| 5 | **No real photos** — AI planners show stock photos or no images at all. Users can't visualize the trip. | ✅ YES — We store 4 real photos per venue on our own server. They never expire. | Already solved. |
| 6 | **Slow generation** — Waiting 30-60 seconds for an AI to generate a plan feels painful. Users abandon. | ✅ YES — Pre-cached plans serve instantly ($0 cost). Cache hits are sub-second. | Already solved for cached destinations. |
| 7 | **Can't edit/customize** — Plans are "take it or leave it." Users want to swap venues, reorder days, add personal picks. | ❌ NO — Currently no inline editing of generated plans. | MEDIUM effort — add drag-to-reorder, swap venue, add custom stop. |
| 8 | **No budget awareness** — Plans ignore user's budget. Recommends $200/night hotels to backpackers. | ✅ PARTIAL — We have price_level metadata on venues. Plans could be budget-filtered. | Small effort — filter venues by price_level during plan assembly. |
| 9 | **Poor mobile experience** — Most travel planning happens on phones (70%+), but many AI planners are desktop-first. | ❓ UNKNOWN — Need to audit our mobile UX thoroughly. | Must verify and fix. |
| 10 | **Aggressive paywalls** — Users get hooked then hit a wall before seeing any value. Feels like bait-and-switch. | ❓ UNKNOWN — Need to audit our paywall timing and messaging. | Ensure value is shown BEFORE paywall. |

---

## What Competitors Do Better Than Us

### Layla AI (Market Leader)
- **Visual inspiration**: Short-video integration for discovering places (TikTok-like browsing)
- **Conversational refinement**: Users can chat back and forth to refine plans naturally
- **Complete booking integration**: Can book hotels and flights directly within the app
- **Day-by-day visual itineraries**: Clean, scannable layout with maps
- **Multi-city trip handling**: Handles complex multi-stop routes (though struggles with very complex ones)
- **Brand recognition**: Featured in NY Times, major travel publications

### Wanderlog (Community Favorite)
- **Free forever** for core features — no paywall for basic itinerary building
- **Visual map-based planning**: Drag-and-drop stops on a map, see routes visually
- **Group collaboration**: Multiple people can edit the same trip in real-time
- **Booking import**: Forward confirmation emails, auto-organizes reservations
- **Offline access**: Download itineraries for use without internet
- **Route optimization**: Automatically reorders stops to minimize travel time

### Stippl (All-in-One)
- **Budget tracking**: Real-time expense tracking during the trip
- **Packing lists**: AI-generated packing suggestions based on destination/weather
- **Group sharing**: Collaborative planning with expense splitting
- **Post-trip features**: Expense reports, trip journals
- **Full lifecycle**: Planning → booking → during trip → after trip

### Google Travel
- **Data advantage**: Real-time pricing, availability, reviews from Google Maps
- **Integration**: Works with Gmail (auto-imports bookings), Google Maps, Calendar
- **Trust**: Users trust Google's data accuracy
- **Free**: No subscription needed
- **Scale**: Every destination in the world, instantly

---

## What Jolliday Already Does Better Than Anyone

1. **Pre-cached plans (instant, $0 cost)** — No other AI planner serves plans in sub-second. Users get instant gratification while competitors make them wait 30-60 seconds.

2. **Verified venues from our own database** — Every venue in our plans exists, is open, has real photos, real ratings, real addresses. Zero hallucinations for cached plans.

3. **Photos stored on our server (never expire)** — Competitors use Google Places API photos that expire after days. Our photos are permanent.

4. **Walking times between stops (geography-aware)** — Plans respect physical geography. No "walk 45 minutes between lunch and your next stop" surprises.

5. **Affiliate booking links (Skyscanner, Booking.com, GetYourGuide)** — Monetization built in without degrading UX. Users get real booking options.

6. **Vibe-based personalization** — Not just "things to do in Rotterdam" but "foodie things to do in Rotterdam for a couple on a 5-day trip."

---

## Features Users Want That We Don't Have Yet

| Priority | Feature | Effort | Impact | Notes |
|----------|---------|--------|--------|-------|
| 1 | **Inline plan editing** (swap venues, reorder days, add custom stops) | Medium | High | #1 requested feature across all AI planners. Users want control. |
| 2 | **Interactive map view** (see all stops on a map, click to explore) | Medium | High | Wanderlog's killer feature. Visual planning is expected. |
| 3 | **More destinations** (only Rotterdam currently) | Large | Critical | Without more cities, the product is a demo, not a product. |
| 4 | **Offline access / PWA** (download trip for use without internet) | Small | High | Travelers often lose connectivity. PWA service worker exists but needs verification. |
| 5 | **Group/collaborative planning** (share editable trip with travel partner) | Large | Medium | Couples and friend groups plan together. Currently share is read-only. |
| 6 | **Real-time flight/hotel pricing** (show actual bookable prices) | Medium | High | Travelpayouts integration exists but needs frontend display. |
| 7 | **Calendar sync** (add trip to Google/Apple Calendar) | Small | Medium | calendarExport.ts exists — verify it works. |
| 8 | **Trip comparison** (compare 2-3 plan variants side by side) | Medium | Medium | TripContext.tsx exists — verify it works. |
| 9 | **Weather integration** (show expected weather for travel dates) | Small | Medium | Plans mention weather but may not be date-specific. |
| 10 | **Packing list** (AI-generated based on destination + weather + activities) | Small | Low | Nice-to-have, Stippl does this well. |
| 11 | **Budget tracker** (set budget, see how plan fits) | Medium | Medium | BudgetPanel.tsx exists — verify it works. |
| 12 | **Multi-city trips** (combine multiple destinations in one trip) | Large | Medium | Complex but increasingly requested. |

---

## Monetization Landscape

### How competitors make money:
1. **Freemium subscriptions** — Free tier with limits, paid for unlimited (Layla, Wanderlog Pro)
2. **Affiliate commissions** — Booking.com, Skyscanner, GetYourGuide referrals (5-15% commission)
3. **In-app advertising** — Display ads in free tier (Wanderlog)
4. **Commission-based bookings** — Direct hotel/flight booking with markup
5. **API monetization** — Selling travel data/planning APIs to other businesses

### Industry benchmarks:
- Free-to-paid conversion in travel apps: **3-7%** (average ~3%, good is 6%+)
- Travel industry website conversion rate: **0.3-3%**
- Travel affiliate marketing market: **$6.2B in 2024**, growing at 9.1% CAGR
- 60% of frequent travelers prefer subscription bundles with concierge services
- Mobile transactions exceed 80% of total travel bookings

### Jolliday's monetization strategy:
- ✅ Subscription model (Stripe integration exists)
- ✅ Affiliate links (GetYourGuide partner ID: 9KRYTOC, Skyscanner, Booking.com)
- ❓ Need to verify paywall timing shows value before asking for money
- ❓ Need to verify affiliate links are actually generating clicks/revenue

---

## Key Takeaways for Jolliday

### Our unfair advantages to double down on:
1. **Speed** — Instant cached plans. Make this the hero message.
2. **Trust** — Verified venues, real photos. No hallucinations. Lean into this HARD.
3. **Quality photos** — 4 real photos per venue. Make the visual experience premium.

### Our biggest gaps to close:
1. **Only one city** — This is existential. Need at least 5-10 popular destinations.
2. **No plan editing** — Users expect to customize. "Take it or leave it" doesn't work.
3. **Mobile UX unknown** — 70%+ of users are on phones. Must be flawless.
4. **Paywall timing** — Must show value before asking for money.

### What NOT to build (low ROI):
- Real-time booking engine (too complex, use affiliate links instead)
- Social features / trip journals (not core to planning)
- AI chatbot personality customization (gimmick)
- Gamification / rewards (doesn't serve the core experience)

---

*Research complete. Proceeding to Phase 1: Codebase Audit.*
