import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Parse an HSL string like "234 62% 47%" into { h, s, l } */
function parseHSL(value: string): { h: number; s: number; l: number } {
  const parts = value.trim().split(/\s+/);
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]);
  const l = parseFloat(parts[2]);
  return { h, s, l };
}

/** Convert HSL (h: 0-360, s: 0-100, l: 0-100) to linear RGB (0-1) */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r1: number, g1: number, b1: number;

  if (h < 60) {
    [r1, g1, b1] = [c, x, 0];
  } else if (h < 120) {
    [r1, g1, b1] = [x, c, 0];
  } else if (h < 180) {
    [r1, g1, b1] = [0, c, x];
  } else if (h < 240) {
    [r1, g1, b1] = [0, x, c];
  } else if (h < 300) {
    [r1, g1, b1] = [x, 0, c];
  } else {
    [r1, g1, b1] = [c, 0, x];
  }

  return [r1 + m, g1 + m, b1 + m];
}

/** Compute relative luminance per WCAG 2.1 from linear RGB (0-1) */
function relativeLuminance(r: number, g: number, b: number): number {
  const linearize = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const R = linearize(r);
  const G = linearize(g);
  const B = linearize(b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/** Compute WCAG contrast ratio between two relative luminance values */
function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Get relative luminance from an HSL string like "0 0% 100%" */
function luminanceFromHSL(hslStr: string): number {
  const { h, s, l } = parseHSL(hslStr);
  const [r, g, b] = hslToRgb(h, s, l);
  return relativeLuminance(r, g, b);
}

// ─── Read and parse CSS variables from index.css ────────────────────────────

const cssContent = readFileSync(
  resolve(__dirname, "../../index.css"),
  "utf-8"
);

function getCSSVariable(name: string): string {
  const regex = new RegExp(`--${name}:\\s*([^;]+);`);
  const match = cssContent.match(regex);
  if (!match) {
    throw new Error(`CSS variable --${name} not found in index.css`);
  }
  return match[1].trim();
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("Light theme CSS variables", () => {
  it("--background has lightness >= 98%", () => {
    const { l } = parseHSL(getCSSVariable("background"));
    expect(l).toBeGreaterThanOrEqual(98);
  });

  it("--foreground has lightness <= 10%", () => {
    const { l } = parseHSL(getCSSVariable("foreground"));
    expect(l).toBeLessThanOrEqual(10);
  });

  it("foreground/background contrast ratio >= 4.5:1", () => {
    const bgLuminance = luminanceFromHSL(getCSSVariable("background"));
    const fgLuminance = luminanceFromHSL(getCSSVariable("foreground"));
    const ratio = contrastRatio(bgLuminance, fgLuminance);

    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("--primary achieves 4.5:1 contrast on white", () => {
    const whiteLuminance = relativeLuminance(1, 1, 1); // #FFFFFF
    const primaryLuminance = luminanceFromHSL(getCSSVariable("primary"));
    const ratio = contrastRatio(whiteLuminance, primaryLuminance);

    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
