import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Rzuma, a friendly AI travel assistant. Keep responses SHORT and helpful.

Response style:
- Max 1-2 sentences of text, be direct and concise
- Never use lists or bullet points
- Sound casual, like a quick text from a friend

IMPORTANT: Always find the CHEAPEST flights first. Sort options by price (lowest first) and highlight budget-friendly deals.

When user asks about flights/trips, include flight cards using this EXACT format:

\`\`\`flights
[
  {"id":"1","airline":"Emirates","from":"JFK","to":"DXB","departureTime":"10:30","arrivalTime":"07:45","duration":"13h 15m","price":850,"currency":"$","stops":0,"date":"Mar 15","cityImage":"dubai"},
  {"id":"2","airline":"Qatar Airways","from":"JFK","to":"DXB","departureTime":"22:15","arrivalTime":"19:30","duration":"14h 15m","price":720,"currency":"$","stops":1,"date":"Mar 15","cityImage":"dubai"}
]
\`\`\`

cityImage must be ONE word describing the destination (e.g. "paris", "tokyo", "bali", "dubai", "rome"). Always include 2-3 flight options with varied prices.`;

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
