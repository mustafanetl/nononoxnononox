

# Fix: Hide All Content During Crafting Animation

## Problem
When streaming begins, individual cards (flights, hotels, activities, travel info, weather, etc.) render progressively in real-time. The crafting animation only starts once plan blocks are detected in the stream, but by then some content has already flashed on screen. The user sees raw data briefly before the crafting overlay appears.

## Root Cause
The `isCraftingPlan` guard only hides:
- The text content (line 750)
- The full-plan summary card (line 759)

But the **else branch** (lines 797-847) renders individual inline cards (timeline, flights, hotels, activities, itinerary, travel info, weather) without any crafting guard. These render during streaming before the crafting animation triggers.

## Fix

### `src/pages/Chat.tsx` — One change

Wrap the entire else branch (lines 784-849) with an additional `isCraftingPlan` check for the last assistant message. Specifically, add `!(isLastAssistant && isCraftingPlan)` to the condition on line 784 so the individual cards are also hidden while crafting is active:

```tsx
) : !(isLastAssistant && isCraftingPlan) && (
```

This ensures that when the crafting animation is running, the last assistant message shows **nothing** — no text, no cards, no travel info — until the animation completes at 100%.

### Files Modified
| File | Change |
|---|---|
| `src/pages/Chat.tsx` | Add crafting guard to the inline cards branch (~line 784) |

