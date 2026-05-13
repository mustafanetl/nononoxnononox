import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { createElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TripProvider } from "@/contexts/TripContext";
import { TooltipProvider } from "@/components/ui/tooltip";

// Mock all external dependencies
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({ user: null, loading: false, signOut: vi.fn() })),
}));

vi.mock("@/hooks/useSubscription", () => ({
  useSubscription: vi.fn(() => ({ plan: "free", isPremium: true, loading: false })),
}));

vi.mock("@/hooks/useIsAdmin", () => ({
  useIsAdmin: vi.fn(() => ({ isAdmin: false, loading: false })),
}));

vi.mock("@/hooks/useCityHeroImage", () => ({
  useCityHeroImage: vi.fn(() => ({ imageUrl: null, loading: false })),
}));

vi.mock("@/hooks/useCityImages", () => ({
  useCityImages: vi.fn(() => ({ images: [], loading: false })),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          order: () => ({ then: vi.fn().mockResolvedValue({ data: [], error: null }) }),
        }),
        order: () => ({ then: vi.fn().mockResolvedValue({ data: [], error: null }) }),
      }),
    }),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
}));

vi.mock("@/integrations/lovable/index", () => ({
  lovable: {
    auth: { signInWithOAuth: vi.fn().mockResolvedValue({ error: null }) },
  },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/utils/pdfExport", () => ({
  exportTripPDF: vi.fn(),
}));

vi.stubEnv("VITE_SUPABASE_URL", "https://test.supabase.co");
vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "test-anon-key");

// Import pages
import Index from "./Index";
import FAQ from "./FAQ";
import Terms from "./Terms";
import Privacy from "./Privacy";
import Contact from "./Contact";
import NotFound from "./NotFound";
import Auth from "./Auth";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderRoute(path: string, element: React.ReactElement) {
  return render(
    createElement(QueryClientProvider, { client: queryClient },
      createElement(TripProvider, null,
        createElement(TooltipProvider, null,
          createElement(MemoryRouter, { initialEntries: [path] },
            createElement(Routes, null,
              createElement(Route, { path, element })
            )
          )
        )
      )
    )
  );
}

describe("Route smoke tests", () => {
  it("/ renders without crashing", () => {
    const { container } = renderRoute("/", createElement(Index));
    expect(container).toBeTruthy();
  });

  it("/faq renders without crashing", () => {
    const { container } = renderRoute("/faq", createElement(FAQ));
    expect(container).toBeTruthy();
  });

  it("/terms renders without crashing", () => {
    const { container } = renderRoute("/terms", createElement(Terms));
    expect(container).toBeTruthy();
  });

  it("/privacy renders without crashing", () => {
    const { container } = renderRoute("/privacy", createElement(Privacy));
    expect(container).toBeTruthy();
  });

  it("/contact renders without crashing", () => {
    const { container } = renderRoute("/contact", createElement(Contact));
    expect(container).toBeTruthy();
  });

  it("/auth renders without crashing", () => {
    const { container } = renderRoute("/auth", createElement(Auth));
    expect(container).toBeTruthy();
  });

  it("* (NotFound) renders without crashing", () => {
    const { container } = renderRoute("/nonexistent", createElement(NotFound));
    expect(container).toBeTruthy();
  });
});
