/**
 * NUKE everything — destination_media, cached_plans, and ALL storage files.
 */
const SUPABASE_URL = 'https://lidgfofsdpcezxpyhwam.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpZGdmb2ZzZHBjZXp4cHlod2FtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODQ0MjU0NywiZXhwIjoyMDk0MDE4NTQ3fQ.eeVzuR2SQ-e-1JpunqX8Eol9wVtV_arB4SJfAR2A1Ww';
const headers = {
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'apikey': SERVICE_KEY,
  'Content-Type': 'application/json',
};

async function run() {
  console.log('=== NUKING ALL DATA ===\n');

  // 1. Delete ALL rows from destination_media (use neq filter on a non-null column)
  console.log('1. Deleting ALL destination_media...');
  const r1 = await fetch(`${SUPABASE_URL}/rest/v1/destination_media?destination=neq.ZZZZZ`, {
    method: 'DELETE',
    headers: { ...headers, 'Prefer': 'return=representation' },
  });
  const d1 = await r1.json();
  console.log(`   Deleted ${Array.isArray(d1) ? d1.length : 0} rows`);

  // 2. Delete ALL cached_plans
  console.log('2. Deleting ALL cached_plans...');
  const r2 = await fetch(`${SUPABASE_URL}/rest/v1/cached_plans?destination=neq.ZZZZZ`, {
    method: 'DELETE',
    headers: { ...headers, 'Prefer': 'return=representation' },
  });
  const d2 = await r2.json();
  console.log(`   Deleted ${Array.isArray(d2) ? d2.length : 0} rows`);

  // 3. Delete ALL storage files
  console.log('3. Deleting ALL storage...');
  const r3 = await fetch(`${SUPABASE_URL}/storage/v1/object/list/destination-media`, {
    method: 'POST', headers,
    body: JSON.stringify({ prefix: 'venues/', limit: 100 }),
  });
  const folders = await r3.json();
  let total = 0;
  if (Array.isArray(folders)) {
    for (const folder of folders) {
      if (!folder.name) continue;
      // List files in this city folder
      const r = await fetch(`${SUPABASE_URL}/storage/v1/object/list/destination-media`, {
        method: 'POST', headers,
        body: JSON.stringify({ prefix: `venues/${folder.name}/`, limit: 10000 }),
      });
      const files = await r.json();
      if (!Array.isArray(files) || files.length === 0) continue;
      const paths = files.map(f => `venues/${folder.name}/${f.name}`);
      for (let i = 0; i < paths.length; i += 100) {
        await fetch(`${SUPABASE_URL}/storage/v1/object/destination-media`, {
          method: 'DELETE', headers,
          body: JSON.stringify({ prefixes: paths.slice(i, i + 100) }),
        });
      }
      console.log(`   Deleted ${paths.length} files from venues/${folder.name}/`);
      total += paths.length;
    }
  }
  console.log(`   Total: ${total} files\n`);

  // 4. Verify empty
  const check = await fetch(`${SUPABASE_URL}/rest/v1/destination_media?select=id&limit=1`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  const remaining = await check.json();
  console.log(`Verification: ${remaining.length} rows remaining in destination_media`);
  console.log('=== DONE ===');
}

run().catch(console.error);
