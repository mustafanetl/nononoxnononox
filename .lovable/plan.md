

# Stripe Payments Integration — Full Subscription Flow

## Overview

Connect Stripe to handle real payments: subscribe, upgrade, cancel with retention discount ($2/mo first month), and sync subscription status.

## Architecture

```text
User clicks "Start Trial" → Edge Function creates Stripe Checkout → User pays
Stripe webhook → Edge Function updates `subscriptions` table → App reads status
User cancels → Cancellation modal (why?) → Offer $2/mo discount → If declined, cancel via Edge Function
```

## Step-by-step

### 1. Enable Stripe
Use the `stripe--enable_stripe` tool to set up Stripe and collect the secret key.

### 2. Create Stripe Products & Prices
Via edge function or Stripe tool:
- **Monthly**: $9.99/mo with 3-day free trial
- **Annual**: $49.99/yr (~$4.17/mo) with 3-day free trial
- **Discount Monthly**: $2.00 first month, then $9.99/mo (retention coupon)

### 3. Edge Function: `create-checkout`
- Accepts `plan` (monthly/annual) and `user_id`
- Creates or retrieves Stripe customer (store `stripe_customer_id` in subscriptions table)
- Creates Checkout Session with trial_period_days=3, success/cancel URLs
- Returns checkout URL

### 4. Edge Function: `stripe-webhook`
- Listens for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- On checkout complete: upsert `subscriptions` table with plan, status=active, stripe_subscription_id
- On subscription canceled/deleted: update status to canceled
- On subscription updated: sync plan/status

### 5. Edge Function: `cancel-subscription`
- Accepts `user_id` and optional `discount` flag
- If `discount=true`: apply $2/mo coupon to current subscription instead of canceling
- If no discount: cancel subscription at period end via Stripe API

### 6. Database Migration
Add columns to `subscriptions` table:
- `stripe_customer_id` (text, nullable)
- `stripe_subscription_id` (text, nullable)
- `cancel_reason` (text, nullable)
- Add UPDATE RLS policy for authenticated users on own row

### 7. Frontend Changes

**`src/components/PaywallModal.tsx`** & **`src/components/PlanPreviewGate.tsx`**:
- CTA button calls `create-checkout` edge function with selected plan
- Redirects to Stripe Checkout URL

**`src/hooks/useSubscription.ts`**:
- Also return `stripe_subscription_id` for cancel flow

**`src/pages/Settings.tsx`**:
- Add "Manage Subscription" button for premium users
- "Cancel Subscription" opens a cancellation modal

**New: `src/components/CancelSubscriptionModal.tsx`**:
- Step 1: Ask why they're canceling (too expensive, not using it, found alternative, other)
- Step 2: Offer retention deal — "$2 for your next month, then $9.99/mo"
- Accept discount → calls `cancel-subscription` with discount=true
- Decline → calls `cancel-subscription` to cancel at period end
- Stores cancel_reason in DB

**`src/components/PricingSection.tsx`**:
- CTA buttons call checkout flow instead of just linking to /auth

## Files

| File | Change |
|------|--------|
| `supabase/functions/create-checkout/index.ts` | New — creates Stripe Checkout session |
| `supabase/functions/stripe-webhook/index.ts` | New — handles Stripe webhook events |
| `supabase/functions/cancel-subscription/index.ts` | New — cancel or apply retention discount |
| `src/components/CancelSubscriptionModal.tsx` | New — cancellation flow with retention offer |
| `src/components/PaywallModal.tsx` | Wire CTA to Stripe checkout |
| `src/components/PlanPreviewGate.tsx` | Wire CTA to Stripe checkout |
| `src/components/PricingSection.tsx` | Wire CTAs to Stripe checkout |
| `src/pages/Settings.tsx` | Add manage/cancel subscription UI |
| `src/hooks/useSubscription.ts` | Return stripe_subscription_id |
| Migration | Add stripe columns to subscriptions table |

