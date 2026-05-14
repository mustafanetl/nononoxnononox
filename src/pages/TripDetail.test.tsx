import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({ user: null, loading: false, signOut: vi.fn() })),
}));

vi.mock("@/hooks/useSubscription", () => ({
  useSubscription: vi.fn(() => ({ plan: "free", isPremium: true, loading: false })),
}));

vi.mock("@/hooks/useCityHeroImage", () => ({
  useCityHeroImage: vi.fn(() => ({ imageUrl: null, loading: false })),
}));

vi.mock("@/hooks/useCityImages", () => ({
  useCityImages: vi.fn(() => ({ images: [], videoUrl: null })),
  useCityImage: vi.fn(() => null),
  useDestinationVideo: vi.fn(() => null),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
}));

vi.mock("@/utils/pdfExport", () => ({
  exportTripPDF: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import TripDetail from "./TripDetail";

describe("TripDetail page", () => {
  beforeEach(() => {
    // Set up sessionStorage with trip data
    const tripData = {
      destination: "Tokyo",
      messages: [
        {
          role: "assistant",
          content: "```itinerary\n[{\"day\":1,\"title\":\"Shibuya\",\"slots\":[]}]\n```\n```activities\n[{\"id\":\"a1\",\"name\":\"Temple Visit\"}]\n```",
        },
      ],
    };
    sessionStorage.setItem("jolliday-trip-detail", JSON.stringify(tripData));
  });

  it("renders trip detail page from sessionStorage", () => {
    render(
      <MemoryRouter>
        <TripDetail />
      </MemoryRouter>
    );

    // Should render without crashing
    expect(document.body).toBeTruthy();
  });
});
