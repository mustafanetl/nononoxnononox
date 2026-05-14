import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://lidgfofsdpcezxpyhwam.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpZGdmb2ZzZHBjZXp4cHlod2FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NDI1NDcsImV4cCI6MjA5NDAxODU0N30.LNMUakqvCyzrX9DHukNUpcuQoR17zPvEJD3yDJIor6w"
);

async function check() {
  const { data } = await supabase
    .from("destination_media")
    .select("destination, type, name")
    .order("destination");

  // Group by destination
  const byDest = {};
  for (const row of data) {
    if (!byDest[row.destination]) byDest[row.destination] = { heroes: 0, activities: [], hotels: [] };
    if (row.type === "hero") byDest[row.destination].heroes++;
    if (row.type === "activity" && row.name) byDest[row.destination].activities.push(row.name);
    if (row.type === "hotel" && row.name) byDest[row.destination].hotels.push(row.name);
  }

  console.log("All destinations in the database:\n");
  for (const [dest, info] of Object.entries(byDest)) {
    const acts = [...new Set(info.activities)];
    const hotels = [...new Set(info.hotels)];
    console.log(`"${dest}" → ${info.heroes} heroes, ${acts.length} activities, ${hotels.length} hotels`);
  }
}

check();
