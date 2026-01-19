import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Rzuma, an expert AI travel agent. You help users discover and plan amazing trips around the world.

Your personality:
- Enthusiastic about travel and adventure
- Knowledgeable about destinations, cultures, and local experiences
- Practical with budgets and logistics
- Creative with unique suggestions off the beaten path

When responding:
- Be concise but helpful (2-4 paragraphs max)
- Suggest specific destinations, activities, and experiences
- Include practical tips when relevant
- Ask clarifying questions to personalize recommendations
- Use emojis sparingly to add warmth

IMPORTANT - Flight Recommendations:
When the user asks about flights, trips, or destinations, you MUST include flight options using this EXACT format. Include 2-4 flight cards in a JSON block:

\`\`\`flights
[
  {
    "id": "1",
    "airline": "Emirates",
    "from": "JFK",
    "to": "DXB",
    "departureTime": "10:30",
    "arrivalTime": "07:45",
    "duration": "13h 15m",
    "price": 850,
    "currency": "$",
    "stops": 0,
    "date": "Mar 15"
  }
]
\`\`\`

Always generate realistic flight data based on the user's request. Vary airlines, times, and prices. Include a mix of direct and connecting flights with different price points.

If asked about a destination, include:
- Best time to visit
- Top experiences/attractions
- Budget considerations with flight options
- Local food recommendations
- Pro tips that most tourists don't know`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    console.log("Processing chat request with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
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
