import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://lidgfofsdpcezxpyhwam.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpZGdmb2ZzZHBjZXp4cHlod2FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NDI1NDcsImV4cCI6MjA5NDAxODU0N30.LNMUakqvCyzrX9DHukNUpcuQoR17zPvEJD3yDJIor6w"
);

async function check() {
  // Check total rows
  const { count } = await supabase.from("destination_media").select("*", { count: "exact", head: true });
  console.log(`Total rows: ${count}\n`);

  // Check Amsterdam specifically
  const { data } = await supabase
    .from("destination_media")
    .select("destination, type, name, sort_order, url")
    .eq("destination", "amsterdam")
    .order("type")
    .order("name")
    .order("sort_order");

  const heroes = data?.filter(r => r.type === "hero") || [];
  const activities = data?.filter(r => r.type === "activity") || [];
  const hotels = data?.filter(r => r.type === "hotel") || [];

  console.log(`AMSTERDAM:`);
  console.log(`  Heroes: ${heroes.length} photos`);
  console.log(`  Activities: ${activities.length} total photos`);
  console.log(`  Hotels: ${hotels.length} total photos`);

  // Show unique activity names and how many photos each has
  const actByName = {};
  for (const r of activities) {
    if (!actByName[r.name]) actByName[r.name] = 0;
    actByName[r.name]++;
  }
  console.log(`\n  Unique activities: ${Object.keys(actByName).length}`);
  console.log(`  Sample (first 5):`);
  Object.entries(actByName).slice(0, 5).forEach(([name, count]) => {
    console.log(`    "${name}" → ${count} photos`);
  });
}

check();
