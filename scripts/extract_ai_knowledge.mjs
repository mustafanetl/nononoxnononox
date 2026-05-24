// Extract ALL venue knowledge from AI about Rotterdam
// Calls OpenRouter directly — no system prompt interference

import { writeFileSync } from 'fs';
import { resolve } from 'path';

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
const CITY = 'Rotterdam';

const PROMPTS = [
  {
    category: 'dining',
    prompt: `List every restaurant you know in ${CITY}, Netherlands. Fine dining, casual, ethnic, seafood, Indonesian, Italian, French, Asian, steakhouses, vegan — all of them. Give me as many as possible (aim for 40+). Output ONLY a JSON array: [{"name":"exact name","cuisine":"type","neighborhood":"area","price":"budget/mid/high","meals":"lunch/dinner/both"}]. No explanation.`
  },
  {
    category: 'cafe',
    prompt: `List every café, coffee shop, bakery, brunch spot, and breakfast place you know in ${CITY}, Netherlands. Aim for 25+. Output ONLY a JSON array: [{"name":"exact name","type":"café/bakery/brunch/roaster","neighborhood":"area"}]. No explanation.`
  },
  {
    category: 'nightlife',
    prompt: `List every bar, cocktail bar, wine bar, pub, brewery, club, live music venue in ${CITY}, Netherlands. Aim for 30+. Output ONLY a JSON array: [{"name":"exact name","type":"cocktail/wine/pub/club/brewery/live music","neighborhood":"area"}]. No explanation.`
  },
  {
    category: 'culture',
    prompt: `List every museum, art gallery, theater, concert hall, cultural center in ${CITY}, Netherlands. Aim for 20+. Output ONLY a JSON array: [{"name":"exact name","type":"museum/gallery/theater/concert hall","neighborhood":"area","price":"€X"}]. No explanation.`
  },
  {
    category: 'sightseeing',
    prompt: `List every tourist attraction, landmark, viewpoint, bridge, tower, church, square, notable building, and architectural highlight in ${CITY}, Netherlands. Include Erasmus Bridge, Cube Houses, Markthal, Euromast, etc. Aim for 25+. Output ONLY a JSON array: [{"name":"exact official name","type":"type","neighborhood":"area"}]. No explanation.`
  },
  {
    category: 'outdoor',
    prompt: `List every park, garden, waterfront, nature area, and outdoor spot in ${CITY}, Netherlands. Aim for 15+. Output ONLY a JSON array: [{"name":"exact name","type":"park/garden/waterfront/forest","neighborhood":"area"}]. No explanation.`
  },
  {
    category: 'experience',
    prompt: `List every bookable tour, boat cruise, harbor tour, bike tour, food tour, escape room, cooking class, and activity experience in ${CITY}, Netherlands. Aim for 20+. Output ONLY a JSON array: [{"name":"exact name","type":"type","price":"€X"}]. No explanation.`
  },
  {
    category: 'shopping',
    prompt: `List every notable shopping street, indoor market, food hall, vintage store, flea market, and shopping district in ${CITY}, Netherlands. Aim for 15+. Output ONLY a JSON array: [{"name":"exact name","type":"street/market/store/mall","neighborhood":"area"}]. No explanation.`
  },
];

async function askAI(prompt) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'HTTP-Referer': 'https://jolliday.online',
      'X-Title': 'Jolliday Venue Extraction',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 8000,
      temperature: 0.3, // Low temp for factual recall
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`  API error: ${res.status} ${err.slice(0, 200)}`);
    return '';
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

function parseJSON(text) {
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (!arrayMatch) return [];
  
  try {
    return JSON.parse(arrayMatch[0]);
  } catch {
    // Fix common issues
    let fixed = arrayMatch[0]
      .replace(/,\s*\]/g, ']')
      .replace(/,\s*\}/g, '}')
      .replace(/[\x00-\x1f]/g, ' ');
    try {
      return JSON.parse(fixed);
    } catch {
      // Last resort: regex
      const names = [...text.matchAll(/"name"\s*:\s*"([^"]+)"/g)].map(m => ({ name: m[1] }));
      return names;
    }
  }
}

async function main() {
  console.log(`\n🧠 Extracting AI knowledge about ${CITY} (direct OpenRouter call)...\n`);
  
  const allVenues = [];
  
  for (const { category, prompt } of PROMPTS) {
    process.stdout.write(`  📂 ${category.padEnd(12)} `);
    
    const response = await askAI(prompt);
    const venues = parseJSON(response);
    
    const tagged = venues.filter(v => v.name).map(v => ({ ...v, category }));
    allVenues.push(...tagged);
    
    console.log(`→ ${tagged.length} venues`);
    
    await new Promise(r => setTimeout(r, 1500));
  }
  
  // Deduplicate
  const seen = new Set();
  const unique = allVenues.filter(v => {
    const key = v.name.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`✅ Total unique venues: ${unique.length}`);
  console.log(`${'═'.repeat(60)}`);
  
  const byCat = {};
  for (const v of unique) byCat[v.category] = (byCat[v.category] || 0) + 1;
  console.log('\nBreakdown:');
  Object.entries(byCat).sort((a,b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`  ${cat.padEnd(12)} ${count}`);
  });
  
  // Save
  writeFileSync(
    resolve(import.meta.dirname, 'ai_knowledge_rotterdam.json'),
    JSON.stringify({ city: CITY, generated_at: new Date().toISOString(), total: unique.length, venues: unique }, null, 2)
  );
  writeFileSync(
    resolve(import.meta.dirname, 'venues_to_scrape.txt'),
    unique.map(v => v.name).join('\n')
  );
  
  console.log(`\n✓ Saved: scripts/ai_knowledge_rotterdam.json`);
  console.log(`✓ Names: scripts/venues_to_scrape.txt`);
  console.log(`\nCost: ~$${(PROMPTS.length * 0.008).toFixed(3)} total`);
}

main().catch(console.error);
