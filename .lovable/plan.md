

# Landing Page Polish -- Fix Spacing, Trust & Scroll Issues

## Problems Found

1. **No space between navbar and hero content** -- The hero has `pt-20` (80px) but the fixed header is about 56px tall. On mobile (393px), the hero title "Plan Any Trip in 60 Seconds" starts too close to the navbar with barely any breathing room.

2. **Scroll-reveal sections are invisible on fast scroll** -- The `scroll-reveal` CSS starts at `opacity: 0` and relies on `IntersectionObserver` with `threshold: 0.15`. If a user scrolls quickly or the observer doesn't fire (common on some devices/browsers), the How It Works, Testimonials, and Pricing sections remain completely invisible. This is a critical bug -- entire sections of the page disappear.

3. **Hero section feels empty** -- After removing the fake social proof, there's too much dead space. The `min-h-[70vh]` makes the hero oversized for the minimal content it now has.

4. **"60 Seconds" on its own line looks odd** -- The `block` span forces "60 Seconds" onto a new line, which on mobile makes the title look unbalanced.

5. **Footer "Sign In" link feels cheap** -- Having "Sign In" as a footer link under "Product" is unusual and reduces trust.

6. **Pricing "Limited -- 1,000 spots" badge** -- The destructive red badge on Lifetime plan feels like a scam tactic after we removed other urgency signals.

## Plan

### 1. `src/components/HeroSection.tsx`
- Increase top padding from `pt-20` to `pt-28` for proper navbar clearance
- Reduce `min-h-[70vh]` to `min-h-[60vh]` so the hero isn't oversized
- Keep "60 Seconds" inline with the title instead of forcing a line break -- use a `text-primary` span without `block`

### 2. `src/pages/Index.tsx`
- **Remove scroll-reveal entirely** -- replace `RevealSection` wrapper with plain `div`. The animation is causing sections to be invisible and adds no real conversion value. Clean, instant-visible sections are more trustworthy than flashy animations that break.
- Remove "Sign In" from footer product links (it's already in the header)
- Remove the `useScrollReveal` hook and `RevealSection` component

### 3. `src/components/PricingSection.tsx`
- Remove the "Limited -- 1,000 spots" destructive badge from Lifetime plan -- it contradicts the "no fake urgency" direction
- Change Lifetime description to something honest like "Pay once, use forever"

### 4. `src/index.css`
- Remove the `.scroll-reveal` and `.scroll-visible` CSS rules (no longer needed)

## Files to Modify
- `src/components/HeroSection.tsx` -- fix spacing, title layout
- `src/pages/Index.tsx` -- remove scroll-reveal, clean footer
- `src/components/PricingSection.tsx` -- remove fake scarcity badge
- `src/index.css` -- remove unused scroll-reveal CSS

