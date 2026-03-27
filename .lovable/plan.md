

# Clean Up Landing Page — High-Quality SaaS Polish

## Problems identified

The current page has several elements that feel cheap/untrustworthy:

1. **Fake testimonials** with fake names, fake "verified" badges (BadgeCheck icons), and fabricated quotes — classic cheap Shopify store pattern
2. **5-star ratings** on every testimonial — looks manufactured
3. **"Recommended" badge** on pricing — pushy sales tactic
4. **"Click any destination to start planning instantly"** — overpromising copy
5. **Destination tags** like "Honeymoon Paradise", "Romance & Art" — feel gimmicky
6. **"60 Seconds" in primary color** — feels like a marketing gimmick
7. **"Try Jolliday Free"** CTA section at bottom — redundant and salesy
8. **"Your perfect trip in 3 simple steps"** — cliche subtitle
9. **"Plan smarter, travel better"** — generic tagline

## What changes

### HeroSection.tsx
- Rewrite headline: "Plan your next trip with AI" (no time claims, no colored spans)
- Subtitle: "Personalized itineraries with flights, hotels, and activities." (factual, no hype)
- Remove "Start with a 3-day free trial" from hero (keep it only in pricing)
- Keep search bar + suggestions as-is (those are functional, not gimmicky)

### Index.tsx — Testimonials section
- Remove the entire testimonials section (fake reviews are the #1 cheap signal)

### Index.tsx — Destinations section
- Remove the subtitle "Click any destination to start planning instantly"
- Remove the tag text ("Honeymoon Paradise", "Romance & Art", etc.) — just show destination name

### Index.tsx — How It Works section
- Change subtitle to just "Three steps to your itinerary"

### Index.tsx — Bottom CTA section
- Remove the entire bottom CTA block (redundant — pricing section already has CTAs)

### PricingSection.tsx
- Remove the "Recommended" badge from the annual plan
- Remove `scale-[1.03]` and `ring-2` — keep subtle highlight (just `border-primary`)
- Remove "Local currency pricing available at checkout" (over-promising)

### Index.tsx — Footer
- Remove social links (Twitter/Instagram pointing to generic URLs looks fake)
- Keep just logo, product links, and copyright

## Files to modify
1. `src/components/HeroSection.tsx` — cleaner headline/subtitle, remove trial text
2. `src/pages/Index.tsx` — remove testimonials section, bottom CTA, clean destinations, simplify footer
3. `src/components/PricingSection.tsx` — remove "Recommended" badge, tone down highlight styling

