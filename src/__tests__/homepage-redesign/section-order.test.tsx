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

    // Get all direct child sections within <main>
    const sections = main!.querySelectorAll(":scope > section, :scope > div > section");

    // Identify each section by its unique heading text
    const sectionIdentifiers = [
      "Plan your next trip in seconds",   // HeroSection
      "How it works",                      // HowItWorks
      "Popular destinations",              // DestinationsMosaic
      "Everything you need in one place",  // WhyJolliday
      "Loved by travellers",              // SocialProof
      "Frequently asked questions",        // HomeFAQ
      "Ready to plan your next trip?",     // FinalCTA
    ];

    // Verify all sections are present and find their positions in the DOM
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
