// Deep extraction — get EVERY venue the AI knows about Rotterdam
// Multiple rounds, each asking for MORE, until we've exhausted its knowledge

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
const MODEL = 'google/gemini-2.5-flash';
const CITY = 'Rotterdam';

async function askAI(messages, sessionId) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'HTTP-Referer': 'https://jolliday.online',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: 16000,
      temperature: 0.3,
      session_id: sessionId,
    }),
  });
  if (!res.ok) { console.error('API error:', res.status, await res.text()); return ''; }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

function parseNames(text) {
  // Try JSON array first
  const arrMatch = text.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try {
      const arr = JSON.parse(arrMatch[0]);
      return arr.map(v => typeof v === 'string' ? v : v.name).filter(Boolean);
    } catch {}
  }
  // Fallback: extract "name" fields
  const names = [...text.matchAll(/"name"\s*:\s*"([^"]+)"/g)].map(m => m[1]);
  if (names.length > 0) return names;
  // Fallback: line-by-line (numbered lists)
  return text.split('\n').map(l => l.replace(/^\d+[\.\)]\s*/, '').trim()).filter(l => l.length > 2 && l.length < 80);
}

const CATEGORIES = [
  { cat: 'restaurants', prompt: `List ALL restaurants in ${CITY} Netherlands that a travel planner AI might recommend. Include fine dining (FG Restaurant, Parkheuvel, Joelia, Fred), casual dining, ethnic restaurants (Indonesian, Surinamese, Turkish, Italian, Japanese, Chinese, Thai, Indian, Middle Eastern, Greek, Spanish), seafood restaurants, steakhouses, vegan/vegetarian spots, bistros, brasseries, and hidden gems. I need the COMPLETE list — at least 80 names. Output as JSON array of strings: ["name1","name2",...]` },
  { cat: 'cafes_breakfast', prompt: `List ALL cafés, coffee shops, bakeries, brunch spots, and breakfast places in ${CITY} Netherlands. Include specialty coffee roasters, patisseries, lunchrooms, and all-day breakfast places. Names like Lilith Coffee, Hopper Coffee, Man Met Bril, Urban Espresso, etc. I need at least 50. Output as JSON array of strings: ["name1","name2",...]` },
  { cat: 'bars_nightlife', prompt: `List ALL bars, cocktail bars, wine bars, pubs, breweries, clubs, and nightlife venues in ${CITY} Netherlands. Include craft beer spots, rooftop bars, speakeasies, live music venues, jazz clubs, techno clubs. I need at least 50. Output as JSON array of strings: ["name1","name2",...]` },
  { cat: 'attractions_landmarks', prompt: `List ALL tourist attractions, landmarks, museums, galleries, viewpoints, bridges, towers, churches, parks, gardens, and cultural venues in ${CITY} Netherlands. Include Euromast, Erasmusbrug, Cube Houses, Markthal, SS Rotterdam, Kinderdijk, all museums (Kunsthal, Boijmans, Maritime, Wereldmuseum, etc), all parks, all notable buildings. At least 60. Output as JSON array of strings: ["name1","name2",...]` },
  { cat: 'activities_tours', prompt: `List ALL bookable activities, tours, experiences, and things to do in ${CITY} Netherlands. Harbor tours, bike tours, food tours, kayaking, boat rides, escape rooms, cooking classes, walking tours, segway tours, photography tours. At least 30. Output as JSON array of strings: ["name1","name2",...]` },
  { cat: 'hotels', prompt: `List ALL notable hotels, hostels, and accommodations in ${CITY} Netherlands. From luxury (Mainport, Hotel New York) to budget hostels. At least 25. Output as JSON array of strings: ["name1","name2",...]` },
  { cat: 'shopping_markets', prompt: `List ALL shopping streets, markets, food halls, vintage stores, and shopping areas in ${CITY} Netherlands. Include Markthal, Fenix Food Factory, Lijnbaan, Koopgoot, Binnenrotte market, Witte de Withstraat shops, etc. At least 20. Output as JSON array of strings: ["name1","name2",...]` },
];

// Second round — ask for MORE that weren't in the first list
const ROUND2_PROMPT = (cat, existingNames) => 
  `I already have these ${cat} for ${CITY}: ${existingNames.slice(0, 40).join(', ')}. 
   
   List MORE ${cat} that are NOT in my list. Think harder — what am I missing? Less famous spots, newer places, local favorites. Give me at least 30 MORE names. Output as JSON array of strings: ["name1","name2",...]`;

async function main() {
  console.log(`\n🧠 Deep extraction: ALL venues in ${CITY}\n`);
  
  const SESSION_ID = `jolliday-venue-extract-${CITY.toLowerCase()}-${Date.now()}`;
  console.log(`Session: ${SESSION_ID}\n`);
  
  const allNames = new Set();
  const byCat = {};

  for (const { cat, prompt } of CATEGORIES) {
    process.stdout.write(`  Round 1 — ${cat.padEnd(20)} `);
    const resp = await askAI([{ role: 'user', content: prompt }], SESSION_ID);
    const names = parseNames(resp);
    byCat[cat] = names;
    names.forEach(n => allNames.add(n.trim()));
    console.log(`→ ${names.length}`);
    await new Promise(r => setTimeout(r, 1500));

    // Round 2 — get more
    process.stdout.write(`  Round 2 — ${cat.padEnd(20)} `);
    const resp2 = await askAI([{ role: 'user', content: ROUND2_PROMPT(cat, names) }], SESSION_ID);
    const names2 = parseNames(resp2);
    names2.forEach(n => { allNames.add(n.trim()); byCat[cat].push(n.trim()); });
    console.log(`→ ${names2.length} more`);
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`✅ Total unique venue names: ${allNames.size}`);
  console.log(`${'═'.repeat(60)}\n`);

  Object.entries(byCat).forEach(([cat, names]) => {
    console.log(`  ${cat.padEnd(20)} ${[...new Set(names)].length}`);
  });

  const sorted = [...allNames].sort();
  writeFileSync(resolve(import.meta.dirname, 'venues_to_scrape.txt'), sorted.join('\n'));
  writeFileSync(resolve(import.meta.dirname, 'ai_knowledge_rotterdam.json'), JSON.stringify({
    city: CITY, total: sorted.length, by_category: byCat, all_names: sorted
  }, null, 2));

  console.log(`\n✓ Saved ${sorted.length} venue names to venues_to_scrape.txt`);
  console.log(`✓ Full data in ai_knowledge_rotterdam.json`);
}

main().catch(console.error);
