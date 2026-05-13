import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
  },
}));

vi.mock("@/integrations/lovable/index", () => ({
  lovable: {
    auth: {
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import Auth from "./Auth";

describe("Auth page", () => {
  it("renders sign in form by default", () => {
    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    );

    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("switches to sign up form", () => {
    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Sign up"));
    expect(screen.getByRole("heading", { name: "Create account" })).toBeInTheDocument();
    expect(screen.getByLabelText("Display name")).toBeInTheDocument();
  });

  it("shows Google and Apple OAuth buttons", () => {
    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    );

    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
    expect(screen.getByText("Continue with Apple")).toBeInTheDocument();
  });

  it("requires email field", () => {
    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText("Email");
    expect(emailInput).toHaveAttribute("required");
    expect(emailInput).toHaveAttribute("type", "email");
  });

  it("requires password with minimum length", () => {
    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    );

    const passwordInput = screen.getByLabelText("Password");
    expect(passwordInput).toHaveAttribute("required");
    expect(passwordInput).toHaveAttribute("type", "password");
  });
});
