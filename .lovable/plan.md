

# Fix: Fake Plan for Free Users + Slower Crafting Animation + Paywall Enforcement

## Problems

1. **Full plan shown without paywall** — The AI generates real plan blocks (activities, itinerary, etc.) and they render directly. The `isFullPlan` detection or `PlanPreviewGate` isn't catching everything, so free users see the whole plan.
2. **Crafting animation too fast** — Progress jumps from 0→90% in ~3 seconds. Needs to feel like real work (8-12 seconds).
3. **AI uses real API to generate plan for free users** — Wasteful. For free users, the AI should generate a **fake/template plan** with placeholder data. Only after they subscribe should the real API be called to generate their actual personalized plan.

## Solution

### 1. AI generates a lightweight "preview plan" for free users (`rzuma-chat/index.ts`)

Add to the system prompt: when generating the plan, include a `preview_mode` flag. The AI still generates plan blocks but with **fewer details** — just enough to populate the `PlanPreviewGate` card (destination name, activity count, hotel count, day count, 2-3 activity names). This saves API tokens and gives us data for the paywall card without revealing the full plan.

Alternatively (simpler): Keep the AI generating normally but **the frontend already hides everything behind PlanPreviewGate**. The real fix is making sure PlanPreviewGate actually gates properly.

### 2. Fix plan gating logic (`src/pages/Chat.tsx`)

The issue: when `isFullPlan` is true and user is NOT premium, it renders `PlanPreviewGate` — but the component might not be blocking all content. Looking at the code at line 680-704, the logic looks correct. The problem might be that **inline cards still render for non-full-plan messages** (e.g., if the AI sends activities in one message and itinerary in another).

**Fix**: After `planGenerated` is true for free users, ALL subsequent assistant messages should also be gated — not just the one with the full plan. Any message with card blocks should show the paywall instead.

### 3. Slow down crafting animation (`src/pages/Chat.tsx`)

Current: `progress += Math.random() * 15 + 5` every 600ms → reaches 90% in ~3-4 seconds.
New: `progress += Math.random() * 4 + 2` every 800ms → reaches 90% in ~12-15 seconds. Add more descriptive steps.

### 4. Gate ALL cards after plan is generated

Once `planGenerated` is true for free users, every assistant message with any card blocks should be hidden/gated. Not just the "full plan" message.

## Files

| File | Change |
|------|--------|
| `src/pages/Chat.tsx` | (1) Slow down crafting animation interval + smaller increments. (2) After `planGenerated`, gate ALL assistant messages that have any card blocks — show paywall CTA instead of rendering cards. (3) Ensure the streaming message is fully hidden during crafting. |
| `supabase/functions/rzuma-chat/index.ts` | No change needed — the AI prompt is fine. The gating is a frontend problem. |

## Technical Details

### Crafting animation (Chat.tsx ~line 246)
```
// Current (too fast)
progress += Math.random() * 15 + 5;  // every 600ms

// New (feels real — 10-15 seconds)  
progress += Math.random() * 3 + 1.5; // every 1000ms
```

Add more status messages:
- 0-15%: "Searching flights and routes..."
- 15-30%: "Scouting the best hotels..."
- 30-50%: "Curating must-see experiences..."
- 50-70%: "Building your day-by-day itinerary..."
- 70-85%: "Adding insider recommendations..."
- 85-100%: "Polishing final details ✨"

### Card gating after plan (Chat.tsx ~line 706)
When `planGenerated && !isPremium`, don't render ANY cards (flights, hotels, activities, itinerary, etc.) — only render the text. If a message has card blocks, show a mini "Unlock your plan" CTA instead.

