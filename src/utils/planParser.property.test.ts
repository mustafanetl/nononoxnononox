import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { extractBlock, extractFencedBlocks, BLOCK_TYPES } from "./planParser";

/**
 * Property 3: Plan parser fence position validation
 *
 * For any text where a fence pattern (e.g., ```flights) appears at a position
 * NOT preceded by a newline and NOT at the start of the text, the parser SHALL
 * NOT detect that occurrence as a valid fence opening. Only fence patterns at
 * position 0 or immediately after a \n character SHALL be recognized.
 *
 * **Validates: Requirements 6.3**
 */
describe("Property 3: Plan parser fence position validation", () => {
  // Arbitrary for a block type from the supported list
  const blockTypeArb = fc.constantFrom(...BLOCK_TYPES);

  // Generate a non-newline prefix that places the fence mid-line
  const nonNewlinePrefixArb = fc
    .string({ minLength: 1, maxLength: 50 })
    .filter((s) => !s.includes("\n"));

  // Generate a simple JSON body for the fenced block
  const jsonBodyArb = fc.oneof(
    fc.array(fc.record({ id: fc.string(), name: fc.string() }), { minLength: 1, maxLength: 3 }).map(
      (arr) => JSON.stringify(arr),
    ),
    fc.record({ id: fc.string(), value: fc.integer() }).map((obj) => JSON.stringify(obj)),
  );

  it("does not recognize a fence opening that is NOT preceded by a newline and NOT at position 0", () => {
    fc.assert(
      fc.property(
        blockTypeArb,
        nonNewlinePrefixArb,
        jsonBodyArb,
        (blockType, prefix, jsonBody) => {
          // Construct text where the fence appears mid-line (preceded by non-newline chars)
          // The prefix has no newlines, so the fence is NOT at position 0 and NOT after \n
          const text = `${prefix}\`\`\`${blockType}\n${jsonBody}\n\`\`\``;

          const result = extractBlock(text, blockType);

          // The parser should NOT recognize this as a valid fence opening
          expect(result.items).toHaveLength(0);
          expect(result.ranges).toHaveLength(0);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("rejects every non-newline character class as a preceding char", () => {
    // Extra coverage using single-character prefixes across diverse Unicode
    // categories (letters, digits, punctuation, whitespace other than \n).
    const nonNewlineChar = fc
      .integer({ min: 0x20, max: 0x10ffff })
      .filter((cp) => cp !== 0x0a && cp !== 0x0d) // exclude \n, \r
      .map((cp) => String.fromCodePoint(cp));

    const itemArb = fc.record({
      id: fc.string({ maxLength: 20 }),
      name: fc.string({ maxLength: 30 }),
      price: fc.integer({ min: 0, max: 10_000 }),
    });

    fc.assert(
      fc.property(
        nonNewlineChar,
        fc.array(itemArb, { minLength: 1, maxLength: 3 }),
        (ch, items) => {
          const text = ch + "```flights\n" + JSON.stringify(items) + "\n```";
          const result = extractBlock(text, "flights");
          expect(result.items).toEqual([]);
          expect(result.ranges).toEqual([]);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("DOES recognize a fence at position 0 (control case)", () => {
    fc.assert(
      fc.property(blockTypeArb, jsonBodyArb, (blockType, jsonBody) => {
        // Fence at position 0 — should be recognized
        const text = `\`\`\`${blockType}\n${jsonBody}\n\`\`\``;

        const result = extractBlock(text, blockType);

        expect(result.items.length).toBeGreaterThan(0);
        expect(result.ranges.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it("DOES recognize a fence immediately after a newline (control case)", () => {
    fc.assert(
      fc.property(
        blockTypeArb,
        jsonBodyArb,
        fc.string({ minLength: 1, maxLength: 30 }),
        (blockType, jsonBody, preamble) => {
          // Fence after a newline — should be recognized
          const text = `${preamble}\n\`\`\`${blockType}\n${jsonBody}\n\`\`\``;

          const result = extractBlock(text, blockType);

          expect(result.items.length).toBeGreaterThan(0);
          expect(result.ranges.length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Property 1: Plan parser round-trip
 *
 * For any valid JSON value (object or array), wrapping it in a fenced code
 * block of a known type, then parsing with `extractBlock`, then re-formatting
 * the resulting items array back into a fenced block and re-parsing, SHALL
 * produce a deeply-equal items result. Additionally, the returned character
 * ranges SHALL correctly identify the block boundaries in the original text
 * (i.e., `text.slice(range[0], range[1])` contains the opening fence).
 *
 * **Validates: Requirements 6.5, 6.6**
 */
describe("Property 1: Plan parser round-trip", () => {
  const blockTypeArb = fc.constantFrom(...BLOCK_TYPES);

  // Arbitrary non-null JSON value (object or array). Top-level null is
  // excluded because `extractBlock` treats null payloads as "nothing to emit"
  // by design (see parsePartialJson), which would break the round-trip
  // invariant. Nested nulls inside arrays/objects are preserved and fine.
  // We also exclude -0 because JSON.stringify(-0) === "0", so round-tripping
  // through JSON serialization loses the sign — this is a JSON spec limitation,
  // not a parser bug.
  const jsonValueArb = fc.jsonValue({ maxDepth: 3 }).filter((v) => v !== null).map((v) => JSON.parse(JSON.stringify(v)));

  it("round-trip: wrap → extractBlock → reformat items → re-parse yields deeply-equal items, and range covers the opening fence", () => {
    fc.assert(
      fc.property(jsonValueArb, blockTypeArb, (value, type) => {
        // Step 1: wrap the JSON value in a fresh fenced block surrounded by
        // prose so the parser must locate the fence by position, not by being
        // handed the entire input.
        const body = JSON.stringify(value);
        const text = `intro prose\n\`\`\`${type}\n${body}\n\`\`\`\ntrailing prose`;

        const first = extractBlock(text, type);

        // Req 6.5: one range per block.
        expect(first.ranges).toHaveLength(1);
        const [start, end] = first.ranges[0];

        // Req 6.5: `text.slice(range[0], range[1])` contains the opening fence.
        // `start` is the index of the first backtick, so the slice begins with
        // the literal opening fence ```{type}.
        const fencedSlice = text.slice(start, end);
        expect(fencedSlice.startsWith("```" + type)).toBe(true);
        expect(fencedSlice).toContain(body);

        // Req 6.6: arrays spread into items; non-arrays are pushed as a single
        // item. Exercised here for both shapes via `jsonValueArb`.
        const expectedItems = Array.isArray(value) ? value : [value];
        expect(first.items).toEqual(expectedItems);

        // Step 2: re-format items back into a fenced block (the shape the AI
        // would emit for the parsed result) and re-parse. The round-trip
        // invariant says the second extraction must deep-equal the first.
        const reformatted = `\`\`\`${type}\n${JSON.stringify(first.items)}\n\`\`\``;
        const second = extractBlock(reformatted, type);
        expect(second.items).toEqual(first.items);
      }),
      { numRuns: 200 },
    );
  });
});
