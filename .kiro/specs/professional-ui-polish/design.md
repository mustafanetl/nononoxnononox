# Design Document: Professional UI Polish

## Overview

This design applies professional polish across the Jolliday application, building on the light theme established by the homepage redesign. The focus is on consistency, micro-interactions, typography refinement, and loading states that elevate the perceived quality of the product.

### Key Design Decisions

1. **Token-driven consistency** — All polish changes reference existing CSS custom properties to maintain a single source of truth.
2. **Subtle transitions** — Hover and focus states use 150–200ms transitions for responsive feel without distraction.
3. **No new dependencies** — All changes use existing Tailwind utilities and CSS custom properties.
4. **Progressive enhancement** — Transitions and animations degrade gracefully in reduced-motion contexts.

## Architecture

The polish changes are distributed across the existing component library:

| Layer | Files Affected | Nature of Change |
|-------|---------------|-----------------|
| Global styles | `src/index.css` | Add smooth scroll, transition defaults |
| UI primitives | `src/components/ui/button.tsx`, `card.tsx`, `input.tsx` | Add consistent transitions, hover states |
| Landing sections | `src/components/landing/*.tsx` | Refine spacing, add hover effects to cards |
| Typography | `src/index.css` | Refine heading/body line-height and spacing |
| Loading states | New skeleton components as needed | Placeholder UI for async content |

## Components and Interfaces

### 1. Global Transition Defaults (index.css)

```css
html {
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 2. Button Polish (button.tsx)

Add `transition-colors duration-200` to all button variants. Ensure consistent border-radius using the `--radius` token.

### 3. Card Polish (card.tsx)

Add `transition-all duration-200 hover:shadow-md` for subtle elevation on hover. Ensure consistent `rounded-[1rem]` border-radius.

### 4. Input Polish (input.tsx)

Ensure consistent focus ring using `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.

### 5. Typography Refinement

Ensure heading elements use `font-display` (Plus Jakarta Sans) with weight 600–800 and line-height 1.1–1.3. Body text uses `font-sans` (Inter) with weight 400 and line-height 1.5–1.75.

## Data Models

No data model changes. All modifications are presentational.

## Error Handling

No new error states introduced. Loading states provide visual feedback for existing async operations.

## Testing Strategy

### Recommended Testing Approach

1. **Visual inspection** — Verify transitions and hover states work correctly across components.
2. **Build verification** — `npm run build` completes with exit code 0.
3. **Accessibility** — Verify focus indicators are visible, reduced-motion is respected.
4. **Responsive** — Verify polish changes don't break layouts at any breakpoint.
