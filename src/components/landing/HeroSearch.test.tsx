import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HeroSearch from "./HeroSearch";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("HeroSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("navigates to /chat?q= on submit with non-empty input", () => {
    render(
      <MemoryRouter>
        <HeroSearch />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/where do you want to go/i);
    fireEvent.change(input, { target: { value: "Tokyo" } });
    fireEvent.submit(input.closest("form")!);

    expect(mockNavigate).toHaveBeenCalledWith("/chat?q=Tokyo");
  });

  it("does not navigate on submit with empty input", () => {
    render(
      <MemoryRouter>
        <HeroSearch />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/where do you want to go/i);
    fireEvent.submit(input.closest("form")!);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("does not navigate on submit with whitespace-only input", () => {
    render(
      <MemoryRouter>
        <HeroSearch />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/where do you want to go/i);
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.submit(input.closest("form")!);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("encodes special characters in the query parameter", () => {
    render(
      <MemoryRouter>
        <HeroSearch />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/where do you want to go/i);
    fireEvent.change(input, { target: { value: "São Paulo & Rio" } });
    fireEvent.submit(input.closest("form")!);

    expect(mockNavigate).toHaveBeenCalledWith(
      `/chat?q=${encodeURIComponent("São Paulo & Rio")}`
    );
  });
});
