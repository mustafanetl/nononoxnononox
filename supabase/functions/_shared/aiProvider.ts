/**
 * AI provider wrapper.
 *
 * Currently using OpenRouter's OpenAI-compatible API. Despite the legacy
 * name "gemini" still floating around in code history, any OpenAI-style
 * chat-completions endpoint works.
 *
 * Swap provider by setting env vars — no code change required:
 *   - AI_BASE_URL   (optional) full chat-completions URL; defaults to OpenRouter
 *   - AI_MODEL      (optional) the model id; if unset, OpenRouter picks the
 *                   default configured in its dashboard for this key.
 *
 * The OPENROUTER_API_KEY, GROQ_API_KEY, and GEMINI_API_KEY env vars are
 * tried in that order — all three are passed as a bearer token to the
 * configured base URL. If you're using a Groq or Gemini key directly,
 * also set AI_BASE_URL to the matching endpoint or the call will 401.
 */

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

function resolveConfig() {
  const baseUrl = Deno.env.get("AI_BASE_URL") || DEFAULT_BASE_URL;
  const model = Deno.env.get("AI_MODEL") || "";
  return { baseUrl, model };
}

const DEFAULT_HEADERS = {
  "HTTP-Referer": "https://jolliday.online",
  "X-Title": "Jolliday AI Trip Planner",
};

/**
 * Stream a chat completion. Returns a Response whose body is OpenAI-style SSE:
 *   data: {"choices":[{"delta":{"content":"..."}}]}\n\n
 */
export async function streamChat(
  messages: ChatMessage[],
  apiKey: string,
  maxTokens = 16384,
): Promise<Response> {
  const { baseUrl, model } = resolveConfig();
  console.log(`[ai] stream ${model || "(dashboard default)"} via ${baseUrl}, messages=${messages.length}`);

  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...DEFAULT_HEADERS,
    },
    body: JSON.stringify({
      model: model || "google/gemini-2.5-flash-lite",
      messages,
      stream: true,
      max_tokens: maxTokens,
      temperature: 0.7,
      service_tier: "flex",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ai] ${res.status} ${text.slice(0, 500)}`);
    return new Response(text, { status: res.status });
  }

  if (!res.body) {
    return new Response("No response body", { status: 500 });
  }

  return new Response(res.body, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

/** Non-streaming call. Used by suggest-activity-alternatives. */
export async function callChat(
  messages: ChatMessage[],
  apiKey: string,
  maxTokens = 4096,
): Promise<{ text: string; error?: string; status?: number }> {
  const { baseUrl, model } = resolveConfig();
  try {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...DEFAULT_HEADERS,
      },
      body: JSON.stringify({
        ...(model ? { model } : {}),
        messages,
        max_tokens: maxTokens,
        temperature: 0.8,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[ai] ${res.status} ${errText.slice(0, 500)}`);
      return { text: "", error: errText, status: res.status };
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || "";
    return { text };
  } catch (e) {
    return { text: "", error: e instanceof Error ? e.message : "Unknown error", status: 500 };
  }
}

/* Legacy exports — kept so existing imports don't break. Remove in a future pass. */
export const streamGemini = streamChat;
export const callGemini = callChat;
