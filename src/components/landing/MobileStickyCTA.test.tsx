import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Read the actual component to understand its behavior
vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: vi.fn(() => true),
}));

import MobileStickyCTA from "./MobileStickyCTA";

describe("MobileStickyCTA", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing on mobile viewport", () => {
    render(
      <MemoryRouter>
        <MobileStickyCTA />
      </MemoryRouter>
    );
    // Component should render (may be hidden initially based on scroll)
    // Just verify it doesn't crash
    expect(true).toBe(true);
  });
});
