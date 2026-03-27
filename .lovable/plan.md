

# Update Pricing Plans

## Changes

### Prices & Plans
- **Monthly**: $29.99 → **$12.99/month**
- **Annual**: $44.99 → **$49.99/year** (highlighted as "Best Value")
- **Lifetime**: Remove entirely

### Trial copy
- Remove "no credit card required" everywhere
- Keep "3-day free trial" mentions but update to just "Start with a 3-day free trial"

### Subscription type
- Remove `"lifetime"` from `SubscriptionPlan` type → `"free" | "monthly" | "annual"`

## Files to Modify

1. **`src/components/PricingSection.tsx`** — Remove Lifetime plan, update Monthly to $12.99, Annual to $49.99, update savings text ("Save over 67%"), change grid to `sm:grid-cols-2 max-w-2xl`, remove "no credit card required" from subtitle
2. **`src/components/PaywallModal.tsx`** — Remove Lifetime plan row, update Monthly to $12.99/mo, Annual to $49.99/yr, remove "Limited" badge, update trial text
3. **`src/components/HeroSection.tsx`** — Change "No credit card required · Free for 3 days" to "Start with a 3-day free trial"
4. **`src/pages/Index.tsx`** — Change CTA subtext from "Free for 3 days · No credit card required" to "Start with a 3-day free trial"
5. **`src/hooks/useSubscription.ts`** — Remove `"lifetime"` from `SubscriptionPlan` type

