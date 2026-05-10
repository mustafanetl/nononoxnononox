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
    // Reset scroll position
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
      expect(header.className).toContain("bg-transparent");
      expect(header.className).not.toContain("bg-white/80");
      expect(header.className).not.toContain("border-b");
    });

    it("has white/80 background with border after scrolling past 50px", () => {
      renderIndex();
      const header = screen.getByRole("banner");

      // Simulate scrolling past 50px
      act(() => {
        Object.defineProperty(window, "scrollY", { value: 51, writable: true });
        fireEvent.scroll(window);
      });

      expect(header.className).toContain("bg-white/80");
      expect(header.className).toContain("backdrop-blur-md");
      expect(header.className).toContain("border-b");
      expect(header.className).toContain("border-border");
      expect(header.className).not.toContain("bg-transparent");
    });

    it("reverts to transparent background when scrolling back to top", () => {
      renderIndex();
      const header = screen.getByRole("banner");

      // Scroll down
      act(() => {
        Object.defineProperty(window, "scrollY", { value: 100, writable: true });
        fireEvent.scroll(window);
      });
      expect(header.className).toContain("bg-white/80");

      // Scroll back to top
      act(() => {
        Object.defineProperty(window, "scrollY", { value: 0, writable: true });
        fireEvent.scroll(window);
      });
      expect(header.className).toContain("bg-transparent");
      expect(header.className).not.toContain("bg-white/80");
    });
  });

  describe("CTA button and sign-in link styles", () => {
    it("renders 'Start Planning' CTA with primary background and foreground text", () => {
      renderIndex();
      const ctaButton = screen.getByRole("link", { name: /start planning/i });
      const button = ctaButton.querySelector("button") || ctaButton.firstElementChild;
      // The Link wraps a Button - check the button inside
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
      // Should not have a filled background (ghost variant)
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
