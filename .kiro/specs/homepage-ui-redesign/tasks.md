# Implementation Plan: Homepage UI Redesign

## Overview

Transform the Jolliday homepage from a dark aesthetic to a clean, light, professional design. The implementation follows a theme-layer-first strategy: update CSS custom properties, then adjust individual components with hardcoded dark styles, and finally verify the build and rendering.

## Tasks

- [x] 1. Update CSS custom properties and remove dark mode
  - [x] 1.1 Replace `:root` CSS variables in `src/index.css` with light theme values
    - Set `--background: 0 0% 100%`, `--foreground: 0 0% 7%`
    - Set `--card: 0 0% 99%`, `--card-foreground: 0 0% 7%`
    - Set `--popover: 0 0% 99%`, `--popover-foreground: 0 0% 7%`
    - Set `--primary: 234 62% 47%`, `--primary-foreground: 0 0% 100%`
    - Set `--secondary: 0 0% 96%`, `--secondary-foreground: 0 0% 7%`
    - Set `--muted: 0 0% 96%`, `--muted-foreground: 0 0% 35%`
    - Set `--accent: 234 62% 47%`, `--accent-foreground: 0 0% 100%`
    - Set `--destructive: 0 75% 50%`, `--destructive-foreground: 0 0% 100%`
    - Set `--border: 0 0% 90%`, `--input: 0 0% 90%`, `--ring: 234 62% 47%`
    - Set `--radius: 1rem`
    - Remove the `.dark` class CSS block entirely
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 7.1, 7.4, 9.3_

  - [x] 1.2 Update ThemeProvider configuration in `src/App.tsx`
    - Change `defaultTheme="dark"` to `defaultTheme="light"`
    - Add `forcedTheme="light"` to prevent theme switching
    - Set `enableSystem={false}`
    - _Requirements: 1.6, 9.1, 9.2_

  - [x] 1.3 Remove ThemeToggle component
    - Delete `src/components/ThemeToggle.tsx`
    - Remove ThemeToggle import and usage from `src/pages/Index.tsx` footer
    - _Requirements: 9.1, 9.2_

- [x] 2. Redesign Hero Section
  - [x] 2.1 Update `src/components/HeroSection.tsx` to use light background
    - Remove the background image (`<img>`) and dark overlay (`bg-black/50`) elements
    - Apply a light gradient background: `linear-gradient(180deg, hsl(0 0% 97%), hsl(0 0% 100%))`
    - Change headline text to `text-foreground` (dark on light)
    - Change subheadline text to `text-muted-foreground`
    - Style the search bar with white background, `border border-border`, and `shadow-sm`
    - Style the submit button with `bg-primary text-primary-foreground`
    - Apply vertical padding: min 120px top / 80px bottom on md+, min 64px top / 48px bottom on mobile
    - Preserve existing search form submission logic (navigate to `/chat?q=<encoded>`)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 2.2 Write unit tests for HeroSection
    - Verify no dark overlay element (`bg-black/50`) is rendered
    - Verify form submission navigates to `/chat?q=<encoded>`
    - Verify heading and subheading text render with correct contrast classes
    - _Requirements: 2.1, 2.2, 2.3, 2.6_

- [x] 3. Update Navigation Header
  - [x] 3.1 Add scroll-aware background to the header in `src/pages/Index.tsx`
    - Add `useState` for scrolled state and `useEffect` with scroll listener (threshold: 50px)
    - When scrolled: apply `bg-white/80 backdrop-blur-md border-b border-border`
    - When at top: apply `bg-transparent` with no border
    - Ensure logo and text use `text-foreground` for contrast in both states
    - Style "Start Planning" CTA with `bg-primary text-primary-foreground`
    - Style "Sign in" with text-only styling (`text-foreground`)
    - On viewports < 640px, display "Sign in" as icon-only button
    - Ensure header remains fixed with appropriate z-index
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 3.2 Write unit tests for Navigation Header scroll behavior
    - Verify transparent background when scroll position is 0
    - Verify white/80 background with border after scrolling past 50px
    - Verify CTA button and sign-in link render with correct styles
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Checkpoint - Verify core layout changes
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Update landing section components
  - [x] 5.1 Update `src/components/landing/FinalCTA.tsx` to use light background
    - Replace `bg-foreground` with a light gradient or `bg-muted` (lightness ≥ 90%)
    - Change headline to `text-foreground`
    - Change body text to `text-muted-foreground`
    - Style CTA button with `bg-primary text-primary-foreground`
    - _Requirements: 4.5, 5.2, 5.3_

  - [x] 5.2 Update `src/components/landing/DestinationsMosaic.tsx` overlay opacity
    - Change gradient overlay from `from-black/70 via-black/20 to-transparent` to `from-black/50 via-black/10 to-transparent`
    - _Requirements: 6.3_

  - [x] 5.3 Verify and update section spacing across all landing components
    - Ensure each section component uses background lightness ≥ 98% with saturation ≤ 5%
    - Ensure vertical padding ≥ 80px on md+ viewports and ≥ 48px on mobile
    - Add visible distinction between adjacent sections (background color change or 1px border)
    - Files: `HowItWorks.tsx`, `WhyJolliday.tsx`, `SocialProof.tsx`, `HomeFAQ.tsx`, `ProductPreview.tsx`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6_

  - [x] 5.4 Update card styling across components
    - Ensure cards use white background (lightness ≥ 95%) with 1px solid border (lightness 82–88%)
    - Apply box shadow: `0px 1px 3px 0px rgba(0,0,0,0.06), 0px 1px 2px -1px rgba(0,0,0,0.03)`
    - Apply border-radius of 1rem (16px)
    - Applies to testimonial cards, feature cards, destination tiles
    - _Requirements: 6.1, 6.2, 6.4_

  - [x] 5.5 Verify `src/components/landing/MobileStickyCTA.tsx` uses light theme tokens
    - Confirm component uses design tokens (`bg-background`, `text-foreground`, `border-border`)
    - Ensure it remains visible as fixed bottom bar after 70% scroll on mobile
    - Ensure no overlap with footer or page content
    - _Requirements: 8.2_

- [x] 6. Responsive design verification and fixes
  - [x] 6.1 Verify and fix responsive layout at all breakpoints
    - Test at 320px, 640px, 768px, 1024px, 1200px
    - Ensure no horizontal overflow or overlapping elements
    - Ensure all interactive elements have minimum 44×44px tap targets at 320px
    - Ensure no text overflow at any breakpoint
    - _Requirements: 8.1, 8.3, 8.4_

  - [x] 6.2 Write unit tests for section DOM order
    - Verify Homepage renders sections in order: HeroSection, HowItWorks, DestinationsMosaic, WhyJolliday, SocialProof, HomeFAQ, FinalCTA
    - _Requirements: 10.3_

- [x] 7. Build verification and final cleanup
  - [x] 7.1 Run `npm run build` and fix any TypeScript or ESLint errors
    - Ensure build completes with exit code 0
    - Fix any type errors from removed ThemeToggle references
    - Fix any unused import warnings
    - _Requirements: 10.1_

  - [x] 7.2 Write unit tests for CSS variable values and contrast ratios
    - Verify `--background` lightness ≥ 98%
    - Verify `--foreground` lightness ≤ 10%
    - Verify foreground/background contrast ratio ≥ 4.5:1
    - Verify `--primary` achieves 4.5:1 contrast on white
    - _Requirements: 1.1, 1.2, 1.7, 5.1, 5.2, 5.3, 7.1, 7.2_

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Unit tests validate specific rendering output and configuration values
- Property-based tests are not applicable for this UI redesign (no universal properties over input spaces)
- The design uses TypeScript/React (TSX) — all implementation uses the existing project stack

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1", "3.1"] },
    { "id": 3, "tasks": ["2.2", "3.2", "5.1", "5.2"] },
    { "id": 4, "tasks": ["5.3", "5.4", "5.5"] },
    { "id": 5, "tasks": ["6.1", "6.2"] },
    { "id": 6, "tasks": ["7.1", "7.2"] }
  ]
}
```
