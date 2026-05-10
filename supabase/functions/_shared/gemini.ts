// Thin wrapper around Google's Gemini API for our edge functions.
// Translates OpenAI-style messages + streaming to Gemini's native format
// so we don't have to change the client.

export const GEMINI_MODEL = "gemini-2.0-flash";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type GeminiContent = {
  role: "user" | "model";
  parts: { text: string }[];
};

type GeminiRequestBody = {
  contents: GeminiContent[];
  systemInstruction?: { parts: { text: string }[] };
  generationConfig: {
    temperature: number;
    maxOutputTokens: number;
  };
  safetySettings: Array<{ category: string; threshold: string }>;
};

/**
 * Convert OpenAI-style chat messages to Gemini's `contents` + `systemInstruction`.
 * Gemini only allows ONE systemInstruction, so multiple system messages get
 * concatenated into it.
 */
export function toGeminiRequest(messages: ChatMessage[], maxTokens = 16384): GeminiRequestBody {
  const systemParts: string[] = [];
  const contents: GeminiContent[] = [];

  for (const m of messages) {
    if (m.role === "system") {
      if (m.content?.trim()) systemParts.push(m.content);
    } else {
      contents.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content || " " }],
      });
    }
  }

  // Gemini requires contents to start with a user turn.
  if (contents.length === 0 || contents[0].role === "model") {
    contents.unshift({ role: "user", parts: [{ text: " " }] });
  }

  const body: GeminiRequestBody = {
    contents,
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: maxTokens,
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
    ],
  };

  if (systemParts.length > 0) {
    body.systemInstruction = { parts: [{ text: systemParts.join("\n\n") }] };
  }

  return body;
}

/**
 * Call Gemini's streamGenerateContent endpoint and return a ReadableStream
 * of OpenAI-style SSE chunks (`data: {choices:[{delta:{content:"..."}}]}\n\n`),
 * so the existing OpenAI-compatible client stream-reader keeps working unchanged.
 */
export async function streamGemini(
  messages: ChatMessage[],
  apiKey: string,
  maxTokens = 16384,
): Promise<Response> {
  const body = toGeminiRequest(messages, maxTokens);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;

  console.log(`[gemini] calling ${GEMINI_MODEL}, contents=${body.contents.length}, systemLen=${body.systemInstruction?.parts?.[0]?.text?.length ?? 0}`);

  const upstream = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    console.error(`[gemini] ${upstream.status} ${text.slice(0, 500)}`);
    return new Response(text, { status: upstream.status });
  }

  if (!upstream.body) {
    return new Response("No response body from Gemini", { status: 500 });
  }

  // Translate Gemini SSE → OpenAI SSE on the fly, using a closure for state
  // (TransformStream `this` binding is unreliable across runtimes).
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";
  let anyContent = false;

  const translator = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });

      let newline: number;
      while ((newline = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (!jsonStr) continue;

        try {
          const obj = JSON.parse(jsonStr);

          // Extract text from the first candidate's first part.
          const parts = obj?.candidates?.[0]?.content?.parts;
          if (Array.isArray(parts)) {
            for (const part of parts) {
              const text = part?.text;
              if (typeof text === "string" && text.length > 0) {
                anyContent = true;
                const openAi =
                  "data: " +
                  JSON.stringify({ choices: [{ delta: { content: text } }] }) +
                  "\n\n";
                controller.enqueue(encoder.encode(openAi));
              }
            }
          }

          // If Gemini told us the response was blocked, surface a useful message.
          const finishReason = obj?.candidates?.[0]?.finishReason;
          if (finishReason && finishReason !== "STOP" && finishReason !== "FINISH_REASON_UNSPECIFIED") {
            console.warn(`[gemini] finishReason=${finishReason}`);
            if (!anyContent) {
              const msg = `The AI couldn't respond to that (${finishReason}). Try rephrasing.`;
              controller.enqueue(
                encoder.encode(
                  "data: " + JSON.stringify({ choices: [{ delta: { content: msg } }] }) + "\n\n",
                ),
              );
            }
          }
        } catch {
          // Put the line back — the next chunk may complete this JSON.
          buffer = line + "\n" + buffer;
          break;
        }
      }
    },
    flush(controller) {
      if (!anyContent) {
        console.warn("[gemini] stream closed with no content");
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
    },
  });

  return new Response(upstream.body.pipeThrough(translator), {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

/**
 * Call Gemini in non-streaming mode and return the full text.
 */
export async function callGemini(
  messages: ChatMessage[],
  apiKey: string,
  maxTokens = 4096,
): Promise<{ text: string; error?: string; status?: number }> {
  const body = toGeminiRequest(messages, maxTokens);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[gemini] ${res.status} ${errText.slice(0, 500)}`);
      return { text: "", error: errText, status: res.status };
    }

    const data = await res.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text || "")
        .join("") || "";
    return { text };
  } catch (e) {
    return { text: "", error: e instanceof Error ? e.message : "Unknown error", status: 500 };
  }
}
