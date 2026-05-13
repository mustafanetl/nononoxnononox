import { describe, it, expect } from "vitest";
import { generateTripSummary } from "./tripSummary";

describe("generateTripSummary", () => {
  describe("empty plan (no data)", () => {
    it("returns a sensible default summary with no sections when messages are empty", () => {
      const result = generateTripSummary([]);
      expect(result).toContain("✈️ My Trip Plan (via Jolliday)");
      expect(result).toContain("Planned with Jolliday ✨");
      expect(result).not.toContain("🛫 FLIGHTS");
      expect(result).not.toContain("🏨 HOTELS");
      expect(result).not.toContain("🎯 ACTIVITIES");
      expect(result).not.toContain("📅 ITINERARY");
    });

    it("returns a sensible default when messages contain no assistant messages", () => {
      const result = generateTripSummary([
        { role: "user", content: "Plan a trip to Paris" },
      ]);
      expect(result).toContain("✈️ My Trip Plan (via Jolliday)");
      expect(result).toContain("Planned with Jolliday ✨");
      expect(result).not.toContain("🛫 FLIGHTS");
    });

    it("returns a sensible default when assistant messages have no fenced blocks", () => {
      const result = generateTripSummary([
        { role: "assistant", content: "Here are some ideas for your trip!" },
      ]);
      expect(result).toContain("✈️ My Trip Plan (via Jolliday)");
      expect(result).not.toContain("🛫 FLIGHTS");
      expect(result).not.toContain("🏨 HOTELS");
      expect(result).not.toContain("🎯 ACTIVITIES");
      expect(result).not.toContain("📅 ITINERARY");
    });
  });

  describe("plan with only itinerary (no flights/hotels)", () => {
    it("renders only the itinerary section", () => {
      const messages = [
        {
          role: "assistant",
          content: `Here is your itinerary:
\`\`\`itinerary
[{"day":1,"title":"Arrival Day","morning":"Check in","afternoon":"Explore old town","evening":"Dinner at local restaurant"},{"day":2,"title":"Museum Day","morning":"Visit Louvre","afternoon":"Seine river walk","evening":"Eiffel Tower"}]
\`\`\``,
        },
      ];
      const result = generateTripSummary(messages);
      expect(result).toContain("📅 ITINERARY");
      expect(result).toContain("Day 1: Arrival Day");
      expect(result).toContain("Day 2: Museum Day");
      expect(result).toContain("Morning: Check in");
      expect(result).toContain("Afternoon: Explore old town");
      expect(result).toContain("Evening: Dinner at local restaurant");
      expect(result).not.toContain("🛫 FLIGHTS");
      expect(result).not.toContain("🏨 HOTELS");
      expect(result).not.toContain("🎯 ACTIVITIES");
    });
  });

  describe("plan with all data present", () => {
    it("renders all sections when flights, hotels, activities, and itinerary are present", () => {
      const messages = [
        {
          role: "assistant",
          content: `Here is your complete plan:
\`\`\`flights
[{"airline":"SAS","from":"ARN","to":"CDG","date":"2025-06-15","currency":"$","price":350}]
\`\`\`

\`\`\`hotels
[{"name":"Hotel Paris","stars":4,"location":"Central Paris","currency":"€","pricePerNight":120}]
\`\`\`

\`\`\`activities
[{"name":"Louvre Museum","duration":"3h","currency":"€","price":25}]
\`\`\`

\`\`\`itinerary
[{"day":1,"title":"Arrival","morning":"Fly in","afternoon":"Check in hotel","evening":"Walk around"}]
\`\`\``,
        },
      ];
      const result = generateTripSummary(messages);
      expect(result).toContain("🛫 FLIGHTS");
      expect(result).toContain("SAS: ARN → CDG");
      expect(result).toContain("$350");
      expect(result).toContain("🏨 HOTELS");
      expect(result).toContain("Hotel Paris (⭐⭐⭐⭐)");
      expect(result).toContain("Central Paris");
      expect(result).toContain("€120/night");
      expect(result).toContain("🎯 ACTIVITIES");
      expect(result).toContain("Louvre Museum (3h)");
      expect(result).toContain("€25");
      expect(result).toContain("📅 ITINERARY");
      expect(result).toContain("Day 1: Arrival");
    });
  });

  describe("extracting day titles when fewer than 3 days exist", () => {
    it("handles a single day itinerary", () => {
      const messages = [
        {
          role: "assistant",
          content: `\`\`\`itinerary
[{"day":1,"title":"Only Day","morning":"Explore","afternoon":"Relax","evening":"Dinner"}]
\`\`\``,
        },
      ];
      const result = generateTripSummary(messages);
      expect(result).toContain("Day 1: Only Day");
    });

    it("handles exactly 2 days", () => {
      const messages = [
        {
          role: "assistant",
          content: `\`\`\`itinerary
[{"day":1,"title":"Day One","morning":"A","afternoon":"B","evening":"C"},{"day":2,"title":"Day Two","morning":"D","afternoon":"E","evening":"F"}]
\`\`\``,
        },
      ];
      const result = generateTripSummary(messages);
      expect(result).toContain("Day 1: Day One");
      expect(result).toContain("Day 2: Day Two");
    });

    it("handles exactly 3 days", () => {
      const messages = [
        {
          role: "assistant",
          content: `\`\`\`itinerary
[{"day":1,"title":"First","morning":"A","afternoon":"B","evening":"C"},{"day":2,"title":"Second","morning":"D","afternoon":"E","evening":"F"},{"day":3,"title":"Third","morning":"G","afternoon":"H","evening":"I"}]
\`\`\``,
        },
      ];
      const result = generateTripSummary(messages);
      expect(result).toContain("Day 1: First");
      expect(result).toContain("Day 2: Second");
      expect(result).toContain("Day 3: Third");
    });

    it("handles more than 3 days (all are rendered)", () => {
      const messages = [
        {
          role: "assistant",
          content: `\`\`\`itinerary
[{"day":1,"title":"One","morning":"A","afternoon":"B","evening":"C"},{"day":2,"title":"Two","morning":"D","afternoon":"E","evening":"F"},{"day":3,"title":"Three","morning":"G","afternoon":"H","evening":"I"},{"day":4,"title":"Four","morning":"J","afternoon":"K","evening":"L"}]
\`\`\``,
        },
      ];
      const result = generateTripSummary(messages);
      expect(result).toContain("Day 1: One");
      expect(result).toContain("Day 2: Two");
      expect(result).toContain("Day 3: Three");
      expect(result).toContain("Day 4: Four");
    });
  });

  describe("aggregation across multiple messages", () => {
    it("aggregates data from multiple assistant messages", () => {
      const messages = [
        {
          role: "assistant",
          content: `\`\`\`flights
[{"airline":"KLM","from":"AMS","to":"BCN","date":"2025-07-01","currency":"€","price":200}]
\`\`\``,
        },
        {
          role: "assistant",
          content: `\`\`\`hotels
[{"name":"Beach Hotel","stars":3,"location":"Barcelona Beach","currency":"€","pricePerNight":90}]
\`\`\``,
        },
      ];
      const result = generateTripSummary(messages);
      expect(result).toContain("🛫 FLIGHTS");
      expect(result).toContain("KLM: AMS → BCN");
      expect(result).toContain("🏨 HOTELS");
      expect(result).toContain("Beach Hotel");
    });

    it("ignores user messages when aggregating", () => {
      const messages = [
        { role: "user", content: "Plan a trip" },
        {
          role: "assistant",
          content: `\`\`\`flights
[{"airline":"BA","from":"LHR","to":"JFK","date":"2025-08-01","currency":"$","price":500}]
\`\`\``,
        },
        { role: "user", content: "Add hotels" },
      ];
      const result = generateTripSummary(messages);
      expect(result).toContain("🛫 FLIGHTS");
      expect(result).toContain("BA: LHR → JFK");
      expect(result).not.toContain("🏨 HOTELS");
    });
  });
});
