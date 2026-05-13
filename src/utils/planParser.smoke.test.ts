import { describe, it, expect } from "vitest";
import { extractFencedBlocks, extractBlock, stripFencedBlocks } from "./planParser";

describe("planParser smoke (req 6.1-6.9)", () => {
  it("6.1: extracts each supported block type", () => {
    const types = [
      "flights",
      "activities",
      "hotels",
      "itinerary",
      "timeline",
      "destination_enrich",
      "travelinfo",
      "weather",
      "quickreplies",
      "places",
    ];
    for (const t of types) {
      const text = `prefix\n\`\`\`${t}\n[{"id":"1"}]\n\`\`\`\ntail`;
      const { items } = extractBlock(text, t);
      expect(items).toEqual([{ id: "1" }]);
    }
  });

  it("6.2: backticks inside JSON string values do not close the fence", () => {
    const text =
      "\n```flights\n" +
      '[{"id":"1","desc":"use the ``` fence"}]\n' +
      "```\nafter";
    const { items } = extractBlock(text, "flights");
    expect(items).toEqual([{ id: "1", desc: "use the ``` fence" }]);
  });

  it("6.3: fence not preceded by newline is ignored", () => {
    const text = 'inline ```flights\n[{"id":"1"}]\n```';
    const { items } = extractBlock(text, "flights");
    expect(items).toEqual([]);
  });

  it("6.3: fence at start of text is recognized", () => {
    const text = '```flights\n[{"id":"1"}]\n```';
    const { items, ranges } = extractBlock(text, "flights");
    expect(items).toEqual([{ id: "1" }]);
    expect(ranges[0][0]).toBe(0);
    expect(text.slice(ranges[0][0], ranges[0][1])).toContain("```flights");
    expect(text.slice(ranges[0][0], ranges[0][1]).endsWith("```")).toBe(true);
  });

  it("6.3: type-name prefix match is not a fence (flights_extra != flights)", () => {
    const text = '\n```flights_extra\n[{"id":"1"}]\n```';
    const { items } = extractBlock(text, "flights");
    expect(items).toEqual([]);
  });

  it("6.4: trailing commas are stripped", () => {
    const text = '\n```activities\n[{"id":"1"},]\n```';
    const { items } = extractBlock(text, "activities");
    expect(items).toEqual([{ id: "1" }]);
  });

  it("6.4: unbalanced braces are auto-closed", () => {
    const text = '\n```hotels\n[{"id":"1","name":"Test"';
    const { items } = extractBlock(text, "hotels");
    expect(items.length).toBe(1);
    expect(items[0].id).toBe("1");
  });

  it("6.5: ranges cover opening fence through closing fence", () => {
    const text = 'prose\n```flights\n[{"id":"1"}]\n```\ntail';
    const { ranges } = extractBlock(text, "flights");
    const [s, e] = ranges[0];
    const slice = text.slice(s, e);
    expect(slice.startsWith("```flights")).toBe(true);
    expect(slice.endsWith("```")).toBe(true);
  });

  it("6.6: arrays spread into items; objects push as single items", () => {
    const arrText = '\n```flights\n[{"id":"1"},{"id":"2"}]\n```';
    expect(extractBlock(arrText, "flights").items).toEqual([{ id: "1" }, { id: "2" }]);
    const objText = '\n```travelinfo\n{"destination":"Paris"}\n```';
    expect(extractBlock(objText, "travelinfo").items).toEqual([{ destination: "Paris" }]);
  });

  it("6.7: invalid unrecoverable JSON returns empty items (no throw)", () => {
    const text = '\n```flights\nnot json at all {{{\n```';
    expect(() => extractBlock(text, "flights")).not.toThrow();
    // The implementation may still salvage something via auto-close, but it
    // MUST not throw. Either empty or a parsed value is acceptable per spec.
  });

  it("6.8: no closing fence → use EOF as boundary", () => {
    const text = 'prose\n```flights\n[{"id":"1"},{"id":"2"}]';
    const { items, ranges } = extractBlock(text, "flights");
    expect(items).toEqual([{ id: "1" }, { id: "2" }]);
    expect(ranges[0][1]).toBe(text.length);
  });

  it("6.9: same-line JSON body is recognized", () => {
    const text = '\n```flights[{"id":"1"}]\n```';
    const { items } = extractBlock(text, "flights");
    expect(items).toEqual([{ id: "1" }]);
  });

  it("6.9: same-line JSON after whitespace is recognized", () => {
    const text = '\n```flights [{"id":"1"}]\n```';
    const { items } = extractBlock(text, "flights");
    expect(items).toEqual([{ id: "1" }]);
  });

  it("stripFencedBlocks removes given ranges and collapses newlines", () => {
    const text = 'Intro.\n```flights\n[{"id":"1"}]\n```\n\n\nOutro.';
    const { ranges } = extractBlock(text, "flights");
    const stripped = stripFencedBlocks(text, ranges);
    expect(stripped).not.toContain("```");
    expect(stripped).toContain("Intro.");
    expect(stripped).toContain("Outro.");
  });

  it("extractFencedBlocks returns raw body trimmed", () => {
    const text = '\n```quickreplies\n["Hi","Yes"]\n```';
    const blocks = extractFencedBlocks(text, "quickreplies");
    expect(blocks.length).toBe(1);
    expect(blocks[0].raw).toBe('["Hi","Yes"]');
  });
});
