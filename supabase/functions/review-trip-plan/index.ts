import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REVIEWER_PROMPT = `You are AI2, a strict travel-plan QA reviewer. Another AI (AI1) just produced a trip plan. Your job is to find any problems with it BEFORE the user sees it.

CHECK FOR THESE SPECIFIC PROBLEMS:

1. INVENTED VENUES — Any restaurant, bar, museum, hotel, or attraction that does NOT actually exist in the destination city. If you're unsure whether a venue is real, assume it's invented and flag it. Famous landmarks (Eiffel Tower, Hagia Sophia, Colosseum etc.) are fine.

2. WRONG COORDINATES — Any lat/lng that:
   - Is missing
   - Is 0,0 or near 0,0
   - Is geographically NOT in the destination city (e.g. lat/lng in Tokyo when destination is Paris)
   - Doesn't match the stated neighborhood

3. GEOGRAPHIC INCOHERENCE — Same-day itinerary slots that are absurdly far apart (e.g. >20km between consecutive slots in a city). Days must cluster geographically.

4. MODE VIOLATIONS:
   - TRIP plan with no flights or no hotels block
   - LOCAL/DATE plan that includes flights or hotels (those should NOT be there)

5. HOTEL PROBLEMS — Hotel names that don't sound like real hotels in that city, or famous chain names placed in wrong locations.

6. DUPLICATES — Same activity/venue appearing more than once across days.

7. TRAVELINFO MISMATCH — Currency code, timezone, or visa info that doesn't match the country.

WHAT YOU DO NOT CHECK:
- Writing style, tone, opinions, "why" descriptions, prices (these are fine as approximations).
- Whether the plan matches the user's exact preferences.
- Image fields, quickreplies, ID fields.

YOU MUST CALL EXACTLY ONE TOOL:
- approve_plan() if the plan passes all checks.
- request_revision({issues}) if ANY problem exists. Each issue must be specific and actionable, e.g.:
  - "Activity 'Café Lumière' in Lisbon — this venue does not exist. Replace with a real Lisbon café."
  - "Hotel 'Sakura Boutique Tokyo' has lat 48.8566 (Paris coords). Fix coordinates or replace hotel."
  - "Day 2 itinerary: 9:00 slot is in Shibuya, 10:30 slot is in Asakusa (10km apart) — re-cluster."

Be strict. If in doubt, request revision. The user expects every place to be real.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.planText !== "string" || !body.planText.trim()) {
      return new Response(
        JSON.stringify({ error: "planText (string) is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { planText, destinationHint } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY missing");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userMsg = `Destination context: ${destinationHint || "(infer from plan)"}\n\nPLAN TO REVIEW:\n\n${planText}`;

    const tools = [
      {
        type: "function",
        function: {
          name: "approve_plan",
          description: "Approve the plan — no problems found.",
          parameters: { type: "object", properties: {}, additionalProperties: false },
        },
      },
      {
        type: "function",
        function: {
          name: "request_revision",
          description: "Reject the plan and list specific, actionable issues for AI1 to fix.",
          parameters: {
            type: "object",
            properties: {
              issues: {
                type: "array",
                description: "Specific problems found. Each item must name the offending venue/field and what to fix.",
                items: { type: "string" },
                minItems: 1,
              },
            },
            required: ["issues"],
            additionalProperties: false,
          },
        },
      },
    ];

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: REVIEWER_PROMPT },
          { role: "user", content: userMsg },
        ],
        tools,
        tool_choice: "required",
      }),
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("Reviewer AI error", aiResp.status, txt);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ approved: true, issues: [], skipped: "rate_limited" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ approved: true, issues: [], skipped: "credits" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Fail-open: don't block users on reviewer outage
      return new Response(JSON.stringify({ approved: true, issues: [], skipped: "reviewer_error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.warn("Reviewer returned no tool call, fail-open");
      return new Response(JSON.stringify({ approved: true, issues: [], skipped: "no_tool_call" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (toolCall.function?.name === "approve_plan") {
      return new Response(JSON.stringify({ approved: true, issues: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let issues: string[] = [];
    try {
      const parsed = JSON.parse(toolCall.function?.arguments || "{}");
      if (Array.isArray(parsed.issues)) issues = parsed.issues.filter((s: any) => typeof s === "string" && s.trim()).slice(0, 12);
    } catch (e) {
      console.warn("Could not parse revision args", e);
    }

    if (issues.length === 0) {
      return new Response(JSON.stringify({ approved: true, issues: [], skipped: "empty_issues" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ approved: false, issues }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("review-trip-plan crash", e);
    // Fail-open
    return new Response(JSON.stringify({ approved: true, issues: [], skipped: "exception" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
