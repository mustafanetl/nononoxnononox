

# Fix: Crafting Animation Duration + Annual Price Display

## Problem 1: Animation jumps to end instantly

The crafting animation is tied to `isLoading`. When the AI finishes streaming (3-5 seconds), `isLoading` → false → `isCraftingPlan` → false → progress immediately jumps to 100% and disappears. The 12-second timer never gets a chance to run.

**Fix**: Decouple the animation from streaming. When plan blocks are first detected, start a **minimum 12-second animation** that runs independently. Only reveal the plan after BOTH conditions are met: (1) streaming is finished AND (2) the 12-second animation has completed.

### Changes in `src/pages/Chat.tsx`

- Add a `craftingActive` ref that stays true for a minimum duration
- When `isCraftingPlan` first becomes true, set `craftingActive = true` and start a 12-second timer
- The crafting UI shows as long as `craftingActive` is true (not tied to `isLoading`)
- When streaming ends AND 12 seconds have passed, set progress to 100%, wait 500ms, then reveal
- Progress increments: `Math.random() * 2 + 1` every 800ms (slower, steadier climb to ~90% over 12s)
- Each status message stays visible for ~2 seconds as progress moves through stages

## Problem 2: Annual plan shows $49.99/yr — feels expensive

Show the monthly equivalent instead: **$4.17/mo** as the headline price, with "billed annually" as subtext.

### Changes in 3 files

**`src/components/PlanPreviewGate.tsx`**:
- Annual button: change `$49.99/yr` → `$4.17/mo` with subtext "billed $49.99/yr"

**`src/components/PricingSection.tsx`**:
- Annual card: change price from `$49.99 /year` → `$4.17 /month` with description "Billed $49.99/year"

**`src/components/PaywallModal.tsx`**:
- Annual option: change price display to `$4.17/mo` with "billed annually" note

## Files

| File | Change |
|------|--------|
| `src/pages/Chat.tsx` | Decouple crafting animation from `isLoading`, enforce minimum 12-second duration |
| `src/components/PlanPreviewGate.tsx` | Show annual as $4.17/mo |
| `src/components/PricingSection.tsx` | Show annual as $4.17/mo |
| `src/components/PaywallModal.tsx` | Show annual as $4.17/mo |

