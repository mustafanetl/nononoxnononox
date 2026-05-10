import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HeroSection from "@/components/HeroSection";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderHero() {
  return render(
    <MemoryRouter>
      <HeroSection />
    </MemoryRouter>
  );
}

describe("HeroSection", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("does not render a dark overlay element (bg-black/50)", () => {
    const { container } = renderHero();

    // No element should have the bg-black/50 class
    const overlayElements = container.querySelectorAll('[class*="bg-black"]');
    overlayElements.forEach((el) => {
      expect(el.className).not.toMatch(/bg-black\/50/);
    });

    // Also verify there's no element with inline opacity overlay styles
    const allElements = container.querySelectorAll("*");
    allElements.forEach((el) => {
      expect(el.className).not.toContain("bg-black/50");
    });
  });

  it("navigates to /chat?q=<encoded> on form submission", () => {
    renderHero();

    const input = screen.getByPlaceholderText("Where do you want to go?");
    fireEvent.change(input, { target: { value: "Paris France" } });

    const submitButton = screen.getByRole("button", { name: /plan my trip/i });
    fireEvent.click(submitButton);

    expect(mockNavigate).toHaveBeenCalledWith(
      `/chat?q=${encodeURIComponent("Paris France")}`
    );
  });

  it("does not navigate when input is empty or whitespace", () => {
    renderHero();

    const submitButton = screen.getByRole("button", { name: /plan my trip/i });
    fireEvent.click(submitButton);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("URL-encodes special characters in the query", () => {
    renderHero();

    const input = screen.getByPlaceholderText("Where do you want to go?");
    fireEvent.change(input, { target: { value: "Tokyo & Osaka" } });

    const submitButton = screen.getByRole("button", { name: /plan my trip/i });
    fireEvent.click(submitButton);

    expect(mockNavigate).toHaveBeenCalledWith(
      `/chat?q=${encodeURIComponent("Tokyo & Osaka")}`
    );
  });

  it("renders heading with text-foreground class for dark-on-light contrast", () => {
    const { container } = renderHero();

    const heading = container.querySelector("h1");
    expect(heading).not.toBeNull();
    expect(heading!.className).toContain("text-foreground");
  });

  it("renders subheading with text-muted-foreground class for proper contrast", () => {
    renderHero();

    const subheading = screen.getByText(/tell us where you want to go/i);
    expect(subheading.className).toContain("text-muted-foreground");
  });
});
