

# Fix: Currency Display and Checkout Navigation

## Problems Identified

1. **Prices showing in £ (pounds)**: The `getCurrencyPrices()` function in `src/utils/currencyLocale.ts` detects your browser locale as `en-gb` and shows GBP prices (£8.99/£3.49). However, the actual Stripe prices are in USD. This is misleading.

2. **Checkout button does nothing**: The `startCheckout()` function uses `window.open(url, "_blank")` inside an async callback. Modern browsers block popups that aren't triggered by a direct user click. Since there's an `await` (network call) between the click and `window.open`, the browser silently blocks it.

## Changes

### 1. Fix checkout navigation (`src/lib/stripeCheckout.ts`)
- Change `window.open(data.url, "_blank")` to `window.location.href = data.url` so it navigates in the same tab instead of trying to open a popup (which gets blocked).

### 2. Fix currency display (`src/utils/currencyLocale.ts`)
- Since the Stripe products are priced in USD only, remove the locale-based currency detection and always show USD prices. This prevents showing £8.99 when Stripe will actually charge $9.99.
- Alternatively, if multi-currency is desired later, this can be revisited with Stripe multi-currency pricing.

### Files Modified
| File | Change |
|---|---|
| `src/lib/stripeCheckout.ts` | `window.location.href` instead of `window.open` |
| `src/utils/currencyLocale.ts` | Always return USD prices |

