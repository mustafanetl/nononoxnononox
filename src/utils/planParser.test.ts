import { describe, it, expect } from "vitest";
import { extractBlock } from "./planParser";

describe("extractBlock", () => {
  describe("each supported block type", () => {
    const blockTypes = [
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
    ] as const;

    for (const type of blockTypes) {
      it(`parses a fenced ${type} block correctly`, () => {
        const data = [{ id: "1", name: `Test ${type} item` }];
        const text = `\`\`\`${type}\n${JSON.stringify(data)}\n\`\`\``;
        const result = extractBlock(text, type);
        expect(result.items).toEqual(data);
        expect(result.ranges).toHaveLength(1);
        expect(result.ranges[0][0]).toBe(0);
        expect(result.ranges[0][1]).toBe(text.length);
      });
    }

    it("parses a flights block with realistic data", () => {
      const flights = [
        { id: "f1", airline: "KLM", from: "ARN", to: "AMS", price: 299, currency: "EUR" },
        { id: "f2", airline: "SAS", from: "ARN", to: "CDG", price: 350, currency: "EUR" },
      ];
      const text = `\`\`\`flights\n${JSON.stringify(flights)}\n\`\`\``;
      const result = extractBlock(text, "flights");
      expect(result.items).toEqual(flights);
    });

    it("parses an activities block with realistic data", () => {
      const activities = [
        { id: "a1", name: "Eiffel Tower Visit", category: "sightseeing", price: 25, duration: "2h" },
      ];
      const text = `\`\`\`activities\n${JSON.stringify(activities)}\n\`\`\``;
      const result = extractBlock(text, "activities");
      expect(result.items).toEqual(activities);
    });

    it("parses a hotels block with realistic data", () => {
      const hotels = [
        { id: "h1", name: "Grand Hotel", stars: 4, pricePerNight: 150, location: "Paris" },
      ];
      const text = `\`\`\`hotels\n${JSON.stringify(hotels)}\n\`\`\``;
      const result = extractBlock(text, "hotels");
      expect(result.items).toEqual(hotels);
    });

    it("parses an itinerary block with day structure", () => {
      const itinerary = [
        { day: 1, title: "Arrival Day", slots: [{ time: "14:00", venue: "Hotel Check-in" }] },
      ];
      const text = `\`\`\`itinerary\n${JSON.stringify(itinerary)}\n\`\`\``;
      const result = extractBlock(text, "itinerary");
      expect(result.items).toEqual(itinerary);
    });

    it("parses a travelinfo block as a single object item", () => {
      const info = { destination: "Paris", visa: "Not required", language: "French", timezone: "CET" };
      const text = `\`\`\`travelinfo\n${JSON.stringify(info)}\n\`\`\``;
      const result = extractBlock(text, "travelinfo");
      expect(result.items).toEqual([info]);
    });

    it("parses a weather block", () => {
      const weather = [{ day: "Mon", high: 22, low: 14, conditions: "Sunny" }];
      const text = `\`\`\`weather\n${JSON.stringify(weather)}\n\`\`\``;
      const result = extractBlock(text, "weather");
      expect(result.items).toEqual(weather);
    });

    it("parses a quickreplies block", () => {
      const replies = ["Tell me more", "Show hotels", "Change dates"];
      const text = `\`\`\`quickreplies\n${JSON.stringify(replies)}\n\`\`\``;
      const result = extractBlock(text, "quickreplies");
      expect(result.items).toEqual(replies);
    });

    it("parses a places block", () => {
      const places = [{ name: "Louvre Museum", lat: 48.8606, lng: 2.3376 }];
      const text = `\`\`\`places\n${JSON.stringify(places)}\n\`\`\``;
      const result = extractBlock(text, "places");
      expect(result.items).toEqual(places);
    });
  });

  describe("empty blocks", () => {
    it("returns empty items for a block with an empty array", () => {
      const text = "```flights\n[]\n```";
      const result = extractBlock(text, "flights");
      expect(result.items).toEqual([]);
      expect(result.ranges).toHaveLength(1);
    });

    it("returns empty items for a block with no content (just whitespace)", () => {
      const text = "```flights\n   \n```";
      const result = extractBlock(text, "flights");
      expect(result.items).toEqual([]);
      expect(result.ranges).toHaveLength(1);
    });

    it("returns empty items for a block with only a newline", () => {
      const text = "```hotels\n\n```";
      const result = extractBlock(text, "hotels");
      expect(result.items).toEqual([]);
      expect(result.ranges).toHaveLength(1);
    });

    it("returns empty items and empty ranges when no block of the type exists", () => {
      const text = "Here is some plain text with no fenced blocks.";
      const result = extractBlock(text, "flights");
      expect(result.items).toEqual([]);
      expect(result.ranges).toEqual([]);
    });

    it("returns empty items for a block with an empty object", () => {
      const text = "```travelinfo\n{}\n```";
      const result = extractBlock(text, "travelinfo");
      expect(result.items).toEqual([{}]);
      expect(result.ranges).toHaveLength(1);
    });
  });

  describe("mixed-prose input", () => {
    it("extracts a block surrounded by prose text", () => {
      const flights = [{ id: "f1", airline: "SAS", price: 200 }];
      const text = `Here is your trip plan!\n\nI found some great flights for you:\n\n\`\`\`flights\n${JSON.stringify(flights)}\n\`\`\`\n\nLet me know if you'd like to see hotels too.`;
      const result = extractBlock(text, "flights");
      expect(result.items).toEqual(flights);
      expect(result.ranges).toHaveLength(1);
    });

    it("extracts a block when prose contains backticks in non-fence context", () => {
      const hotels = [{ id: "h1", name: "Ritz", stars: 5 }];
      const text = `Use the \`search\` command to find more options.\n\n\`\`\`hotels\n${JSON.stringify(hotels)}\n\`\`\`\n\nThat's all!`;
      const result = extractBlock(text, "hotels");
      expect(result.items).toEqual(hotels);
    });

    it("does not match a block type that appears mid-line in prose", () => {
      const text = `Check out these activities: great stuff!\nSome text with \`\`\`activities in the middle of a line.\nMore text.`;
      const result = extractBlock(text, "activities");
      expect(result.items).toEqual([]);
      expect(result.ranges).toEqual([]);
    });

    it("extracts block at the very start of text (no preceding newline needed)", () => {
      const data = [{ id: "1" }];
      const text = `\`\`\`flights\n${JSON.stringify(data)}\n\`\`\`\n\nSome trailing prose.`;
      const result = extractBlock(text, "flights");
      expect(result.items).toEqual(data);
    });

    it("correctly identifies ranges so prose can be reconstructed", () => {
      const data = [{ id: "a1", name: "Museum" }];
      const block = `\`\`\`activities\n${JSON.stringify(data)}\n\`\`\``;
      const text = `Before text.\n\n${block}\n\nAfter text.`;
      const result = extractBlock(text, "activities");
      const [start, end] = result.ranges[0];
      const extracted = text.slice(start, end);
      expect(extracted).toContain("```activities");
      expect(extracted).toContain("```");
    });
  });

  describe("multiple blocks of same type", () => {
    it("extracts items from multiple blocks of the same type", () => {
      const flights1 = [{ id: "f1", airline: "KLM" }];
      const flights2 = [{ id: "f2", airline: "SAS" }];
      const text = `First batch:\n\`\`\`flights\n${JSON.stringify(flights1)}\n\`\`\`\n\nSecond batch:\n\`\`\`flights\n${JSON.stringify(flights2)}\n\`\`\``;
      const result = extractBlock(text, "flights");
      expect(result.items).toEqual([...flights1, ...flights2]);
      expect(result.ranges).toHaveLength(2);
    });

    it("returns separate ranges for each block", () => {
      const text = `\`\`\`hotels\n[{"id":"h1"}]\n\`\`\`\n\nMore text\n\n\`\`\`hotels\n[{"id":"h2"}]\n\`\`\``;
      const result = extractBlock(text, "hotels");
      expect(result.ranges).toHaveLength(2);
      expect(result.ranges[0][1]).toBeLessThan(result.ranges[1][0]);
    });
  });

  describe("invalid JSON returns empty items without throwing (Requirement 6.7)", () => {
    it("returns empty items for completely invalid JSON", () => {
      const text = "```flights\nthis is not json at all\n```";
      const result = extractBlock(text, "flights");
      expect(result.items).toEqual([]);
      expect(result.ranges).toHaveLength(1);
    });

    it("returns empty items for malformed JSON that cannot be repaired", () => {
      const text = "```activities\n{{{invalid\n```";
      const result = extractBlock(text, "activities");
      expect(result.items).toEqual([]);
      expect(result.ranges).toHaveLength(1);
    });

    it("does not throw on any invalid input", () => {
      const inputs = [
        "```flights\n[broken\n```",
        "```hotels\n{\"name\": undefined}\n```",
        "```itinerary\nfunction() {}\n```",
        "```weather\n<xml>not json</xml>\n```",
      ];
      for (const text of inputs) {
        const type = text.match(/```(\w+)/)?.[1] ?? "flights";
        expect(() => extractBlock(text, type)).not.toThrow();
      }
    });

    it("still extracts valid blocks when one block has invalid JSON", () => {
      const validData = [{ id: "f1" }];
      const text = `\`\`\`flights\nnot valid json\n\`\`\`\n\n\`\`\`flights\n${JSON.stringify(validData)}\n\`\`\``;
      const result = extractBlock(text, "flights");
      expect(result.items).toEqual(validData);
      expect(result.ranges).toHaveLength(2);
    });
  });
});
