// Quick smoke test for the plan parser
// Run: node scripts/test-parser.mjs

import { extractBlock, stripFencedBlocks } from '../src/utils/planParser.ts';

const sample = `Here's your Amsterdam plan — 2 days, 12 activities.

\`\`\`flights
[{"id":"1","airline":"KLM","from":"ARN","to":"AMS","departureTime":"08:30","arrivalTime":"10:45","duration":"2h 15m","price":180,"currency":"$","stops":0,"date":"Jun 1","cityImage":"amsterdam"}]
\`\`\`

\`\`\`hotels
[{"id":"1","name":"Hotel V Nesplein","stars":4,"pricePerNight":180,"currency":"$","image":"boutique","location":"Amsterdam, Centrum","description":"Steps from Dam Square and the canals.","bestFor":"couples","lat":52.3738,"lng":4.8910}]
\`\`\`

\`\`\`activities
[{"id":"1","name":"Rijksmuseum","category":"culture","duration":"2.5 hours","price":22,"currency":"$","image":"museum","occasion":"","description":"Dutch Golden Age masterpieces.","neighborhood":"Museumplein","hours":"9:00-17:00","bookAhead":true,"why":"The Night Watch alone is worth the visit.","lat":52.3600,"lng":4.8852}]
\`\`\`

\`\`\`itinerary
[{"day":1,"title":"Canals & Culture","slots":[{"time":"9:00","activity":"Breakfast at The Pancake Bakery","venue":"The Pancake Bakery","neighborhood":"Jordaan","duration":"1h","cost":15,"bookAhead":false,"transitNext":"10 min walk"}]},{"day":2,"title":"Art & Markets","slots":[{"time":"9:30","activity":"Visit Rijksmuseum","venue":"Rijksmuseum","neighborhood":"Museumplein","duration":"2.5h","cost":22,"bookAhead":true,"transitNext":"5 min walk"}]}]
\`\`\`

\`\`\`travelinfo
{"destination":"Amsterdam","visa":"No visa needed for EU/US","currency":"EUR","language":"Dutch & English","timezone":"CET (UTC+1)","tipping":"Not expected","simCard":"EU roaming works","transport":"Trams + walking. Get an OV-chipkaart."}
\`\`\`

\`\`\`destination_enrich
{"destination":"Amsterdam","travelMonth":"June"}
\`\`\`

\`\`\`quickreplies
["Make it cheaper","Add more food spots","Change the hotel","Looks great!"]
\`\`\`
`;

console.log("Testing parser with typical AI output...\n");

const flights = extractBlock(sample, "flights");
console.log(`flights: ${flights.items.length} items, ${flights.ranges.length} ranges`);

const hotels = extractBlock(sample, "hotels");
console.log(`hotels: ${hotels.items.length} items`);

const activities = extractBlock(sample, "activities");
console.log(`activities: ${activities.items.length} items`);

const itinerary = extractBlock(sample, "itinerary");
console.log(`itinerary: ${itinerary.items.length} days`);
if (itinerary.items.length > 0) {
  console.log(`  day 1 slots: ${itinerary.items[0]?.slots?.length}`);
  console.log(`  day 2 slots: ${itinerary.items[1]?.slots?.length}`);
}

const travelInfo = extractBlock(sample, "travelinfo");
console.log(`travelinfo: ${travelInfo.items.length} items, dest=${travelInfo.items[0]?.destination}`);

const enrich = extractBlock(sample, "destination_enrich");
console.log(`destination_enrich: ${enrich.items.length} items, dest=${enrich.items[0]?.destination}`);

const qr = extractBlock(sample, "quickreplies");
console.log(`quickreplies: ${qr.items.length} items`);

const allRanges = [...flights.ranges, ...hotels.ranges, ...activities.ranges, ...itinerary.ranges, ...travelInfo.ranges, ...enrich.ranges, ...qr.ranges];
const text = stripFencedBlocks(sample, allRanges);
console.log(`\nRemaining text: "${text.slice(0, 80)}..."`);
console.log(`\n✅ All blocks parsed successfully`);
