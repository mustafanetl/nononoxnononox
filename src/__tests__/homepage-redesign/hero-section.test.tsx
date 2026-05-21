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

    const overlayElements = container.querySelectorAll('[class*="bg-black"]');
    overlayElements.forEach((el) => {
      expect(el.className).not.toMatch(/bg-black\/50/);
    });
  });

  it("navigates to /chat?q=<encoded> on form submission", () => {
    renderHero();

    const input = screen.getByPlaceholderText(/5 days in Tokyo/i);
    fireEvent.change(input, { target: { value: "Paris France" } });

    const form = input.closest("form")!;
    fireEvent.submit(form);

    expect(mockNavigate).toHaveBeenCalledWith(
      `/chat?q=${encodeURIComponent("Paris France")}`
    );
  });

  it("does not navigate when input is empty or whitespace", () => {
    renderHero();

    const input = screen.getByPlaceholderText(/5 days in Tokyo/i);
    const form = input.closest("form")!;
    fireEvent.submit(form);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("URL-encodes special characters in the query", () => {
    renderHero();

    const input = screen.getByPlaceholderText(/5 days in Tokyo/i);
    fireEvent.change(input, { target: { value: "Tokyo & Osaka" } });

    const form = input.closest("form")!;
    fireEvent.submit(form);

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

  it("renders muted text for helper content", () => {
    renderHero();

    // The "Press Enter to plan" helper text uses text-muted-foreground
    const helperText = screen.getByText(/press enter to plan/i);
    expect(helperText.className).toContain("text-muted-foreground");
  });
});
