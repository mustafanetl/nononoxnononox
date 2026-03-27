

# Auth Review & Missing Pages

## Current State

**What works:**
- Login/signup with email+password ✅
- Google & Apple OAuth ✅
- Password reset flow (`/reset-password`) ✅
- Sign out (button in Chat sidebar) ✅
- Profile auto-creation via DB trigger ✅
- Subscription table exists but paywall is bypassed (`isPremium = true`) ✅

**What's missing:**
- **No Settings/Profile page** — users can't view or edit their display name, email, or avatar
- **No Subscription Management page** — users can't see their current plan or upgrade/downgrade (even though the subscription table and hook exist)
- **No `/settings` or `/account` route** in App.tsx
- Sign out only accessible from Chat sidebar — not from other pages

## Plan

### 1. Create `src/pages/Settings.tsx`
A single settings page with two sections:

**Profile section:**
- Display name (editable, saves to `profiles` table)
- Email (read-only, from auth user)
- Avatar URL (optional, editable)
- Save button

**Subscription section:**
- Show current plan (from `useSubscription` hook)
- Show status & expiry date
- Display the two plan cards (Monthly $12.99 / Annual $49.99) — disabled/informational since no payment API is connected yet
- "Manage Subscription" button placeholder (disabled with tooltip "Coming soon")

**Account actions:**
- Sign out button
- "Delete Account" placeholder (disabled, future feature)

### 2. Update `src/App.tsx`
- Add route: `/settings` → `<Settings />`

### 3. Add Settings link to navigation
- **Chat sidebar**: Add a Settings/gear icon next to the existing User/LogOut buttons
- **Landing page navbar**: Add Settings link when user is logged in (alongside "My Trips")

### 4. Update `src/pages/MyTrips.tsx`
- Add a link/button to Settings page in the header area

## Files to Create/Modify
1. **Create** `src/pages/Settings.tsx` — Profile editing + subscription display + sign out
2. **Modify** `src/App.tsx` — Add `/settings` route
3. **Modify** `src/pages/Chat.tsx` — Add Settings icon link in sidebar
4. **Modify** `src/pages/Index.tsx` — Add Settings link in navbar for logged-in users
5. **Modify** `src/pages/MyTrips.tsx` — Add Settings link in header

