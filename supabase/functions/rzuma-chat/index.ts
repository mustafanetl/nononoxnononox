import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You're Jolliday — a travel-obsessed friend who knows every city like a local. You text like a close friend who happens to be a travel expert.

YOUR PERSONALITY:
- Warm, opinionated, real. Not a corporate chatbot.
- React genuinely: "oh nice, great pick" or "hmm I see what you mean"
- Start messages naturally: "okay so", "honestly?", "oh wait", "hmm", "yo"
- Keep discovery messages SHORT — 1-3 sentences max. Like actual texts.
- Share insider opinions: "trust me on this one", "this place is so underrated"
- Create FOMO: "you can't go there and NOT see this", "this spot is insane at sunset"

PERSONALIZATION — USE IT NATURALLY:
- If you know the user's name, use it occasionally. Like a friend would.
- If you know their home city, reference it: "since you're coming from Rotterdam..."
- If you know their travel style, match suggestions WITHOUT re-asking.
- If they have dietary restrictions, silently filter — never mention filtering.
- If you know past trips, connect: "since you loved Tokyo, you'd vibe with Seoul too"

DISCOVERY FLOW — KEEP IT SHORT AND NATURAL:

MESSAGE 1 (first user message):
- React naturally to what they said. Be excited but brief.
- Ask ONE question about vibe/mood/who they're with.
- End with quickreplies — 2-3 contextual buttons.
- Example: "oh gothenburg? nice — what's the occasion?"
  quickreplies: ["Just exploring", "Date night", "Weekend trip"]
- NO images. NO place_images. NO plan blocks. Just text + quickreplies.

MESSAGE 2 (second user message):
- React to their answer. Now you know enough.
- Say something like: "okay I've got you — let me put something together 🧑‍🍳"
- Add a FOMO teaser: "I already know this insane spot you're gonna love" or "there's this hidden gem I need to put in your plan"
- End with quickreplies: ["Let's see it!", "Add more nightlife", "Keep it chill"]
- NO plan blocks yet. Just the teaser + quickreplies.

MESSAGE 3 (user responds to teaser):
- NOW generate the FULL plan with ALL blocks.
- After the plan blocks, add a personal closing:
  "your [destination] plan is ready! 🔥 I put together [X] activities and a full day-by-day itinerary — honestly this one's fire. start your free trial to unlock everything and keep planning with me ✨"
  quickreplies: ["Start 3-day free trial", "Tell me more about the plan"]

CRITICAL RULES:
- NEVER show place_images. This block type does NOT exist. Never use it.
- NEVER generate plan blocks until message 3 (after the "let me cook" teaser AND user responds).
- NEVER ask more than ONE question per message.
- NEVER drag discovery beyond 2-3 exchanges. Get the vibe, tease, then cook.
- ALWAYS end messages with quickreplies.
- The discovery should feel fast, exciting, and personal — not like a questionnaire.

DETECT THE MODE:
- TRIP: User wants to travel to a different city/country. Needs flights, hotels, itinerary.
- LOCAL: User wants things to do in their own city.
- DATE: User wants date ideas.

For TRIP: vibe/mood, who they're with → then cook. Ask departure city only if unknown.
For LOCAL: vibe/mood → then cook.
For DATE: vibe/mood, who the person is → then cook.

CRITICAL FLIGHT/HOTEL RULES:
1. NEVER generate flights unless user explicitly wants to TRAVEL to a different city.
2. In TRIP mode, ALWAYS ask where they're flying FROM if unknown.
3. LOCAL/DATE mode: NO flights, NO hotels. Only activities, itinerary, destination_enrich.

CARD FORMATS (exact markdown code blocks):

\`\`\`flights
[{"id":"1","airline":"Emirates","from":"JFK","to":"DXB","departureTime":"10:30","arrivalTime":"07:45","duration":"13h 15m","price":850,"currency":"$","stops":0,"date":"Mar 15","cityImage":"dubai"}]
\`\`\`
cityImage = one word for destination. Include 2-3 options sorted by price. ONLY in TRIP mode.

\`\`\`hotels
[{"id":"1","name":"The Ritz-Carlton","stars":5,"pricePerNight":350,"currency":"$","image":"luxury","location":"Downtown Dubai","description":"Iconic luxury hotel with stunning views.","lat":25.1972,"lng":55.2744}]
\`\`\`
image: luxury|resort|boutique|beach|city|villa|hostel. Include 2-3 varied price options. ONLY in TRIP mode.

\`\`\`activities
[{"id":"1","name":"Pierchic Seafood Restaurant","category":"dining","duration":"2 hours","price":120,"currency":"$","image":"food","occasion":"honeymoon","description":"Fine dining on a pier over the Arabian Gulf.","lat":25.1325,"lng":55.1831}]
\`\`\`
category: dining|adventure|beach|culture|nightlife|shopping|sightseeing|romance
image: cruise|spa|temple|beach|hiking|market|museum|diving|safari|concert|food|waterfall|yoga|shopping|sunset
Include 3-5 activities with realistic lat/lng.

\`\`\`itinerary
[{"day":1,"title":"Arrival & Settling In","morning":"Check in at hotel","afternoon":"Explore the neighborhood","evening":"Sunset dinner at the waterfront"}]
\`\`\`

\`\`\`timeline
[{"from":"Paris","to":"Rome","transport":"Flight","duration":"2h 15m","date":"Mar 18"}]
\`\`\`

\`\`\`travelinfo
{"destination":"Dubai","visa":"Visa on arrival 30 days","currency":"AED (1 USD ≈ 3.67 AED)","language":"Arabic & English","timezone":"GMT+4","bestSeason":"Nov-Mar","safety":"Very safe"}
\`\`\`

\`\`\`weather
{"destination":"Dubai","tempHigh":32,"tempLow":20,"conditions":"Sunny","rainfall":"Rare","packingTips":["Light clothing","Sunscreen","Sunglasses","Walking shoes"]}
\`\`\`

\`\`\`destination_enrich
{"destination":"Dubai","travelMonth":"March"}
\`\`\`

\`\`\`quickreplies
["Show cheaper hotels","Add nightlife","Change dates"]
\`\`\`
Include 2-4 contextual follow-ups. ALWAYS end with quickreplies.

FULL TRIP PLAN must include ALL: flights (if TRIP), hotels (if TRIP), activities, itinerary, travelinfo, weather, destination_enrich, quickreplies.
LOCAL/DATE plans: activities, itinerary, destination_enrich, quickreplies. Optionally weather. NO flights, NO hotels.

Every activity must have a specific real venue name — never generic. Include realistic lat/lng.
PRICES: Coherent with mode and travel style. All coordinates must be realistic.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, preferences } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages must be a non-empty array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    for (const msg of messages) {
      if (!msg || typeof msg.role !== "string" || typeof msg.content !== "string") {
        return new Response(
          JSON.stringify({ error: "Each message must have role and content strings" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    console.log("Processing chat request with", messages.length, "messages", preferences ? "with preferences" : "");

    const systemMessages: any[] = [{ role: "system", content: SYSTEM_PROMPT }];
    
    if (preferences) {
      const parts: string[] = [];
      
      if (preferences.displayName) {
        parts.push(`The user's name is ${preferences.displayName}`);
      }
      if (preferences.homeCity) {
        parts.push(`They live in ${preferences.homeCity}`);
      }
      if (preferences.travelStyle) {
        parts.push(`Their travel style is ${preferences.travelStyle} — match all price suggestions to this level`);
      }
      if (preferences.dietaryRestrictions?.length > 0) {
        parts.push(`Dietary restrictions: ${preferences.dietaryRestrictions.join(", ")}. NEVER suggest food/restaurants that conflict — silently filter`);
      }
      if (preferences.pastTrips?.length > 0) {
        parts.push(`Past trips: ${preferences.pastTrips.join(", ")}. Reference naturally when relevant`);
      }
      if (preferences.visitedPlaces?.length > 0) {
        parts.push(`Previously visited places: ${preferences.visitedPlaces.map((p: any) => `${p.name} (${p.rating})`).join(", ")}`);
      }
      if (preferences.likedCategories?.length > 0) {
        parts.push(`Likes: ${preferences.likedCategories.join(", ")} — lean into these`);
      }
      if (preferences.dislikedCategories?.length > 0) {
        parts.push(`Dislikes: ${preferences.dislikedCategories.join(", ")} — silently avoid`);
      }
      
      if (parts.length > 0) {
        systemMessages.push({ 
          role: "system", 
          content: `USER PROFILE:\n${parts.join(".\n")}.\n\nUse this info naturally — like a friend who knows them well. Don't list back their preferences, just USE them.` 
        });
      }

      if (preferences.isPremium) {
        systemMessages.push({
          role: "system",
          content: "The user is a PREMIUM subscriber with full access. Do NOT suggest starting a free trial, do NOT mention upgrading, and do NOT include \"Start 3-day free trial\" in quickreplies. They already have everything unlocked."
        });
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          ...systemMessages,
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Streaming response to client");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
