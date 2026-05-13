import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { extractBlock, BLOCK_TYPES } from "./planParser";

/**
 * Property 2: Plan parser backtick resilience in JSON strings
 *
 * For any JSON value that contains embedded backtick sequences (1, 2, or 3+
 * backticks) inside string values, the parser SHALL extract the block without
 * premature closure. The backticks inside JSON strings must not be mistaken
 * for a closing fence.
 *
 * **Validates: Requirements 6.2**
 */
describe("Property 2: Plan parser backtick resilience in JSON strings", () => {
  const blockTypeArb = fc.constantFrom(...BLOCK_TYPES);

  // Generate strings that contain various backtick patterns
  const backtickStringArb = fc.oneof(
    // Single backtick
    fc.string({ minLength: 0, maxLength: 20 }).map((s) => s.replace(/"/g, "'") + "`" + s.replace(/"/g, "'")),
    // Double backtick
    fc.string({ minLength: 0, maxLength: 20 }).map((s) => s.replace(/"/g, "'") + "``" + s.replace(/"/g, "'")),
    // Triple+ backtick (the dangerous case)
    fc.string({ minLength: 0, maxLength: 15 }).map((s) => s.replace(/"/g, "'") + "```" + s.replace(/"/g, "'")),
    fc.string({ minLength: 0, maxLength: 15 }).map((s) => s.replace(/"/g, "'") + "````" + s.replace(/"/g, "'")),
  );

  it("extracts blocks correctly when JSON string values contain backticks", () => {
    fc.assert(
      fc.property(blockTypeArb, backtickStringArb, fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/["\\\n\r]/g, "x")), (type, backtickVal, id) => {
        // Build a JSON array with a string value containing backticks
        const item = { id, description: backtickVal };
        const body = JSON.stringify([item]);
        const text = `\n\`\`\`${type}\n${body}\n\`\`\`\n`;

        const result = extractBlock(text, type);

        // The parser should successfully extract the item without premature closure
        expect(result.items.length).toBe(1);
        expect(result.items[0].id).toBe(id);
        expect(result.items[0].description).toBe(backtickVal);
      }),
      { numRuns: 200 },
    );
  });

  it("handles multiple items with backticks in various positions", () => {
    fc.assert(
      fc.property(
        blockTypeArb,
        fc.array(backtickStringArb, { minLength: 1, maxLength: 4 }),
        (type, backtickVals) => {
          const items = backtickVals.map((val, i) => ({ id: `item-${i}`, value: val }));
          const body = JSON.stringify(items);
          const text = `some prose\n\`\`\`${type}\n${body}\n\`\`\`\nmore prose`;

          const result = extractBlock(text, type);

          expect(result.items).toHaveLength(items.length);
          for (let i = 0; i < items.length; i++) {
            expect(result.items[i].id).toBe(items[i].id);
            expect(result.items[i].value).toBe(items[i].value);
          }
        },
      ),
      { numRuns: 150 },
    );
  });
});

/**
 * Property 4: Plan parser streaming tolerance
 *
 * For any valid JSON array, truncating it at a random offset SHALL cause the
 * parser to return either a valid partial result (some items) or an empty
 * items array — it SHALL never throw.
 *
 * **Validates: Requirements 6.4, 6.7**
 */
describe("Property 4: Plan parser streaming tolerance", () => {
  const blockTypeArb = fc.constantFrom(...BLOCK_TYPES);

  const itemArb = fc.record({
    id: fc.string({ minLength: 1, maxLength: 10 }).map(s => s.replace(/["\\\n\r]/g, "a")),
    name: fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/["\\\n\r]/g, "b")),
    price: fc.integer({ min: 0, max: 9999 }),
  });

  it("never throws when JSON is truncated at arbitrary offsets", () => {
    fc.assert(
      fc.property(
        blockTypeArb,
        fc.array(itemArb, { minLength: 1, maxLength: 5 }),
        fc.integer({ min: 5, max: 95 }).map(n => n / 100),
        (type, items, truncFraction) => {
          const fullBody = JSON.stringify(items);
          const truncOffset = Math.floor(fullBody.length * truncFraction);
          const truncatedBody = fullBody.slice(0, truncOffset);

          // Simulate streaming: no closing fence
          const text = `\n\`\`\`${type}\n${truncatedBody}`;

          // Must not throw
          const result = extractBlock(text, type);

          // Result is either empty or contains valid partial items
          expect(Array.isArray(result.items)).toBe(true);
          expect(Array.isArray(result.ranges)).toBe(true);

          // Each item that was parsed should be an object
          for (const item of result.items) {
            expect(typeof item).toBe("object");
          }
        },
      ),
      { numRuns: 300 },
    );
  });

  it("returns valid partial items when truncated mid-array", () => {
    fc.assert(
      fc.property(
        blockTypeArb,
        fc.array(itemArb, { minLength: 2, maxLength: 6 }),
        fc.integer({ min: 1, max: 5 }),
        (type, items, keepCount) => {
          const fullBody = JSON.stringify(items);
          // Truncate after the Nth complete item (find the Nth `}`)
          const actualKeep = Math.min(keepCount, items.length - 1);
          let braceCount = 0;
          let cutIdx = 0;
          for (let i = 0; i < fullBody.length; i++) {
            if (fullBody[i] === "}") {
              braceCount++;
              if (braceCount === actualKeep) {
                cutIdx = i + 1;
                break;
              }
            }
          }
          if (cutIdx === 0) return; // skip if we couldn't find enough braces

          // Add a trailing comma to simulate streaming mid-array
          const truncated = fullBody.slice(0, cutIdx) + ",";
          const text = `\n\`\`\`${type}\n${truncated}`;

          const result = extractBlock(text, type);

          // Should parse at least some items without throwing
          expect(Array.isArray(result.items)).toBe(true);
          // The partial result should have items <= original count
          expect(result.items.length).toBeLessThanOrEqual(items.length);
        },
      ),
      { numRuns: 150 },
    );
  });
});
