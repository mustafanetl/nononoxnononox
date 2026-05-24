# Codebase Audit Results

## Summary

Audited all key files listed in GOAL_ULTIMATE.md Phase 1. Issues categorized by severity.

---

## 🔴 Critical Issues

### 1. GYG Code Still Present Everywhere
- `.env` contains `GETYOURGUIDE_PARTNER_ID=9KRYTOC`
- `supabase/functions/rzuma-chat/index.ts` — Lines 752-877: Full GYG injection logic
- `supabase/functions/enrich-booking-links/index.ts` — Entire function is GYG-centric
- `src/hooks/useEnrichBookingLinks.ts` — References GYG provider type
- `src/components/admin/AdminMediaPanel.tsx` — Full GYG tab, GygCityView component
- `src/components/landing/HowItWorks.tsx` — Mentions "GetYourGuide" in step 3
- `src/pages/Blog.tsx` — Mentions GetYourGuide
- `index.html` — SEO structured data mentions GetYourGuide
- `KIRO_PROJECT_CONTEXT.md` — Multiple GYG references
- `scripts/scrape_getyourguide.py` — Entire file is GYG scraper

### 2. Fake Social Proof
- `src/components/PaywallModal.tsx` line ~end: "Join 2,000+ travelers planning smarter trips" — fabricated number
- `src/components/landing/SocialProof.tsx` — All 3 testimonials appear fabricated (Sofia M., James T., Priya K.)
- Note: HeroSection.tsx is CLEAN — no fake counters found (previously removed)

### 3. API Keys Exposed in .env (committed to git)
- `SUPABASE_SERVICE_ROLE_KEY` — full service role key in .env
- `OPENROUTER_API_KEY` — full API key in .env
- These should NEVER be in a committed file. Check `.gitignore`.

---

## 🟡 Important Issues

### 4. Design Inconsistencies
- Homepage uses gradient text (`bg-gradient-to-r from-primary to-indigo-500 bg-clip-text`) — GOAL says NO gradients on text
- No consistent design token system — spacing, typography, colors vary per component
- Mobile experience needs work — Chat.tsx is 1500+ lines, complex state management

### 5. Chat.tsx is Monolithic (1570+ lines)
- Single file handles: sidebar, messages, crafting animation, enrichment, parsing, modals, carousels
- Hard to maintain, easy to introduce bugs
- Should be split into smaller components

### 6. SocialProof Component Uses Fabricated Testimonials
- "Sofia M." — no verification this is a real user
- "James T." — no verification
- "Priya K." — no verification
- These need to be either removed or replaced with real testimonials

### 7. bookingLinks.ts is Clean
- No GYG references — only Skyscanner and Booking.com
- Well-documented, properly typed
- ✅ No action needed

### 8. useRzumaChat.ts — Solid but Large
- Good architecture: localStorage persistence, DB sync, streaming, QA review
- No GYG references in this file
- Could benefit from splitting (conversation management vs. streaming vs. QA)

### 9. Missing Accessibility
- PaywallModal: Has aria-modal and role="dialog" ✅
- HeroSection: Has aria-label on textarea ✅
- But: No skip-to-content link, no focus management on route changes
- Touch targets need verification (44x44px minimum)

---

## 🟢 Nice-to-Fix

### 10. App.tsx Structure is Good
- ErrorBoundary wraps app ✅
- Lazy loading for non-critical routes ✅
- ThemeProvider for dark mode ✅
- Protected routes properly gated ✅

### 11. Index.tsx (Homepage) is Well-Structured
- Clean navbar with mobile menu
- Proper section organization
- Footer is minimal and appropriate
- MobileStickyCTA exists

### 12. Multiple Promo Pages
- `/promo`, `/promomalmo`, `/promox`, `/promoar` — likely one-off campaigns
- Could be consolidated or removed if no longer active

### 13. test_plan_log.json Contains Raw Google API Keys
- File contains `key=AIzaSyA-RWUgv_7bAwU2gvm_APnjk2pwUy6lfxs` in URLs
- Should be in .gitignore or deleted

---

## Files Audited

| File | Status | Notes |
|------|--------|-------|
| KIRO_PROJECT_CONTEXT.md | 🔴 Has GYG refs | Needs cleanup |
| src/App.tsx | ✅ Clean | Good architecture |
| src/pages/Index.tsx | ✅ Clean | Well-structured |
| src/pages/Chat.tsx | 🟡 Monolithic | 1570+ lines, needs splitting |
| src/components/HeroSection.tsx | ✅ Clean | No fake data |
| src/components/landing/SocialProof.tsx | 🔴 Fake testimonials | Remove or replace |
| src/components/PaywallModal.tsx | 🔴 Fake number | "2,000+ travelers" |
| src/components/landing/HowItWorks.tsx | 🔴 GYG mention | Step 3 text |
| src/utils/bookingLinks.ts | ✅ Clean | No GYG |
| src/hooks/useRzumaChat.ts | ✅ Clean | No GYG, solid code |
| src/hooks/useEnrichBookingLinks.ts | 🔴 GYG types | Provider type refs |
| src/components/admin/AdminMediaPanel.tsx | 🔴 Full GYG tab | Large cleanup needed |
| supabase/functions/rzuma-chat/index.ts | 🔴 GYG injection | Lines 752-877 |
| supabase/functions/enrich-booking-links/ | 🔴 GYG-centric | Entire function |
| index.html | 🔴 GYG in SEO | Structured data |
| .env | 🔴 GYG + exposed keys | Security risk |
| scripts/scrape_getyourguide.py | 🔴 DELETE | Entire file is GYG |

---

## Action Plan

1. **Phase 2:** Remove all GYG code + fake social proof (this audit drives it)
2. **Phase 3:** Redesign with consistent design tokens
3. **Phase 5:** Fix security issues (.env keys, test_plan_log.json)
