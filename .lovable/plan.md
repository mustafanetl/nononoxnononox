

# Finalize Home Page -- Production-Ready & Premium

## Current Issues
- Hero is plain text with no visual punch -- no image, no animation, just a centered heading
- HeroSection component exists with a search input + hero image but is **not used** on Index.tsx
- Sections (destinations, features, testimonials, pricing, CTA) are visually flat -- same spacing, same card style, no rhythm
- Footer is a single line -- doesn't feel like a real product
- No scroll animations -- page feels static
- Mobile (393px): hero takes too much vertical space, destination grid is cramped

## Changes

### 1. Integrate HeroSection into Index.tsx
Replace the plain text hero with the existing `HeroSection` component (has search input, hero image, suggestion chips, stats bar). Wire its search input to navigate to `/chat?q=...` on submit.

### 2. Add Scroll-Triggered Fade-In Animations
Use IntersectionObserver to add staggered fade-in animations to each section (destinations, features, testimonials, pricing) as they scroll into view. Reuse existing `animate-stagger-in` utility.

### 3. Redesign Features Section
Change from 4 plain icon+text blocks to a **2x2 grid of cards** with subtle borders, slightly larger icons, and a hover lift effect. Add a section heading ("How Rzuma Works") above.

### 4. Improve Testimonials
- Add star ratings (5 stars) above each quote
- Add avatar initials circle for each reviewer
- Subtle quote mark decoration

### 5. Polish Pricing Section
- Add annual/monthly toggle (visual only for now)
- Add a "Save 20%" badge on annual
- Slight gradient or accent background on the highlighted Pro card

### 6. Proper Footer
Replace the single-line footer with a structured layout:
- Logo + tagline on the left
- Links: Product, Pricing, Chat columns
- Social placeholders (Twitter/X, Instagram icons)
- Copyright with current year

### 7. Mobile Optimization (393px)
- Hero image smaller on mobile, search input full-width
- Destination grid: 2 columns with tighter gaps
- Features: single column stack on mobile
- Pricing cards: horizontal scroll on mobile instead of stacking

### 8. CTA Section Enhancement
- Add a subtle pattern/gradient background instead of flat muted
- Larger heading, add a secondary line of social proof ("Join 50K+ travelers")

## Files to Modify

### `src/pages/Index.tsx`
- Import and use HeroSection (replace inline hero)
- Add IntersectionObserver-based scroll animations wrapper
- Redesign features grid with cards
- Enhance testimonials with stars + avatars
- Build proper multi-column footer
- Polish CTA section
- Mobile-responsive tweaks

### `src/components/HeroSection.tsx`
- Wire search input to `navigate('/chat?q=...')` on submit
- Wire suggestion chips to navigate too
- Update copyright year to 2025
- Remove unused `hero-bg` class reference (use bg-background)

### `src/components/PricingSection.tsx`
- Add monthly/annual toggle state
- "Save 20%" badge on annual mode
- Subtle accent on Pro card background

### `src/index.css`
- Add `@keyframes slide-up` for scroll reveal if not already present

