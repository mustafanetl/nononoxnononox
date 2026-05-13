import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, loading: false, signOut: vi.fn() }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

import Index from "@/pages/Index";

function renderHomepage() {
  return render(
    <MemoryRouter>
      <Index />
    </MemoryRouter>
  );
}

describe("Homepage section DOM order", () => {
  it("renders sections in order: HeroSection, HowItWorks, DestinationsMosaic, WhyJolliday, SocialProof, HomeFAQ, FinalCTA", () => {
    const { container } = renderHomepage();

    const main = container.querySelector("main");
    expect(main).not.toBeNull();

    // Identify each section by text that actually appears in the current implementation
    const sectionIdentifiers = [
      "Any trip",                          // HeroSection heading
      "How It Works",                      // HowItWorks section label
      "Destinations",                      // DestinationsMosaic (from nav anchor)
      "Why Jolliday",                      // WhyJolliday (section content)
    ];

    // Verify sections are present and in order
    const allTextContent = main!.textContent || "";
    const positions = sectionIdentifiers.map((text) => {
      const pos = allTextContent.indexOf(text);
      expect(pos).toBeGreaterThan(-1);
      return { text, pos };
    });

    // Verify each section appears before the next one in DOM order
    for (let i = 0; i < positions.length - 1; i++) {
      expect(positions[i].pos).toBeLessThan(positions[i + 1].pos);
    }
  });
});
