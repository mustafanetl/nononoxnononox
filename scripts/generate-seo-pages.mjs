/**
 * Post-build script: generates static HTML pages for SEO-critical routes.
 *
 * These pages contain the full meta tags, structured data, and visible text content
 * that search engines need — served as real HTML files by Vercel BEFORE the SPA catch-all.
 *
 * The pages include a minimal inline-styles version of the content + a script tag
 * that loads the full React app for interactivity.
 */

import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { join, dirname } from "path";

const DIST = "dist";
const BASE_URL = "https://jolliday.online";

// Read the built index.html to extract the asset references
const indexHtml = readFileSync(join(DIST, "index.html"), "utf-8");
const scriptMatch = indexHtml.match(/<script type="module"[^>]*src="([^"]+)"[^>]*>/);
const cssMatches = [...indexHtml.matchAll(/<link[^>]*href="([^"]+\.css)"[^>]*>/g)];
const scriptSrc = scriptMatch?.[1] || "/assets/index.js";
const cssRefs = cssMatches.map(m => m[1]);

// Common HTML wrapper
function makePage({ path, title, description, canonicalPath, content, structuredData }) {
  const canonical = `${BASE_URL}${canonicalPath || path}`;
  const cssLinks = cssRefs.map(href => `<link rel="stylesheet" href="${href}">`).join("\n    ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
    <link rel="canonical" href="${canonical}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${BASE_URL}/og-image.png">
    <meta property="og:site_name" content="Jolliday">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${BASE_URL}/og-image.png">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    ${cssLinks}
    ${structuredData ? `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>` : ""}
</head>
<body>
    <div id="root">
        ${content}
    </div>
    <script type="module" src="${scriptSrc}"></script>
</body>
</html>`;
}

// Destination data
const destinations = [
  { slug: "amsterdam", name: "Amsterdam", country: "Netherlands", desc: "Canal-lined streets, world-class museums, and vibrant nightlife make Amsterdam one of Europe's most beloved cities." },
  { slug: "barcelona", name: "Barcelona", country: "Spain", desc: "Where Gaudí's surreal architecture meets Mediterranean beaches and world-famous tapas." },
  { slug: "berlin", name: "Berlin", country: "Germany", desc: "A city where history, art, and nightlife collide. Berlin's creative energy and cultural depth are unmatched." },
  { slug: "tokyo", name: "Tokyo", country: "Japan", desc: "Ancient temples beside neon-lit skyscrapers. Incredible food, cutting-edge tech, and centuries of tradition." },
  { slug: "paris", name: "Paris", country: "France", desc: "The City of Light. World-class art, iconic landmarks, and the finest cuisine on Earth." },
  { slug: "london", name: "London", country: "United Kingdom", desc: "History, theater, world cuisine, and royal pageantry packed into one extraordinary city." },
  { slug: "rome", name: "Rome", country: "Italy", desc: "Walk through millennia of history before sitting down to the best pasta of your life." },
  { slug: "bangkok", name: "Bangkok", country: "Thailand", desc: "Ornate temples, incredible street food, rooftop bars, and one of the best-value cities on Earth." },
  { slug: "dubai", name: "Dubai", country: "UAE", desc: "Futuristic architecture, luxury shopping, desert adventures, and beaches." },
  { slug: "lisbon", name: "Lisbon", country: "Portugal", desc: "Tiled facades, hilltop viewpoints, pastéis de nata, and Atlantic breezes." },
  { slug: "stockholm", name: "Stockholm", country: "Sweden", desc: "Spread across 14 islands with stunning waterfront views, Nordic design, and Michelin-starred restaurants." },
  { slug: "singapore", name: "Singapore", country: "Singapore", desc: "Hawker centres serve Michelin-starred meals. Futuristic gardens meet colonial architecture." },
  { slug: "new-york", name: "New York", country: "USA", desc: "Iconic landmarks, Broadway, world-class dining, and neighborhoods each with their own character." },
  { slug: "bali", name: "Bali", country: "Indonesia", desc: "Lush rice terraces, sacred temples, world-class surfing, and yoga retreats." },
  { slug: "marrakech", name: "Marrakech", country: "Morocco", desc: "Spice markets, ornate riads, and the Atlas Mountains on the horizon." },
];

// Blog posts
const blogPosts = [
  { slug: "best-ai-trip-planner-2026", title: "Best AI Trip Planner in 2026: What Actually Works", desc: "Honest comparison of AI trip planners. We tested Jolliday, Layla AI, Wonderplan, ChatGPT, and more.", date: "2026-05-15" },
  { slug: "3-days-barcelona-itinerary", title: "3 Days in Barcelona: AI-Planned Itinerary (2026)", desc: "Complete 3-day Barcelona itinerary with day-by-day schedule, restaurants, activities, and tips.", date: "2026-05-10" },
  { slug: "how-to-plan-trip-with-ai", title: "How to Plan a Trip with AI (Complete Guide 2026)", desc: "Step-by-step guide to using AI for trip planning. Best prompts, what to expect, and how to get bookable itineraries.", date: "2026-05-01" },
];

// Generate destination pages
for (const dest of destinations) {
  const dir = join(DIST, "destinations", dest.slug);
  mkdirSync(dir, { recursive: true });

  const html = makePage({
    path: `/destinations/${dest.slug}`,
    title: `Plan a Trip to ${dest.name} — AI Itinerary in 60 Seconds | Jolliday`,
    description: `Plan your ${dest.name}, ${dest.country} trip with AI. Get a complete day-by-day itinerary with flights, hotels, activities, and booking links. ${dest.desc}`,
    content: `
        <main style="font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem 1rem;">
            <nav style="margin-bottom: 2rem;"><a href="/" style="text-decoration: none; font-weight: bold; color: #2d42b3;">Jolliday</a> / <a href="/destinations/${dest.slug}">Destinations</a></nav>
            <h1 style="font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5rem;">Plan a Trip to ${dest.name}</h1>
            <p style="color: #666; font-size: 1.1rem; margin-bottom: 1.5rem;">${dest.country}</p>
            <p style="font-size: 1.1rem; line-height: 1.7; margin-bottom: 2rem;">${dest.desc}</p>
            <a href="/chat?q=Plan+a+trip+to+${encodeURIComponent(dest.name)}" style="display: inline-block; background: #2d42b3; color: white; padding: 0.875rem 2rem; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 1.1rem;">Plan my ${dest.name} trip →</a>
            <section style="margin-top: 3rem;">
                <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem;">Why use Jolliday for your ${dest.name} trip?</h2>
                <ul style="line-height: 2; color: #444;">
                    <li>Complete day-by-day itinerary generated in under 60 seconds</li>
                    <li>Every venue verified against Google Places — no fake recommendations</li>
                    <li>Real flight and hotel prices from Travelpayouts</li>
                    <li>Walking times between stops calculated via OSRM routing</li>
                    <li>Direct booking links to Skyscanner, Booking.com, and GetYourGuide</li>
                    <li>Personalized to your budget, travel style, and group size</li>
                </ul>
            </section>
            <section style="margin-top: 2rem;">
                <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem;">Popular ${dest.name} trip requests</h2>
                <ul style="line-height: 2;">
                    <li><a href="/chat?q=3+days+in+${encodeURIComponent(dest.name)}+for+a+couple" style="color: #2d42b3;">3 days in ${dest.name} for a couple</a></li>
                    <li><a href="/chat?q=Weekend+in+${encodeURIComponent(dest.name)}+budget+friendly" style="color: #2d42b3;">Weekend in ${dest.name}, budget-friendly</a></li>
                    <li><a href="/chat?q=${encodeURIComponent(dest.name)}+food+and+culture+trip+5+days" style="color: #2d42b3;">${dest.name} food and culture trip, 5 days</a></li>
                </ul>
            </section>
        </main>`,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "TouristDestination",
      "name": dest.name,
      "description": dest.desc,
      "containedInPlace": { "@type": "Country", "name": dest.country },
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${BASE_URL}/chat?q=Plan+a+trip+to+${encodeURIComponent(dest.name)}`,
      },
    },
  });

  writeFileSync(join(dir, "index.html"), html);
}

// Generate blog index
mkdirSync(join(DIST, "blog"), { recursive: true });
const blogIndexContent = blogPosts.map(p =>
  `<article style="margin-bottom: 2rem; padding: 1.5rem; border: 1px solid #eee; border-radius: 1rem;">
    <a href="/blog/${p.slug}" style="text-decoration: none; color: inherit;"><h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">${p.title}</h2></a>
    <p style="color: #666; font-size: 0.9rem; margin-bottom: 0.5rem;">${p.date}</p>
    <p style="color: #444;">${p.desc}</p>
  </article>`
).join("\n");

writeFileSync(join(DIST, "blog", "index.html"), makePage({
  path: "/blog",
  title: "Travel Planning Blog — AI Tips & Destination Guides | Jolliday",
  description: "Tips, destination guides, and AI trip planning comparisons. Learn how to plan better trips faster with AI.",
  content: `
    <main style="font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem 1rem;">
        <nav style="margin-bottom: 2rem;"><a href="/" style="text-decoration: none; font-weight: bold; color: #2d42b3;">Jolliday</a> / Blog</nav>
        <h1 style="font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5rem;">Travel Planning Blog</h1>
        <p style="color: #666; font-size: 1.1rem; margin-bottom: 2rem;">Tips, guides, and comparisons to help you plan better trips with AI.</p>
        ${blogIndexContent}
    </main>`,
}));

// Generate individual blog post pages
for (const post of blogPosts) {
  const dir = join(DIST, "blog", post.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), makePage({
    path: `/blog/${post.slug}`,
    title: `${post.title} | Jolliday Blog`,
    description: post.desc,
    content: `
        <main style="font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem 1rem;">
            <nav style="margin-bottom: 2rem;"><a href="/" style="text-decoration: none; font-weight: bold; color: #2d42b3;">Jolliday</a> / <a href="/blog">Blog</a></nav>
            <h1 style="font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5rem;">${post.title}</h1>
            <p style="color: #666; margin-bottom: 2rem;">${post.date}</p>
            <p style="font-size: 1.1rem; line-height: 1.7;">${post.desc}</p>
            <a href="/chat" style="display: inline-block; margin-top: 2rem; background: #2d42b3; color: white; padding: 0.875rem 2rem; border-radius: 9999px; text-decoration: none; font-weight: 600;">Try Jolliday AI Trip Planner →</a>
        </main>`,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": post.title,
      "description": post.desc,
      "datePublished": post.date,
      "author": { "@type": "Organization", "name": "Jolliday" },
      "publisher": { "@type": "Organization", "name": "Jolliday", "url": BASE_URL },
    },
  }));
}

console.log(`✓ Generated ${destinations.length} destination pages`);
console.log(`✓ Generated blog index + ${blogPosts.length} article pages`);
console.log(`✓ Total: ${destinations.length + blogPosts.length + 1} static HTML pages`);
