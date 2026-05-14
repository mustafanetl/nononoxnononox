import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://lidgfofsdpcezxpyhwam.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpZGdmb2ZzZHBjZXp4cHlod2FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NDI1NDcsImV4cCI6MjA5NDAxODU0N30.LNMUakqvCyzrX9DHukNUpcuQoR17zPvEJD3yDJIor6w"
);

async function check() {
  const { data } = await supabase
    .from("destination_media")
    .select("destination, type, name, sort_order, metadata")
    .order("destination")
    .order("type")
    .order("name");

  const byDest = {};
  for (const row of data || []) {
    if (!byDest[row.destination]) byDest[row.destination] = { heroes: 0, activities: new Set(), hotels: new Set(), rejected: 0 };
    if (row.sort_order < 0 || row.metadata?.verified === false) {
      byDest[row.destination].rejected++;
    } else if (row.type === "hero") {
      byDest[row.destination].heroes++;
    } else if (row.type === "activity" && row.name) {
      byDest[row.destination].activities.add(row.name);
    } else if (row.type === "hotel" && row.name) {
      byDest[row.destination].hotels.add(row.name);
    }
  }

  console.log(`Total destinations: ${Object.keys(byDest).length}\n`);
  for (const [dest, info] of Object.entries(byDest)) {
    console.log(`"${dest}" → ${info.heroes} heroes, ${info.activities.size} activities, ${info.hotels.size} hotels, ${info.rejected} rejected`);
  }
}

check();
