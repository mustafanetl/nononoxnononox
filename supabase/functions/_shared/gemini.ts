// Thin wrapper around Google's Gemini API for our edge functions.
// Translates OpenAI-style messages + streaming to Gemini's native format
// so we don't have to change the client.

// Swap models here if you want to upgrade. Flash = fast + cheap, good for chat.
export const GEMINI_MODEL = "gemini-2.0-flash";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/**
 * Convert OpenAI-style chat messages to Gemini's `contents` + `systemInstruction`.
 * Gemini only allows ONE systemInstruction, so multiple system messages get
 * concatenated into it.
 */
export function toGeminiRequest(messages: ChatMessage[], maxTokens = 16384) {
  const systemParts: string[] = [];
  const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];

  for (const m of messages) {
    if (m.role === "system") {
      systemParts.push(m.content);
    } else {
      contents.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      });
    }
  }

  // Gemini requires contents to start with a user turn.
  // If we somehow start with a model turn (shouldn't happen), prepend an empty user.
  if (contents.length > 0 && contents[0].role === "model") {
    contents.unshift({ role: "user", parts: [{ text: " " }] });
  }

  return {
    body: {
      contents,
      ...(systemParts.length > 0 && {
        systemInstruction: { parts: [{ text: systemParts.join("\n\n") }] },
      }),
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: maxTokens,
        // Block none — we need full control over refusals via system prompt.
        // Gemini's default safety settings occasionally flag travel content
        // (e.g. "nightlife", "date night") as inappropriate.
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
      ],
    },
  };
}

/**
 * Call Gemini's streamGenerateContent endpoint and return a ReadableStream
 * of OpenAI-style SSE chunks (`data: {choices:[{delta:{content:"..."}}]}\n`),
 * so the existing client stream-reader keeps working unchanged.
 */
export async function streamGemini(
  messages: ChatMessage[],
  apiKey: string,
  maxTokens = 16384,
): Promise<Response> {
  const { body } = toGeminiRequest(messages, maxTokens);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const upstream = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!upstream.ok) {
    // Bubble up the error with a useful status so callers can translate it.
    const text = await upstream.text();
    return new Response(text, { status: upstream.status });
  }

  if (!upstream.body) {
    return new Response("No response body from Gemini", { status: 500 });
  }

  // Translate Gemini SSE → OpenAI SSE on the fly.
  // Gemini format:   data: {"candidates":[{"content":{"parts":[{"text":"..."}]}}]}
  // OpenAI format:   data: {"choices":[{"delta":{"content":"..."}}]}
  const translator = new TransformStream<Uint8Array, Uint8Array>({
    start() {
      // @ts-ignore - attaching state on the instance
      this.buffer = "";
      // @ts-ignore
      this.encoder = new TextEncoder();
      // @ts-ignore
      this.decoder = new TextDecoder();
    },
    transform(chunk, controller) {
      // @ts-ignore
      this.buffer += this.decoder.decode(chunk, { stream: true });

      let newline: number;
      // @ts-ignore
      while ((newline = this.buffer.indexOf("\n")) !== -1) {
        // @ts-ignore
        let line = this.buffer.slice(0, newline);
        // @ts-ignore
        this.buffer = this.buffer.slice(newline + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (!jsonStr) continue;

        try {
          const obj = JSON.parse(jsonStr);
          const text = obj?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (typeof text === "string" && text.length > 0) {
            const openAiChunk =
              "data: " +
              JSON.stringify({
                choices: [{ delta: { content: text } }],
              }) +
              "\n\n";
            // @ts-ignore
            controller.enqueue(this.encoder.encode(openAiChunk));
          }
          const finish = obj?.candidates?.[0]?.finishReason;
          if (finish && finish !== "FINISH_REASON_UNSPECIFIED") {
            // Signal done — matches OpenAI's [DONE] sentinel.
            // @ts-ignore
            controller.enqueue(this.encoder.encode("data: [DONE]\n\n"));
          }
        } catch {
          // Malformed chunk (partial JSON mid-stream). Put the line back so
          // the next chunk can complete it.
          // @ts-ignore
          this.buffer = line + "\n" + this.buffer;
          break;
        }
      }
    },
    flush(controller) {
      // Ensure [DONE] is emitted even if Gemini closes without a finishReason chunk.
      // @ts-ignore
      controller.enqueue(this.encoder.encode("data: [DONE]\n\n"));
    },
  });

  return new Response(upstream.body.pipeThrough(translator), {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

/**
 * Call Gemini in non-streaming mode and return the full text.
 * Used by endpoints like suggest-activity-alternatives that want one JSON blob.
 */
export async function callGemini(
  messages: ChatMessage[],
  apiKey: string,
  maxTokens = 4096,
): Promise<{ text: string; error?: string; status?: number }> {
  const { body } = toGeminiRequest(messages, maxTokens);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
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
