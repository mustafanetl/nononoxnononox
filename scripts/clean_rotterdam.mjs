/**
 * Wipe all Rotterdam data from destination_media + cached_plans + storage.
 */
const SUPABASE_URL = 'https://lidgfofsdpcezxpyhwam.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpZGdmb2ZzZHBjZXp4cHlod2FtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODQ0MjU0NywiZXhwIjoyMDk0MDE4NTQ3fQ.eeVzuR2SQ-e-1JpunqX8Eol9wVtV_arB4SJfAR2A1Ww';

const headers = {
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'apikey': SERVICE_KEY,
  'Content-Type': 'application/json',
};

async function run() {
  // 1. Delete all destination_media rows for rotterdam
  console.log('Deleting destination_media rows for rotterdam...');
  const r1 = await fetch(`${SUPABASE_URL}/rest/v1/destination_media?destination=eq.rotterdam`, {
    method: 'DELETE',
    headers: { ...headers, 'Prefer': 'return=representation' },
  });
  const deleted1 = await r1.json();
  console.log(`  Deleted ${deleted1.length} rows from destination_media`);

  // 2. Delete all cached_plans for rotterdam
  console.log('Deleting cached_plans for rotterdam...');
  const r2 = await fetch(`${SUPABASE_URL}/rest/v1/cached_plans?destination=eq.rotterdam`, {
    method: 'DELETE',
    headers: { ...headers, 'Prefer': 'return=representation' },
  });
  const deleted2 = await r2.json();
  console.log(`  Deleted ${deleted2.length} rows from cached_plans`);

  // 3. Delete storage files under venues/rotterdam/
  console.log('Deleting storage files under venues/rotterdam/...');
  // List all files in the folder
  const r3 = await fetch(`${SUPABASE_URL}/storage/v1/object/list/destination-media`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ prefix: 'venues/rotterdam/', limit: 10000 }),
  });
  const files = await r3.json();
  console.log(`  Found ${files.length} files in storage`);

  if (files.length > 0) {
    // Delete in batches of 100
    const paths = files.map(f => `venues/rotterdam/${f.name}`);
    for (let i = 0; i < paths.length; i += 100) {
      const batch = paths.slice(i, i + 100);
      await fetch(`${SUPABASE_URL}/storage/v1/object/destination-media`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ prefixes: batch }),
      });
      console.log(`  Deleted batch ${Math.floor(i/100)+1} (${batch.length} files)`);
    }
  }

  console.log('\nDone! Rotterdam is clean.');
}

run().catch(console.error);
