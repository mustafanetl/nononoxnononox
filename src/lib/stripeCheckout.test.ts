import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockInvoke } = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { startCheckout } from "./stripeCheckout";
import { toast } from "sonner";

describe("stripeCheckout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location.href
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });
  });

  it("redirects to checkout URL on success", async () => {
    mockInvoke.mockResolvedValue({
      data: { url: "https://checkout.stripe.com/session_123" },
      error: null,
    });

    await startCheckout("monthly");

    expect(mockInvoke).toHaveBeenCalledWith("create-checkout", { body: { plan: "monthly" } });
    expect(window.location.href).toBe("https://checkout.stripe.com/session_123");
  });

  it("shows error toast when edge function returns error", async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: new Error("Function timeout"),
    });

    await startCheckout("annual");

    expect(toast.error).toHaveBeenCalledWith("Failed to start checkout. Please try again.");
    expect(window.location.href).toBe("");
  });

  it("shows error toast when no URL is returned", async () => {
    mockInvoke.mockResolvedValue({
      data: { url: null },
      error: null,
    });

    await startCheckout("monthly");

    expect(toast.error).toHaveBeenCalledWith("Failed to start checkout. Please try again.");
  });

  it("handles unexpected exceptions gracefully", async () => {
    mockInvoke.mockRejectedValue(new Error("Network failure"));

    await startCheckout("annual");

    expect(toast.error).toHaveBeenCalledWith("Failed to start checkout. Please try again.");
  });
});
