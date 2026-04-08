

# Fix: Plan Content and Free Trial CTA Showing Before 100% Crafting Completes

## Problem

Two things appear prematurely for free users while the crafting animation (0-100%) is still running:

1. **Plan cards (PlanPreviewGate)** can flash before the animation reaches 100% — the `isCraftingPlan` guard on line 759 hides cards for the *last* message, but `planGenerated` gets set to `true` as soon as streaming ends (line 367-380), which can happen before the animation finishes. This causes the bottom CTA to appear early too.

2. **"3 days free trial" CTA banner** (line 951) replaces the chat input as soon as `planGenerated` is `true`, which happens when streaming ends — not when the crafting animation completes.

## Root Cause

`planGenerated` is set based on `!isLoading` (streaming done), but the crafting animation runs independently for up to 12 seconds after streaming ends. The two states are not synchronized.

## Fix

### 1. Gate `planGenerated` behind crafting completion (`src/pages/Chat.tsx`)

Change the `planGenerated` detection effect (lines 367-380) to also require `!isCraftingPlan`:

```typescript
if (isPremium || isLoading || isCraftingPlan) return;
```

This ensures `planGenerated` only becomes `true` after both streaming AND the crafting animation are fully done.

### 2. Ensure the plan cards remain hidden during crafting

The existing guard on line 759 (`!(isLastAssistant && isCraftingPlan)`) already handles hiding the last message's cards. Combined with the fix above, `planGenerated` won't flip early, so the inline lock cards and the bottom CTA banner will also stay hidden until 100%.

### Files Modified
| File | Change |
|---|---|
| `src/pages/Chat.tsx` | Add `isCraftingPlan` check to the `planGenerated` effect (line 368) |

