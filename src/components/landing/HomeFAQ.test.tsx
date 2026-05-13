import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HomeFAQ from "./HomeFAQ";

describe("HomeFAQ", () => {
  it("renders FAQ section with questions", () => {
    render(<HomeFAQ />);
    expect(screen.getByText(/Is Jolliday free to use/i)).toBeInTheDocument();
  });

  it("expands an accordion item on click", () => {
    render(<HomeFAQ />);

    const trigger = screen.getByText(/Is Jolliday free to use/i);
    fireEvent.click(trigger);

    // After clicking, the answer should be visible
    expect(screen.getByText(/3-day free trial/i)).toBeInTheDocument();
  });

  it("all items are collapsed by default", () => {
    render(<HomeFAQ />);

    // Answers should not be visible initially (they're in collapsed state)
    const triggers = screen.getAllByRole("button");
    expect(triggers.length).toBeGreaterThan(0);

    // Check that accordion items have data-state="closed"
    triggers.forEach((trigger) => {
      expect(trigger.closest("[data-state]")?.getAttribute("data-state")).toBe("closed");
    });
  });
});
