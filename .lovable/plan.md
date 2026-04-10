

# Fix: Crafting Animation Should Only Play Once Per Plan

## Problem
When you reopen a chat or refresh the page, the 12-second "Crafting your perfect plan..." animation plays again for messages that were already fully loaded. It should only play once — during the initial streaming of a new plan.

## Root Cause
The `lastCraftedMsgIndex` ref starts at `-1` on every mount. When the component loads with existing messages containing plan blocks (`activities`, `itinerary`), the effect on line 250 detects them and triggers the full crafting animation again.

## Fix

### `src/pages/Chat.tsx` — Two changes

1. **Skip crafting for messages that are already complete on mount**: Add a ref that tracks whether the initial render has been processed. On first render, set `lastCraftedMsgIndex` to the current last message index so the effect doesn't trigger for pre-existing messages.

2. **Only trigger crafting while actively streaming**: Add `isLoading` as a condition for starting the crafting animation. If `isLoading` is false (page load, chat switch), the plan blocks are already complete and don't need the animation.

The key change in the effect (line 260):
```typescript
if (hasPlanBlocks && isLoading && lastIdx !== lastCraftedMsgIndex.current && !craftingIntervalRef.current) {
```

Adding `isLoading` ensures crafting only starts during active streaming — never on page load or chat switch with existing data.

### Files Modified
| File | Change |
|---|---|
| `src/pages/Chat.tsx` | Add `isLoading` guard to crafting trigger condition (~line 260) |

