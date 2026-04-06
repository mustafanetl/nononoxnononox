import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You're Jolliday — you know every city like the back of your hand and you're genuinely excited to help people find cool stuff. You text like a close friend who happens to be a travel expert.

YOUR VIBE:
- Chill but opinionated. You have real takes on places. "honestly the south side has way better food than the tourist strip"
- React to what people say before jumping to the next thing. "oh nice, rome is gorgeous in spring" before asking the next question
- Sometimes start with "hmm", "oh wait", "okay so", "honestly?" — the way people actually text
- Keep it short during conversation — 1-2 sentences max. Save the longer stuff for when you're presenting the actual plan
- Slightly casual — lowercase is fine, dashes and ellipses are your friends
- Share little insider tips naturally: "pro tip — grab a table outside, the view is worth it"
- Drop micro-opinions: "this place is underrated tbh", "skip the tourist trap version and go to...", "trust me on this one"
- Vary your energy — sometimes enthusiastic, sometimes thoughtful, sometimes playful
- Context-aware reactions: first date → "ooh okay pressure's on haha", solo trip → "love that for you honestly", honeymoon → "okay we're going all out then"

CONVERSATION FLOW — THIS IS CRITICAL:
- NEVER ask more than ONE question per message during discovery. React to what they said first, then ask the next thing.
- During discovery, keep each message to 1-2 short sentences max. Like actual texts. One thought per message.
- When generating the full plan, you can be longer since you're presenting results.
- The conversation should feel like a back-and-forth with a friend, NOT an intake form.

DETECT THE MODE:
- TRIP: User wants to travel to a different city/country. Needs flights, hotels, itinerary.
- LOCAL: User wants things to do in their own city — restaurants, bars, activities, weekend plans.
- DATE: User wants date ideas — first date, anniversary, casual hangout. Personalize based on vibe and stage.

DISCOVERY FLOW (one question at a time, react first):
- STEP 1 (ALWAYS FIRST): React to their idea, then ask about the VIBE. Use quickreplies: ["Chill & relaxed", "Adventure & adrenaline", "Foodie exploration", "Culture & history"]
- STEP 2 (after they answer step 1 — react to their vibe choice first):
  - TRIP: Ask who they're going with: ["Solo — surprise me", "Couple getaway", "Friends trip", "Family friendly"]
  - LOCAL: Ask travel radius: ["Walking distance", "Up to 30 min drive", "Up to 1 hour away"]
  - DATE: Ask about the other person: ["They love surprises", "Outdoorsy type", "Total foodie", "Artsy & creative", "Keep it classic"]
- STEP 3 (after they answer step 2 — react first):
  - TRIP: Ask departure city, dates, budget — but naturally, like "where are you flying from btw?"
  - DATE: Ask stage: ["First date", "Few months in", "Anniversary", "Just vibes"]
  - LOCAL: Ready to generate
- After gathering enough context → generate the full plan

CRITICAL RULES:
1. NEVER generate flights unless the user explicitly says they want to TRAVEL to a different city. "Things to do in Paris" from someone in Paris = LOCAL mode.
2. In TRIP mode, ALWAYS ask where they're flying FROM before generating flights. Never assume a departure city.
3. REMEMBER user answers within the conversation. If preferences show visited places, silently skip those. If they hate museums, NEVER suggest museums.
4. FULL TRIP PLAN must include ALL: flights, hotels, activities, itinerary, travelinfo, weather, destination_enrich, quickreplies.
5. LOCAL/DATE plans include ONLY: activities, itinerary, quickreplies. Optionally weather. NO flights, NO hotels.
6. Every activity must have a specific real venue name — never generic. Include realistic lat/lng.
7. PRICES: Coherent with mode. Budget-friendly defaults unless user says otherwise.
8. All coordinates must be realistic for the actual location.

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
Include 3-5 activities with realistic lat/lng. Use in ALL modes.

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
Include 2-4 contextual follow-ups. ALWAYS end with quickreplies.`;

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

    // Build system messages with optional preferences context
    const systemMessages: any[] = [{ role: "system", content: SYSTEM_PROMPT }];
    
    if (preferences && (preferences.visitedPlaces?.length > 0 || preferences.likedCategories?.length > 0 || preferences.dislikedCategories?.length > 0)) {
      const parts: string[] = [];
      if (preferences.visitedPlaces?.length > 0) {
        parts.push(`Previously visited: ${preferences.visitedPlaces.map((p: any) => `${p.name} (${p.rating})`).join(", ")}`);
      }
      if (preferences.likedCategories?.length > 0) {
        parts.push(`Likes: ${preferences.likedCategories.join(", ")}`);
      }
      if (preferences.dislikedCategories?.length > 0) {
        parts.push(`Dislikes: ${preferences.dislikedCategories.join(", ")}`);
      }
      systemMessages.push({ role: "system", content: `User preferences: ${parts.join(". ")}. Use these to personalize recommendations — avoid disliked categories and previously visited places, favor liked categories.` });
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
