import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: "test-jwt" } }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
}));

vi.stubEnv("VITE_SUPABASE_URL", "https://test.supabase.co");
vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "test-anon-key");

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock crypto.randomUUID
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => "test-uuid-" + Math.random().toString(36).slice(2, 10) },
});

import { renderHook, act } from "@testing-library/react";
import { useRzumaChat } from "./useRzumaChat";

function createMockSSEResponse(tokens: string[], includeQA = false) {
  const lines = tokens.map((t) =>
    `data: ${JSON.stringify({ choices: [{ delta: { content: t } }] })}\n\n`
  );
  lines.push("data: [DONE]\n\n");
  const body = lines.join("");

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(body));
      controller.close();
    },
  });

  return new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream" } });
}

describe("useRzumaChat integration", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("sendMessage toggles isLoading and produces assistant content", async () => {
    const tokens = ["Hello", " world", "!"];
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(createMockSSEResponse(tokens));

    const { result } = renderHook(() => useRzumaChat());

    expect(result.current.isLoading).toBe(false);

    await act(async () => {
      await result.current.sendMessage("Hi there");
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.messages.length).toBeGreaterThanOrEqual(2);

    const assistantMsg = result.current.messages.find((m) => m.role === "assistant");
    expect(assistantMsg?.content).toBe("Hello world!");
  });

  it("preserves user input on fetch failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useRzumaChat());

    await act(async () => {
      await result.current.sendMessage("Plan a trip to Paris");
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeTruthy();
    // The user message should still be in the conversation
    const userMsg = result.current.messages.find((m) => m.role === "user");
    expect(userMsg?.content).toBe("Plan a trip to Paris");
  });

  it("QA enrichment swaps content when approved", async () => {
    const planContent = "Here is your plan\n```activities\n[{\"id\":\"a1\",\"name\":\"Museum\"}]\n```";
    const enrichedContent = "Here is your plan\n```activities\n[{\"id\":\"a1\",\"name\":\"Museum\",\"lat\":48.86}]\n```";

    // First call: SSE stream
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(createMockSSEResponse([planContent]))
      // Second call: QA review
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ approved: true, enrichedPlan: enrichedContent }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

    const { result } = renderHook(() => useRzumaChat());

    await act(async () => {
      await result.current.sendMessage("Plan a trip");
    });

    const assistantMsg = result.current.messages.find((m) => m.role === "assistant");
    expect(assistantMsg?.content).toBe(enrichedContent);
  });

  it("creates a new conversation on first message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(createMockSSEResponse(["OK"]));

    const { result } = renderHook(() => useRzumaChat());

    expect(result.current.conversations).toHaveLength(0);

    await act(async () => {
      await result.current.sendMessage("Hello");
    });

    expect(result.current.conversations.length).toBeGreaterThanOrEqual(1);
    expect(result.current.activeId).toBeTruthy();
  });
});
