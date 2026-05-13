import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock useAuth hook
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, loading: false, signOut: vi.fn() }),
}));

// Mock child components to keep tests focused on the header
vi.mock("@/components/HeroSection", () => ({
  default: () => <div data-testid="hero-section">HeroSection</div>,
}));
vi.mock("@/components/landing/HowItWorks", () => ({
  default: () => <div>HowItWorks</div>,
}));
vi.mock("@/components/landing/WhyJolliday", () => ({
  default: () => <div>WhyJolliday</div>,
}));
vi.mock("@/components/landing/SocialProof", () => ({
  default: () => <div>SocialProof</div>,
}));
vi.mock("@/components/landing/DestinationsMosaic", () => ({
  default: () => <div>DestinationsMosaic</div>,
}));
vi.mock("@/components/landing/HomeFAQ", () => ({
  default: () => <div>HomeFAQ</div>,
}));
vi.mock("@/components/landing/FinalCTA", () => ({
  default: () => <div>FinalCTA</div>,
}));
vi.mock("@/components/landing/MobileStickyCTA", () => ({
  default: () => <div>MobileStickyCTA</div>,
}));

import Index from "@/pages/Index";

describe("Navigation Header", () => {
  beforeEach(() => {
    Object.defineProperty(window, "scrollY", { value: 0, writable: true });
  });

  const renderIndex = () =>
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );

  describe("Scroll behavior", () => {
    it("has transparent background when scroll position is 0", () => {
      renderIndex();
      const header = screen.getByRole("banner");
      // At scroll 0, the header uses bg-white/70 with border-transparent
      expect(header.className).toContain("border-transparent");
    });

    it("has opaque background with border after scrolling past threshold", () => {
      renderIndex();
      const header = screen.getByRole("banner");

      act(() => {
        Object.defineProperty(window, "scrollY", { value: 51, writable: true });
        fireEvent.scroll(window);
      });

      // After scrolling, the header becomes more opaque with a visible border
      expect(header.className).toContain("bg-white/90");
      expect(header.className).toContain("backdrop-blur-xl");
      expect(header.className).toContain("border-border");
    });

    it("reverts to transparent border when scrolling back to top", () => {
      renderIndex();
      const header = screen.getByRole("banner");

      act(() => {
        Object.defineProperty(window, "scrollY", { value: 100, writable: true });
        fireEvent.scroll(window);
      });
      expect(header.className).toContain("border-border");

      act(() => {
        Object.defineProperty(window, "scrollY", { value: 0, writable: true });
        fireEvent.scroll(window);
      });
      expect(header.className).toContain("border-transparent");
    });
  });

  describe("CTA button and sign-in link styles", () => {
    it("renders 'Start Planning' CTA with primary background and foreground text", () => {
      renderIndex();
      const ctaButton = screen.getByRole("link", { name: /start planning/i });
      const buttonEl = ctaButton.querySelector('[class*="bg-primary"]') || ctaButton;
      expect(buttonEl.className).toContain("bg-primary");
      expect(buttonEl.className).toContain("text-primary-foreground");
    });

    it("renders 'Sign in' link with text-only styling (text-foreground)", () => {
      renderIndex();
      const signInLink = screen.getByRole("link", { name: /sign in/i });
      const buttonEl =
        signInLink.querySelector('[class*="text-foreground"]') || signInLink;
      expect(buttonEl.className).toContain("text-foreground");
      expect(buttonEl.className).not.toContain("bg-primary");
    });
  });

  describe("Header positioning", () => {
    it("is fixed at the top with z-50", () => {
      renderIndex();
      const header = screen.getByRole("banner");
      expect(header.className).toContain("fixed");
      expect(header.className).toContain("top-0");
      expect(header.className).toContain("z-50");
    });
  });
});
