

# Fix: Bulletproof 0→100% Crafting Animation

## Root Cause

The progress animation effect (line 309) uses a local `progress` variable starting at 0, but `craftingActive` can flicker due to React state batching — when streaming ends fast, the cleanup effect at line 288 may fire in the same render cycle as the detection effect at line 249, causing `craftingActive` to go true→false almost instantly. The 12s `setTimeout` at line 274 also runs inside the detection effect, but if the component re-renders and the effect re-fires, the timer reference is lost.

## Fix Strategy

Replace the current fragile multi-effect approach with a single, self-contained animation controller:

### `src/pages/Chat.tsx`

**1. Replace the 3 separate effects (lines 249-318) with one unified crafting controller:**

- When plan blocks are first detected in a new assistant message:
  - Set `craftingActive = true`
  - Start a single `setInterval` that increments progress using a deterministic curve (not random): `progress = Math.min(90, progress + (90 - progress) * 0.04)` every 300ms — this gives a smooth ease-out from 0→90 over ~12s
  - Store the interval ID in a ref so it's never lost

- When streaming ends (`isLoading` goes false while crafting is active):
  - Set a `streamingDone` ref to true
  - Do NOT stop crafting yet — wait for progress to reach 90+

- A separate check inside the same interval: when `streamingDone` is true AND progress >= 88:
  - Quickly ramp to 100 (set progress = 100)
  - After 600ms delay, set `craftingActive = false` and clean up

- If 12 seconds pass and streaming hasn't ended yet, cap at 90 and hold there until streaming completes

**2. Ensure `craftingPlanType` updates on final content:**
- When `streamingDone` fires, re-check for flights/hotels blocks in the final message content to set the correct plan type

**Key invariants:**
- Progress ALWAYS goes 0 → ~90 over 12 seconds minimum (no jumping)
- Progress only hits 100 after both: timer ≥ 12s AND streaming done
- Single interval, single timer, stored in refs — no races

## Files

| File | Change |
|------|--------|
| `src/pages/Chat.tsx` | Replace 3 crafting effects with 1 unified controller using refs for interval/timer |

