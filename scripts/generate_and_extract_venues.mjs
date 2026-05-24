// Generate MANY plans via rzuma-chat and extract ALL unique venue names
// Goal: get 150-200+ unique venues the AI actually recommends

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const envContent = readFileSync(resolve(import.meta.dirname, '..', '.env'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line.includes('=') && !line.startsWith('#')) {
    const [k, ...v] = line.split('=');
    env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
  }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const ANON_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

// Generate MANY different queries to get diverse venue recommendations
const QUERIES = [
  'Berlin to Rotterdam 5 days foodie couple October 15-20',
  'Berlin to Rotterdam 3 days romantic couple October 10-13',
  'Berlin to Rotterdam 7 days adventure friends October 5-12',
  'Berlin to Rotterdam 4 days nightlife friends November 1-5',
  'Berlin to Rotterdam 5 days cultural solo October 20-25',
  'Berlin to Rotterdam 3 days relaxed family November 10-13',
  'Berlin to Rotterdam 10 days mixed couple October 1-11',
  'Berlin to Rotterdam 3 days foodie solo November 5-8',
  'Berlin to Rotterdam 14 days mixed couple September 1-15',
  'Berlin to Rotterdam 5 days romantic solo March 10-15',
  'Berlin to Rotterdam 7 days foodie friends June 1-8',
  'Berlin to Rotterdam 4 days cultural couple April 20-24',
  'Berlin to Rotterdam 6 days adventure couple May 5-11',
  'Berlin to Rotterdam 3 days nightlife solo December 1-4',
  'Berlin to Rotterdam 5 days relaxed couple August 10-15',
  'Berlin to Rotterdam 8 days mixed friends July 1-9',
];

async function generatePlan(query) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/rzuma-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
      'apikey': ANON_KEY,
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: query }],
      preferences: {},
      revisionRequest: [],
    }),
  });

  if (!res.ok) {
    return '';
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          fullText += content;
        } catch {}
      }
    }
  }

  return fullText;
}

function extractVenues(planText) {
  const venues = new Set();
  
  // Extract from activities block - handle malformed JSON gracefully
  const activitiesMatch = planText.match(/```activities\s*\n([\s\S]*?)\n```/);
  if (activitiesMatch) {
    // Try full JSON parse first
    try {
      const activities = JSON.parse(activitiesMatch[1]);
      for (const a of activities) {
        if (a.name) venues.add(a.name.trim());
      }
    } catch {
      // Fallback: regex extract "name" fields
      const nameMatches = activitiesMatch[1].matchAll(/"name"\s*:\s*"([^"]+)"/g);
      for (const m of nameMatches) {
        venues.add(m[1].trim());
      }
    }
  }
  
  // Extract from itinerary block
  const itineraryMatch = planText.match(/```itinerary\s*\n([\s\S]*?)\n```/);
  if (itineraryMatch) {
    try {
      const days = JSON.parse(itineraryMatch[1]);
      for (const day of days) {
        for (const slot of (day.slots || [])) {
          if (slot.venue) venues.add(slot.venue.trim());
        }
      }
    } catch {
      // Fallback: regex extract "venue" fields
      const venueMatches = itineraryMatch[1].matchAll(/"venue"\s*:\s*"([^"]+)"/g);
      for (const m of venueMatches) {
        venues.add(m[1].trim());
      }
    }
  }
  
  // Also try regex on the raw text for any "name": or "venue": pattern
  if (venues.size === 0) {
    const allNames = planText.matchAll(/"(?:name|venue)"\s*:\s*"([^"]{3,60})"/g);
    for (const m of allNames) {
      const name = m[1].trim();
      // Skip generic/non-venue strings
      if (name.match(/^(KLM|Transavia|berlin|rotterdam|mixed|couple|solo|friends|family|Oct|Nov|Dec)$/i)) continue;
      if (name.match(/^\d/)) continue; // starts with number
      venues.add(name);
    }
  }
  
  return [...venues];
}

async function main() {
  console.log(`Generating ${QUERIES.length} plans to discover ALL venues AI recommends...\n`);
  
  // First delete existing cache so each generates fresh
  await fetch(`${SUPABASE_URL}/rest/v1/cached_plans?id=neq.00000000-0000-0000-0000-000000000000`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY }
  });
  console.log('Cache cleared.\n');
  
  const allVenues = new Map(); // name -> count
  let totalExtracted = 0;
  
  for (let i = 0; i < QUERIES.length; i++) {
    const query = QUERIES[i];
    const shortLabel = query.replace('Berlin to Rotterdam ', '').slice(0, 45);
    process.stdout.write(`  [${i+1}/${QUERIES.length}] ${shortLabel}... `);
    
    const plan = await generatePlan(query);
    const venues = extractVenues(plan);
    totalExtracted += venues.length;
    
    console.log(`${venues.length} venues${venues.length < 5 ? ' ⚠️' : ''}`);
    
    for (const v of venues) {
      allVenues.set(v, (allVenues.get(v) || 0) + 1);
    }
    
    // Small delay
    await new Promise(r => setTimeout(r, 2000));
  }
  
  // Sort by frequency
  const sorted = [...allVenues.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
  
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`Total unique venues discovered: ${sorted.length}`);
  console.log(`Total venue mentions across all plans: ${totalExtracted}`);
  console.log(`${'═'.repeat(60)}\n`);
  
  console.log('Top 50 most recommended:');
  sorted.slice(0, 50).forEach((v, i) => {
    console.log(`  ${String(i+1).padStart(2)}. ${v.name} (${v.count}x)`);
  });
  
  if (sorted.length > 50) {
    console.log(`  ... and ${sorted.length - 50} more`);
  }
  
  // Save
  writeFileSync(
    resolve(import.meta.dirname, 'ai_recommended_venues.json'),
    JSON.stringify({ generated_at: new Date().toISOString(), total: sorted.length, venues: sorted }, null, 2)
  );
  writeFileSync(
    resolve(import.meta.dirname, 'venues_to_scrape.txt'),
    sorted.map(v => v.name).join('\n')
  );
  
  console.log(`\n✓ Saved ${sorted.length} venues to scripts/ai_recommended_venues.json`);
  console.log('✓ Saved names to scripts/venues_to_scrape.txt');
  console.log(`\nNext: python scripts/scrape_specific_venues.py --city Rotterdam`);
}

main().catch(console.error);
