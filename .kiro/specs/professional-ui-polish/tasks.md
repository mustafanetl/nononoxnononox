# Implementation Plan: Professional UI Polish

## Overview

Apply professional polish across the Jolliday application with consistent styling, smooth transitions, typography refinement, and loading states.

## Tasks

- [ ] 1. Add global style refinements
  - [ ] 1.1 Add smooth scroll behavior to `src/index.css`
    - Add `scroll-behavior: smooth` to `html` selector
    - Add `prefers-reduced-motion` media query to disable animations for accessibility
    - _Requirements: 2.4_

  - [ ] 1.2 Refine typography defaults in `src/index.css`
    - Ensure headings use `Plus Jakarta Sans` with weight 600–800 and line-height 1.1–1.3
    - Ensure body text uses `Inter` with weight 400 and line-height 1.5–1.75
    - Add consistent heading-to-body spacing (0.5rem–1rem)
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 2. Polish UI primitive components
  - [ ] 2.1 Update `src/components/ui/button.tsx` with transitions
    - Add `transition-colors duration-200` to base button styles
    - Ensure consistent border-radius using `--radius` token
    - Verify all variants have appropriate hover state changes
    - _Requirements: 1.1, 2.1_

  - [ ] 2.2 Update `src/components/ui/card.tsx` with hover effects
    - Add `transition-all duration-200` to card base styles
    - Add subtle hover shadow elevation (`hover:shadow-md`)
    - Ensure consistent box-shadow and border-radius (1rem)
    - _Requirements: 1.2, 2.2_

  - [ ] 2.3 Update `src/components/ui/input.tsx` with focus refinement
    - Ensure consistent border color using `--border` token
    - Add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
    - Ensure border-radius matches `--radius` token
    - _Requirements: 1.3, 1.4_

- [ ] 3. Polish landing page components
  - [ ] 3.1 Add hover transitions to landing section cards
    - Update testimonial cards, feature cards, and destination tiles with hover effects
    - Ensure consistent `transition-all duration-200` across all card-like elements
    - _Requirements: 2.2_

  - [ ] 3.2 Add navigation link hover states
    - Ensure all nav links have underline or color transition on hover
    - Use `duration-150` for snappy feedback
    - _Requirements: 2.3_

  - [ ] 3.3 Apply max-width constraint to text containers
    - Add `max-w-[65ch]` to body text containers for readability
    - Ensure headings and descriptions don't stretch too wide on large screens
    - _Requirements: 3.4_

- [ ] 4. Add loading and empty states
  - [ ] 4.1 Create skeleton placeholder components for async content
    - Add skeleton variants for cards, text blocks, and images
    - Use `--primary` color with pulse animation
    - _Requirements: 4.1, 4.3_

  - [ ] 4.2 Add empty state messaging for data-dependent views
    - Create reusable empty state component with icon and message
    - Apply to views that may have no data
    - _Requirements: 4.2_

- [ ] 5. Build verification and final cleanup
  - [ ] 5.1 Run `npm run build` and fix any errors
    - Ensure build completes with exit code 0
    - Fix any TypeScript or ESLint errors introduced by polish changes
    - _Requirements: 5.1, 5.2_

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3"] },
    { "id": 3, "tasks": ["4.1", "4.2"] },
    { "id": 4, "tasks": ["5.1"] }
  ]
}
```
