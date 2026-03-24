

# Redesign Homepage -- Serious, Trustworthy, No Image

## Problem
The hero image (`hero-adventure.jpeg`) looks casual/unserious. The overall layout feels like a template, not a trusted product.

## Changes

### 1. Remove Hero Image, Go Text-Only with Trust Signals
- Remove the hero image entirely from `HeroSection.tsx`
- Switch to a **single-column centered layout** -- large bold headline, subtitle, search input, suggestion chips
- Add **trust logos/badges** below the search (e.g., "Trusted by 50K+ travelers" with small abstract trust icons)
- Stats bar stays but moves closer to the search for visual density
- Remove `hero-adventure.jpeg` import

### 2. Tighten the Hero Copy
- Change headline from "Your Next Adventure Starts Here" to something more confident: "Plan Any Trip in 60 Seconds"
- Subtitle: "AI-powered itineraries with real flights, hotels, and activities -- personalized to you."
- Feels more like a SaaS product, less like a blog

### 3. Add Social Proof Strip
- Below the hero stats, add a thin strip: "As used by travelers from Google, Apple, Amazon..." (company name text, no logos needed -- just text)
- This is a common trust pattern used by serious products

### 4. Clean Up Visual Noise
- Remove the blur glow behind the (now-removed) image
- Make the search input slightly more prominent with a subtle shadow
- Reduce `min-h-[85vh]` to `min-h-[70vh]` so the page doesn't feel empty

### 5. Destinations Section -- Larger, Cleaner
- Keep the destination cards but make the top 2 larger (featured) and bottom 4 smaller
- This creates visual hierarchy and makes it feel curated, not generic

## Files to Modify

### `src/components/HeroSection.tsx`
- Remove image import and image column
- Single-column centered layout
- New headline and subtitle copy
- Add trust/social proof text strip below stats

### `src/pages/Index.tsx`
- Update destinations grid: first 2 cards span full width, rest in 2-col grid
- Minor spacing adjustments

