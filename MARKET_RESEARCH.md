# Market Research — AI Trip Planner Landscape (May 2026)

## Executive Summary

The AI trip planner market is growing rapidly — 91% of global travelers now use AI tools for planning (Klook survey, CNBC 2026). However, trust remains the #1 barrier. Over half of AI-generated itineraries suggest venues outside operating hours, and ~25% recommend permanently closed venues (Travo research). The opportunity: a planner that **proves** its recommendations are real.

---

## Top 10 User Complaints (from Reddit, reviews, articles)

| # | Complaint | Does Jolliday Solve? | Fix if Not |
|---|-----------|---------------------|------------|
| 1 | **AI hallucinations** — venues don't exist, wrong locations | ✅ YES — Google Places verification pipeline | Show "✓ Verified" badge prominently |
| 2 | **No real photos** — generic stock or no images at all | ✅ YES — Photos from Google Places stored in Supabase | Ensure photos display beautifully with lazy-load |
| 3 | **Unrealistic travel times** — "20 min walk" is actually 45 min | ✅ YES — Walking times calculated | Show walking times prominently between stops |
| 4 | **Outdated info** — closed restaurants, wrong hours | ⚠️ PARTIAL — Verification catches non-existent venues | Add "last verified" date, periodic re-verification |
| 5 | **Generic suggestions** — same tourist traps as every blog | ⚠️ PARTIAL — Vibe-based generation helps | Surface WHY each venue matches their vibe |
| 6 | **Can't edit/customize** — take it or leave it | ❌ NO — No inline editing | Add swap venue, reorder, remove functionality |
| 7 | **Aggressive paywalls** — can't even see the plan | ⚠️ PARTIAL — Preview exists | Show full first plan free, paywall on 2nd+ |
| 8 | **Poor mobile experience** — desktop-first design | ⚠️ NEEDS WORK | Full mobile-first redesign |
| 9 | **No budget awareness** — no cost estimates | ❌ NO | Add estimated daily cost, price level filters |
| 10 | **Sharing requires signup** — can't send to travel partner | ✅ YES — SharedTrip page exists | Ensure it's beautiful and fast without auth |

---

## Competitor Analysis

### 1. Layla AI
- **#1 Strength:** Visual, day-by-day itineraries with short-video integration (TikTok-like discovery). Clean conversational interface.
- **Biggest Weakness:** Struggles with complex multi-city routes. Has produced hallucinations (e.g., "Eiffel Tower in Beijing" error). No venue verification.
- **Our Counter:** Verified venues with real photos > pretty UI with fake data.

### 2. Wanderlog
- **#1 Strength:** Visual itinerary building + group collaboration. Map-based planning with drag-and-drop. 4.9★ iOS (18K reviews).
- **Biggest Weakness:** Not AI-native — it's a manual planner with AI bolted on. No instant generation.
- **Our Counter:** Instant AI generation + verification. Speed + trust.

### 3. Stippl
- **#1 Strength:** All-in-one (itinerary + budget + packing + expenses + group sharing). AI generates full trip in 2 minutes.
- **Biggest Weakness:** Buggy, frustrating UX. Tries to do too much, executes none perfectly.
- **Our Counter:** Do fewer things perfectly. Itinerary + photos + map + export = flawless.

### 4. Mindtrip
- **#1 Strength:** Beautiful cinematic design. Conversational + visual hybrid. Now has flight booking. Instant filtering via WebAssembly.
- **Biggest Weakness:** Not great at personalized recommendations (Business Insider review). Organization tool more than inspiration.
- **Our Counter:** Adopt their design philosophy (cinematic, minimal) but with verified venues + instant cached plans.

### 5. Wonderplan
- **#1 Strength:** Free, fast itinerary generation. Drag-and-drop editing. PDF export for offline.
- **Biggest Weakness:** No venue verification. No photos. Basic output quality.
- **Our Counter:** Same speed (cached plans) but with verified venues, real photos, and premium design.

### 6. Google Travel
- **#1 Strength:** Integration with Google Maps, Flights, Hotels. Massive data advantage.
- **Biggest Weakness:** Not a dedicated planner. No day-by-day itineraries. LLMs struggle with logistical constraints (Google's own research admits this).
- **Our Counter:** Dedicated experience > general-purpose tool. We solve the specific problem better.

### 7. TripIt
- **#1 Strength:** Automatic booking organization from email forwarding. Flight tracking. Reliable.
- **Biggest Weakness:** Not a planner — it's an organizer. No AI generation, no inspiration.
- **Our Counter:** We plan; they organize. Different use cases, but we can add booking import later.

### 8. ChatGPT / Gemini
- **#1 Strength:** Most versatile. Can handle any query. Free. Huge knowledge base.
- **Biggest Weakness:** No photos, no maps, no verification, no export, no walking times, no booking links. Just text.
- **Our Counter:** This is our biggest opportunity. Everything ChatGPT can't do, we do: photos, maps, verification, PDF, calendar, booking links, beautiful UI.

---

## Features to Build (Priority-Ordered by Market Demand)

| Priority | Feature | Impact | Effort | Market Signal |
|----------|---------|--------|--------|---------------|
| P0 | Verified venue badges (prominent) | 🔥🔥🔥 | Low | #1 complaint is hallucinations |
| P0 | Real photos displayed beautifully | 🔥🔥🔥 | Low | Already have data, need better UI |
| P0 | Walking times between stops | 🔥🔥🔥 | Low | Already calculated, need prominent display |
| P1 | Instant speed as hero feature | 🔥🔥🔥 | Low | Cached plans already work |
| P1 | Full first plan free (soft paywall) | 🔥🔥 | Medium | Aggressive paywalls = #1 churn reason |
| P1 | Mobile-first redesign | 🔥🔥🔥 | High | 70%+ users on mobile |
| P2 | Inline plan editing (swap/reorder/remove) | 🔥🔥 | High | "Can't customize" is top-5 complaint |
| P2 | Budget estimates per day | 🔥🔥 | Medium | Users want cost awareness |
| P2 | Beautiful share links (no signup needed) | 🔥🔥 | Medium | Collaborative planning is huge |
| P3 | PDF export (offline access) | 🔥 | Low | Already exists, polish it |
| P3 | Calendar export | 🔥 | Low | Already exists, polish it |
| P3 | Map view with route lines | 🔥🔥 | Medium | Visual planning is trending |

---

## The "10x Better Than ChatGPT" Test

For each core feature, Jolliday must be **obviously, undeniably** better than asking ChatGPT:

| Feature | ChatGPT | Jolliday (Target) |
|---------|---------|-------------------|
| Venue accuracy | Hallucinations common | ✓ Every venue verified via Google Places |
| Photos | None | Real photos from Google Places, beautifully displayed |
| Walking times | Not calculated | Shown between every stop with route |
| Map view | None | Interactive map with numbered pins + route lines |
| Speed | 10-30s generation | Sub-second for cached plans |
| Export | Copy-paste text | PDF, calendar (.ics), share link |
| Booking | None | Skyscanner flights, Booking.com hotels |
| Mobile | Terrible chat UI | Purpose-built mobile-first experience |
| Editing | Re-prompt entire conversation | Inline swap/reorder/remove |
| Sharing | Screenshot or copy text | Beautiful public link with OG image |

---

## Key Insights for Jolliday's Strategy

1. **Trust is the moat.** Verification + real photos = the thing nobody else does well.
2. **Speed is the hook.** Instant cached plans feel magical. Make this the hero moment.
3. **Design is the differentiator.** Mindtrip proves that cinematic design wins attention. Apply to our verified data.
4. **Mobile-first is non-negotiable.** 70%+ of travel planning happens on phones.
5. **Soft paywall converts better.** Show full value first, then ask for money.
6. **ChatGPT is the real competitor.** Every feature must pass the "why not just ask ChatGPT?" test.
7. **Sharing drives growth.** Beautiful share links = free marketing.

---

## Sources

Research compiled from: CNBC (2026), Forbes (2026), Travo.me, InsureMyTrip, Seattle Times, NDTV, WindowsForum, Dupple.com, FelloAI, Stippl.io, Wandrly.app, iMean.ai, Business Insider, various Reddit threads and review sites. Content was rephrased for compliance with licensing restrictions.
