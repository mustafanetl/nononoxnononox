# Codebase Audit Results — Jolliday AI Trip Planner

*Audit completed: May 2026*
*Files reviewed: 30+ source files, edge functions, landing components, utilities*

---

## 🔴 Critical Issues (Broken, Crashes, Security)

### 1. Admin Route Not Properly Gated
**File:** `src/App.tsx` line ~73
The `/admin` route uses `<ProtectedRoute>` (auth-only), but admin role check happens inside the component. Any authenticated user can load the admin page component and trigger data fetches before being redirected.
**Fix:** Create `<AdminRoute>` wrapper or add role check at router level.

### 2. No AbortController for Streaming Requests
**File:** `src/hooks/useRzumaChat.ts`
If a user navigates away or starts a new chat while a stream is in progress, the fetch continues in the background. This causes:
- State updates on unmounted components (React warnings)
- Race conditions where old stream data overwrites new chat
- Wasted bandwidth and tokens
**Fix:** Add AbortController, cancel on unmount or new message.

### 3. Stale Closure in `sendMessage`
**File:** `src/hooks/useRzumaChat.ts` ~line 170
`sendMessage` captures `activeId` at call time. If user switches conversations mid-stream, the stream writes to the wrong conversation.
**Fix:** Use a ref for `activeId` that's always current.

### 4. Shared Trip XSS Risk
**File:** `src/pages/SharedTrip.tsx`
`data_json` from Supabase is cast to `any` and rendered. If malicious data is inserted into `shared_trips.data_json`, URL-based injections (e.g., `javascript:` in booking links) could execute.
**Fix:** Sanitize all URLs from shared trip data, validate against allowlist of domains.

### 5. Client-Side Paywall is Trivially Bypassable
**File:** `src/hooks/useSubscription.ts` + `src/pages/Chat.tsx`
The paywall gate (`planGenerated && !isPremium`) is purely client-side. Users can modify localStorage, intercept responses, or use browser devtools to bypass.
**Fix:** Server-side enforcement in `rzuma-chat` edge function (already partially there with rate limiting, but plan count limit needs server enforcement).

### 6. ICS Calendar Export Not RFC 5545 Compliant
**File:** `src/utils/calendarExport.ts`
Activity names containing commas, semicolons, or newlines are not escaped per RFC 5545. This produces malformed `.ics` files.
**Fix:** Properly escape special characters in ICS output.

---

## 🟡 Important Issues (Bad UX, Confusing, Half-Built)

### 7. Chat.tsx is a 1800+ Line God Component
**File:** `src/pages/Chat.tsx`
Handles: message parsing, enrichment, crafting animations, paywall logic, sidebar, voice input, modals, PDF export, sharing, URL params, and rendering. Extremely difficult to maintain.
**Fix:** Extract into smaller components: ChatSidebar, ChatMessages, EnrichmentManager, CraftingAnimation.

### 8. TripContext Basket Feature Appears Unused
**File:** `src/contexts/TripContext.tsx`
The `addItem`/`removeItem`/`isInTrip` basket functionality is defined but never meaningfully used in the UI. Dead code from an earlier design.
**Fix:** Remove or implement fully.

### 9. Duplicated Paywall UI
**Files:** `src/components/PlanPreviewGate.tsx`, `src/components/PaywallModal.tsx`
Both implement nearly identical pricing UI, plan selection, and checkout logic. Pricing changes need updating in two places.
**Fix:** Extract shared `PricingSelector` component.

### 10. useAuth Race Condition on Initial Load
**File:** `src/hooks/useAuth.ts`
Both `onAuthStateChange` and `getSession()` call `setLoading(false)`. Can cause brief auth state flicker on page load.
**Fix:** Use `getSession` as authoritative initial state, let listener handle subsequent changes.

### 11. Welcome Email Heuristic is Fragile
**File:** `src/hooks/useAuth.ts` line ~20
`isNewUser` determined by `created_at > Date.now() - 60000`. Fails with clock skew, slow networks, or page refresh within 60s.
**Fix:** Use a flag in user metadata or check if welcome email was already sent.

### 12. No Error Reporting in Production
**File:** `src/components/ErrorBoundary.tsx`
In production, errors are silently swallowed. No Sentry, LogRocket, or any error reporting. Crashes are invisible.
**Fix:** Add lightweight error reporting (Sentry free tier or custom endpoint).

### 13. Landing Page Breaks in Dark Mode
**File:** `src/pages/Index.tsx` + `src/components/HeroSection.tsx`
Hardcoded `bg-white`, `bg-white/90`, `bg-white/70` throughout. These don't respect `next-themes` dark mode.
**Fix:** Replace with `bg-background`, `bg-card`, or theme-aware classes.

### 14. Hardcoded Social Proof Numbers
**File:** `src/components/HeroSection.tsx` line ~50
"2,847 trips planned this week" is static. Misleading if actual number differs.
**Fix:** Either fetch from backend or use a more honest static claim.

### 15. Fake Reviews in SocialProof
**File:** `src/components/landing/SocialProof.tsx`
"4.9/5 from 2,400+ reviews" with fabricated testimonials (Sofia M., James T., Priya K.). This is deceptive and could damage trust.
**Fix:** Remove fake review count, keep testimonial format but mark as "early user feedback" or replace with real data.

### 16. `/my-trips` Route Points to Chat Instead of MyTrips Page
**File:** `src/App.tsx` line ~60
`/my-trips` renders `<Chat />` but a dedicated `src/pages/MyTrips.tsx` exists. Routing mistake or incomplete migration.
**Fix:** Route `/my-trips` to the actual MyTrips component.

### 17. useTripEnrichment Uses Anon Key for Auth Endpoints
**File:** `src/hooks/useTripEnrichment.ts`
Enrichment calls use `VITE_SUPABASE_PUBLISHABLE_KEY` instead of `getAuthHeader()`. Rate limiting and premium checks won't work.
**Fix:** Use `getAuthHeader()` like `useRzumaChat.ts` does.

### 18. Settings Page Has No Form Validation
**File:** `src/pages/Settings.tsx`
Display name, home city, etc. have no length limits or sanitization. Users could enter extremely long strings.
**Fix:** Add max-length validation, trim whitespace.

### 19. PDF Export Doesn't Support Unicode
**File:** `src/utils/pdfExport.ts`
jsPDF with default Helvetica font doesn't support non-Latin scripts (Arabic, Japanese, etc.) or emojis. Given 18+ language support, this is broken for most of the world.
**Fix:** Use a Unicode-capable font or switch to html2pdf approach.

### 20. planParser Has No Size Limit
**File:** `src/utils/planParser.ts`
`parsePartialJson` will attempt to parse arbitrarily large strings. A malformed AI response with a massive JSON block could freeze the browser.
**Fix:** Add size guard (reject blocks > 500KB).

### 21. Multiple Promo Pages with Unclear Purpose
**Files:** `src/pages/Promo.tsx`, `src/pages/PromoMalmo.tsx`, `src/pages/Promox.tsx`, `src/pages/Promoar.tsx`
Four promo pages with unclear differentiation. Likely campaign-specific but adds maintenance burden.
**Fix:** Audit if still needed, consolidate or remove unused ones.

---

## 🟢 Nice-to-Fix (Polish, Optimization, Cleanup)

### 22. Deprecated Functions Still Exported
**File:** `src/utils/bookingLinks.ts`
`getSkyscannerUrl` and `getBookingDotComUrl` marked `@deprecated` but still used.
**Fix:** Complete the migration to new functions.

### 23. tripI18n.ts is 893 Lines of Repetitive Dictionaries
**File:** `src/utils/tripI18n.ts`
Each language is a full copy-paste. Maintainable for now but will become unwieldy.
**Fix:** Consider JSON-based approach or i18next (low priority).

### 24. Auto-Published Shared Trips Grow Unbounded
**File:** `src/components/TripSummaryCard.tsx` line ~95
Every completed plan auto-publishes to `shared_trips` for SEO. No cleanup mechanism.
**Fix:** Add TTL or cleanup job for old shared trips.

### 25. Hardcoded `$` in Cost Display
**File:** `src/components/ItineraryCard.tsx`
`~${dayTotal}/pp` uses `$` regardless of actual currency.
**Fix:** Use currency from plan data.

### 26. Module-Level Unbounded Cache
**File:** `src/pages/Chat.tsx` line ~50
`enrichmentCache` is a module-level object that never clears. Grows unbounded during session.
**Fix:** Use bounded LRU cache or React Query.

### 27. MobileStickyCTA Recalculates on Every Scroll
**File:** `src/components/landing/MobileStickyCTA.tsx`
`document.querySelector("footer")` runs on every scroll event.
**Fix:** Cache the footer reference.

### 28. localStorage Quota Not Handled
**File:** `src/hooks/useRzumaChat.ts`
Long conversations with embedded JSON can exceed 5MB localStorage limit. Silently fails.
**Fix:** Implement conversation pruning or IndexedDB fallback.

### 29. Missing aria-label on Hero Textarea
**File:** `src/components/HeroSection.tsx`
Main textarea has placeholder but no `aria-label` or associated `<label>`. Screen readers won't announce its purpose.
**Fix:** Add `aria-label="Describe your trip"`.

### 30. ItineraryCard Button Semantics
**File:** `src/components/ItineraryCard.tsx`
When `onSlotClick` is undefined, button is `disabled` but still renders as `<button>`. Should be a `<div>` for better semantics.
**Fix:** Conditionally render as button or div.

### 31. Package Name is Generic
**File:** `package.json`
Package name is `vite_react_shadcn_ts` — should be `jolliday` or `jolliday-web`.
**Fix:** Rename in package.json.

### 32. Unused Radix UI Dependencies
**File:** `package.json`
Several Radix UI packages may be unused: `react-menubar`, `react-navigation-menu`, `react-hover-card`, `react-context-menu`. These add to bundle size.
**Fix:** Audit and remove unused packages.

---

## Architecture Summary

| Area | Status | Notes |
|------|--------|-------|
| Routing | ✅ Good | Lazy loading, code splitting, ErrorBoundary wraps app |
| Auth | 🟡 Okay | Works but has race condition and fragile welcome email |
| Subscription | 🟡 Okay | Fallback logic is good, but client-side enforcement is weak |
| Chat Engine | 🟡 Okay | Functional but needs AbortController and stale closure fix |
| Plan Parser | ✅ Good | Well-documented, handles streaming, edge cases covered |
| Landing Page | 🟡 Okay | Looks good but dark mode broken, fake social proof |
| Edge Functions | ✅ Good | Rate limiting, CORS, cache system all solid |
| Error Handling | 🔴 Weak | ErrorBoundary exists but no reporting, many silent failures |
| Accessibility | 🟡 Needs Work | Missing labels, focus management, keyboard nav gaps |
| Mobile UX | ❓ Unknown | Need to test — code looks responsive but unverified |
| Performance | 🟡 Okay | Lazy loading good, but unbounded caches and large components |

---

## Priority Fix Order

1. **Security fixes** — Admin gate, XSS sanitization, server-side paywall
2. **Crash prevention** — AbortController, stale closures, size limits
3. **Error visibility** — Add error reporting
4. **UX fixes** — Dark mode, fake social proof, routing bug
5. **Dead code removal** — Unused basket, deprecated functions, unused deps
6. **Polish** — Accessibility, currency display, form validation
7. **Performance** — Bounded caches, scroll optimization

---

*Audit complete. Proceeding to Phase 2-6: Execution.*
