

# Full SaaS Flow: Login Required + Paywall on View Plan

## Current State
- Chat is accessible without login
- TripSummaryCard navigates directly to `/trip/view` with no gate
- `useSubscription` has `isPremium = true` hardcoded (dev override)
- PaywallModal exists but isn't used in the plan flow

## Plan

### Step 1: Require login to access Chat
**File: `src/pages/Chat.tsx`**
- Add auth check at top of component using `useAuth`
- If no user and not loading, redirect to `/auth` (or show a prompt to sign in)
- Already imports `useAuth` — just add the redirect logic

### Step 2: Paywall gate on "View Full Plan" click
**File: `src/components/TripSummaryCard.tsx`**
- Import `useSubscription` and `PaywallModal`
- On click: if `isPremium` is true, navigate to `/trip/view` as before
- If not premium, show the PaywallModal instead of navigating
- Add local state `showPaywall` to control the modal

### Step 3: Re-enable subscription check
**File: `src/hooks/useSubscription.ts`**
- Change `const isPremium = true` back to `const isPremium = plan !== "free"`
- This activates the paywall for all free users

### Step 4: Update PaywallModal CTA buttons
**File: `src/components/PaywallModal.tsx`**
- Currently links to `/auth` — keep that for unauthenticated users
- For authenticated users, the buttons should eventually link to a checkout flow (Stripe)
- For now, update copy to say "Start Free Trial" and keep linking to auth/settings

## Files to Modify
- `src/pages/Chat.tsx` — redirect unauthenticated users to `/auth`
- `src/components/TripSummaryCard.tsx` — paywall gate before navigation
- `src/hooks/useSubscription.ts` — re-enable real subscription check
- `src/components/PaywallModal.tsx` — minor copy update

