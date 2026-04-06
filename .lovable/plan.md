

# Overhaul: Layla-Style AI + Plan Presentation + Paywall Flow

## What the user wants (from the reference image)

The reference shows **Layla** — a travel AI with a split-screen layout where:
- **Left panel**: Chat conversation (personal, concise AI messages with real suggestions)
- **Right panel**: A beautiful destination card with city name, stats (days, cities, experiences, hotels, transports), a timeline, and below that a **paywall** ("Your trip, complete." + features + 3-day free trial + pricing)
- The plan preview shows real content at the top but blurs/gates below
- On mobile: users tap to see the plan, top is visible, scrolling down hits paywall

## Changes Required

### 1. AI Prompt Rewrite (`rzuma-chat/index.ts`)

Complete rewrite of the system prompt to be more personal and create FOMO:
- **Discovery**: Show ONE specific place per message with `place_images`, ask what they think, react genuinely. Minimum 3-4 exchanges.
- **Anticipation**: After gathering enough info, say "okay let me cook 🧑‍🍳" — then generate the plan. Include a brief teaser text like "I found some amazing spots you're gonna love" before the plan blocks.
- **Post-plan message for free users**: After the plan blocks, add a message like "your plan is ready! 🎉 I put together [X] activities, [Y] hotels and a full itinerary — start your free trial to see everything" with a quickreply like `["Start free trial", "Tell me more about the plan"]`.
- **Urgency/FOMO language**: "honestly this itinerary is fire", "you don't wanna miss [specific venue]", "trust me on this one"

### 2. Plan Preview Gate Redesign (`PlanPreviewGate.tsx`)

Redesign to match the Layla reference — a proper plan preview card:
- **Hero section**: Large city image (Google Places), destination name, stats row (days, activities, hotels, flights)
- **Blurred preview section**: Show 2-3 activity names as a teaser list, then a gradient blur overlay
- **Paywall CTA below the blur**: "Your trip, complete." heading + feature checklist (Full itinerary, Exclusive hotel deals, Expert support, Unlimited planning) + 3-day free trial toggle + Annual/Monthly pricing + "Get started" button
- All in ONE card component — no separate modal needed (but keep PaywallModal for other triggers)

### 3. Plan Crafting Animation Enhancement (`Chat.tsx`)

When the AI is generating the plan:
- Show a multi-step progress: "Searching flights..." → "Finding hotels..." → "Building itinerary..." → "Almost done..."
- Each step shows for ~1.5s with a progress bar
- Uses the destination name: "Crafting your Bali plan..."

### 4. Chat Input Gate After Plan (`Chat.tsx`)

Already implemented but needs polish:
- Instead of generic "Upgrade to continue", show: "I've got your [destination] plan ready — start your 3-day free trial to unlock it and keep chatting ✨"
- Quick reply buttons: `["Start 3-day free trial"]` instead of "Upgrade Now"

### 5. Mobile Experience

- On mobile, the `PlanPreviewGate` is the full card inline in chat
- Tapping "View Full Plan" shows the paywall inline (not a modal)
- Scrolling the blurred section triggers the paywall

## Files

| File | Change |
|------|--------|
| `supabase/functions/rzuma-chat/index.ts` | Rewrite prompt for more personal feel, FOMO language, post-plan teaser for free users |
| `src/components/PlanPreviewGate.tsx` | Full redesign — Layla-style with hero + stats + blurred preview + inline paywall |
| `src/pages/Chat.tsx` | Enhanced crafting animation with multi-step progress, better post-plan gate copy |
| `src/components/PaywallModal.tsx` | Add 3-day free trial as default selected option, match reference styling |

## Key Differences from Current

| Current | New |
|---------|-----|
| Small card with "View Full Plan" button | Large inline preview with blur + built-in paywall |
| Generic paywall modal | Contextual paywall with trip stats and feature checklist |
| "Upgrade Now" copy | "Start 3-day free trial" copy everywhere |
| Simple loading spinner | Multi-step crafting animation with destination name |
| AI sometimes rushes to plan | AI always does 3+ discovery exchanges with place images |
| Post-plan input says "Upgrade" | Post-plan input references destination + trial CTA |

