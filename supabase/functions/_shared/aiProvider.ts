/**
 * AI provider — OpenRouter with google/gemini-2.5-flash.
 */

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";
const DEFAULT_MAX_TOKENS = 16000;

const DEFAULT_HEADERS = {
  "HTTP-Referer": "https://jolliday.online",
  "X-Title": "Jolliday AI Trip Planner",
};

/**
 * Stream a chat completion via OpenRouter.
 */
export async function streamChat(
  messages: ChatMessage[],
  apiKey: string,
  maxTokens = DEFAULT_MAX_TOKENS,
): Promise<Response> {
  console.log(`[ai] stream ${MODEL} via OpenRouter, messages=${messages.length}, maxTokens=${maxTokens}`);

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...DEFAULT_HEADERS,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: true,
      max_tokens: maxTokens,
      temperature: 0.7,
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
  maxTokens = DEFAULT_MAX_TOKENS,
): Promise<{ text: string; error?: string; status?: number }> {
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...DEFAULT_HEADERS,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
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

/* Legacy exports */
export const streamGemini = streamChat;
export const callGemini = callChat;
