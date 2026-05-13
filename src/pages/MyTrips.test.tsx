import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-123", email: "test@example.com" }, loading: false, signOut: vi.fn() }),
}));

vi.mock("@/hooks/useSubscription", () => ({
  useSubscription: () => ({ plan: "free", isPremium: true, loading: false }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
        order: () => Promise.resolve({ data: [], error: null }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import MyTrips from "./MyTrips";

describe("MyTrips page", () => {
  it("renders without crashing for authenticated users", () => {
    const { container } = render(
      <MemoryRouter>
        <MyTrips />
      </MemoryRouter>
    );

    // Page renders without throwing
    expect(container).toBeTruthy();
    // Should have the Jolliday branding
    expect(container.textContent).toContain("Jolliday");
  });
});
