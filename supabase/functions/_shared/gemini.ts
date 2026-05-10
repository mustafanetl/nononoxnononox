// AI provider wrapper — currently using Groq (OpenAI-compatible).
// Swap provider by changing BASE_URL and MODEL.

const BASE_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-3.1-flash-lite:free";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/**
 * Stream a chat completion from Groq (OpenAI-compatible SSE).
 * Returns a Response whose body is already in the format the client expects:
 *   data: {"choices":[{"delta":{"content":"..."}}]}\n\n
 */
export async function streamGemini(
  messages: ChatMessage[],
  apiKey: string,
  maxTokens = 16384,
): Promise<Response> {
  console.log(`[ai] calling ${MODEL} via Groq, messages=${messages.length}`);

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://jolliday.online",
      "X-Title": "Jolliday AI Trip Planner",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: true,
      max_tokens: maxTokens,
      temperature: 0.8,
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

  // Groq already returns OpenAI-compatible SSE format — pass through directly.
  return new Response(res.body, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

/**
 * Non-streaming call. Used by suggest-activity-alternatives.
 */
export async function callGemini(
  messages: ChatMessage[],
  apiKey: string,
  maxTokens = 4096,
): Promise<{ text: string; error?: string; status?: number }> {
  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://jolliday.online",
        "X-Title": "Jolliday AI Trip Planner",
      },
      body: JSON.stringify({
        model: MODEL,
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
