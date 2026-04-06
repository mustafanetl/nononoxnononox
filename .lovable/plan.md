

# Fix: Crafting Animation Timing + Local Queries + Currency Localization

## 3 Problems

### 1. Crafting animation jumps to end
**Root cause**: `planBlocksDetected` on line 230 requires `isLoading === true`. When the AI streams fast, React can batch the final state update where `isLoading` becomes false and content updates simultaneously — so `planBlocksDetected` is never true long enough to trigger the effect, or it fires and `isLoading` immediately goes false causing `streamingDone` to be set in the same render cycle.

**Fix**: Remove the `isLoading` dependency from `planBlocksDetected`. Instead, detect plan blocks in any assistant message that hasn't been processed yet, using a ref to track the last processed message index. This way even if streaming ends instantly, the crafting animation still runs its full 12 seconds.

### 2. Local queries show "Searching flights and routes..."
When user asks about local things to do, there are no flights or hotels — but the crafting animation still shows those steps.

**Fix**: Detect which block types are present in the streamed content and show relevant status messages only. For local queries (activities + itinerary only): "Finding the best spots...", "Curating must-see experiences...", "Building your day-by-day plan...", "Adding insider tips...". For full trips (with flights/hotels): keep current messages.

### 3. Pricing changes
- Remove "billed $49.99/yr" subtext everywhere
- Change monthly from $12.99 to $9.99
- Auto-detect currency using `navigator.language` / `Intl` API — show EUR for European locales, GBP for UK, USD for everyone else

## Changes

### `src/pages/Chat.tsx`
- **Fix `planBlocksDetected`**: Remove `!isLoading` gate. Use a ref (`lastCraftedMsgIndex`) to track which message already triggered crafting, so it only fires once per plan message
- **Detect plan type**: Check if streamed content has `flights`/`hotels` blocks. Pass a `planType` to `craftingPlan` state (`"local"` vs `"full"`)
- **Adapt status messages**: Show local-appropriate messages when no flights/hotels detected

### `src/components/PlanPreviewGate.tsx`
- Remove "billed $49.99/yr" subtext from annual option
- Change monthly price from $12.99 to $9.99
- Add currency detection helper: detect locale, map to currency symbol + prices
- Conditionally hide flights/hotels stats in hero when they're 0

### `src/components/PaywallModal.tsx`
- Remove "billed $49.99/yr" from annual plan
- Change monthly to $9.99
- Add same currency detection logic

### `src/components/PricingSection.tsx`
- Remove yearly total from description
- Change monthly to $9.99
- Add currency detection

### New: `src/utils/currencyLocale.ts` (shared helper)
```
- Detect user locale via navigator.language
- Map to currency: EUR for de/fr/es/it/nl/pt/etc, GBP for en-GB, USD default
- Export function: getCurrencyPrices() => { symbol, monthly, annualMonthly }
  - USD: $9.99 / $4.17
  - EUR: €9.99 / €4.17
  - GBP: £8.99 / £3.49
```

## Files

| File | Change |
|------|--------|
| `src/utils/currencyLocale.ts` | New — locale detection + price mapping |
| `src/pages/Chat.tsx` | Fix planBlocksDetected timing, adapt crafting messages for local vs full trips |
| `src/components/PlanPreviewGate.tsx` | Remove yearly total, $9.99 monthly, localized currency, hide empty flight/hotel stats |
| `src/components/PaywallModal.tsx` | Remove yearly total, $9.99 monthly, localized currency |
| `src/components/PricingSection.tsx` | Remove yearly total, $9.99 monthly, localized currency |

