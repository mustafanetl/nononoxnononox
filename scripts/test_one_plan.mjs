import { readFileSync } from 'fs';
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

const res = await fetch(`${SUPABASE_URL}/functions/v1/rzuma-chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ANON_KEY}`,
    'apikey': ANON_KEY,
  },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Berlin to Rotterdam 5 days foodie couple October 15-20' }],
    preferences: {},
    revisionRequest: [],
  }),
});

console.log('Status:', res.status);

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

console.log('\n--- RESPONSE (first 2000 chars) ---');
console.log(fullText.slice(0, 2000));
console.log('\n--- HAS ITINERARY:', fullText.includes('```itinerary'));
console.log('--- HAS ACTIVITIES:', fullText.includes('```activities'));
