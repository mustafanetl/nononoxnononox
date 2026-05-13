import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { renderHook, act } from "@testing-library/react";
import { createElement } from "react";
import { TripProvider, useTripContext } from "./TripContext";

const wrapper = ({ children }: { children: React.ReactNode }) =>
  createElement(TripProvider, null, children);

/**
 * Property 5: Trip basket budget calculation
 *
 * For any arbitrary collection of flights, activities, and hotels with random
 * prices, the totalBudget SHALL equal:
 *   sum(flight.price) + sum(activity.price) + sum(hotel.pricePerNight × 3)
 *
 * **Validates: Requirements 8.4**
 */
describe("Property 5: Trip basket budget calculation", () => {
  const flightArb = fc.record({
    id: fc.uuid(),
    airline: fc.string({ minLength: 1, maxLength: 10 }),
    from: fc.string({ minLength: 3, maxLength: 3 }),
    to: fc.string({ minLength: 3, maxLength: 3 }),
    departureTime: fc.constant("10:00"),
    arrivalTime: fc.constant("14:00"),
    duration: fc.constant("4h"),
    price: fc.integer({ min: 0, max: 10000 }),
    currency: fc.constant("$"),
    stops: fc.integer({ min: 0, max: 3 }),
    date: fc.constant("2025-01-01"),
  });

  const activityArb = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 20 }),
    category: fc.constant("sightseeing"),
    price: fc.integer({ min: 0, max: 5000 }),
    currency: fc.constant("$"),
    duration: fc.constant("2h"),
    neighborhood: fc.constant("Downtown"),
  });

  const hotelArb = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 20 }),
    stars: fc.integer({ min: 1, max: 5 }),
    pricePerNight: fc.integer({ min: 0, max: 5000 }),
    currency: fc.constant("$"),
    image: fc.constant("https://example.com/img.jpg"),
    location: fc.constant("City Center"),
    description: fc.constant("A nice hotel"),
  });

  it("totalBudget equals sum(flights) + sum(activities) + sum(hotels × 3)", () => {
    fc.assert(
      fc.property(
        fc.array(flightArb, { minLength: 0, maxLength: 5 }),
        fc.array(activityArb, { minLength: 0, maxLength: 5 }),
        fc.array(hotelArb, { minLength: 0, maxLength: 3 }),
        (flights, activities, hotels) => {
          const { result } = renderHook(() => useTripContext(), { wrapper });

          // Add all items
          act(() => {
            flights.forEach((f) => result.current.addItem({ type: "flight", data: f }));
            activities.forEach((a) => result.current.addItem({ type: "activity", data: a }));
            hotels.forEach((h) => result.current.addItem({ type: "hotel", data: h }));
          });

          const expectedBudget =
            flights.reduce((sum, f) => sum + f.price, 0) +
            activities.reduce((sum, a) => sum + a.price, 0) +
            hotels.reduce((sum, h) => sum + h.pricePerNight * 3, 0);

          expect(result.current.totalBudget).toBe(expectedBudget);

          // Cleanup
          act(() => result.current.clearTrip());
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Property 6: Trip basket compare list deduplication
 *
 * For any arbitrary sequence of addToCompare calls with repeated (type, id)
 * pairs, the compareItems list SHALL contain no duplicates and its length
 * SHALL be ≤ the number of unique (type, id) pairs in the input.
 *
 * **Validates: Requirements 8.8**
 */
describe("Property 6: Trip basket compare list deduplication", () => {
  const compareItemArb = fc.oneof(
    fc.record({
      type: fc.constant("flight" as const),
      data: fc.record({
        id: fc.constantFrom("f1", "f2", "f3", "f4", "f5"),
        airline: fc.constant("TestAir"),
        from: fc.constant("JFK"),
        to: fc.constant("LAX"),
        departureTime: fc.constant("10:00"),
        arrivalTime: fc.constant("14:00"),
        duration: fc.constant("4h"),
        price: fc.integer({ min: 100, max: 1000 }),
        currency: fc.constant("$"),
        stops: fc.constant(0),
        date: fc.constant("2025-01-01"),
      }),
    }),
    fc.record({
      type: fc.constant("hotel" as const),
      data: fc.record({
        id: fc.constantFrom("h1", "h2", "h3", "h4", "h5"),
        name: fc.constant("Test Hotel"),
        stars: fc.constant(4),
        pricePerNight: fc.integer({ min: 50, max: 500 }),
        currency: fc.constant("$"),
        image: fc.constant("https://example.com/img.jpg"),
        location: fc.constant("City Center"),
        description: fc.constant("A nice hotel"),
      }),
    }),
  );

  it("no duplicates after arbitrary addToCompare sequences", () => {
    fc.assert(
      fc.property(
        fc.array(compareItemArb, { minLength: 1, maxLength: 20 }),
        (items) => {
          const { result } = renderHook(() => useTripContext(), { wrapper });

          act(() => {
            items.forEach((item) => result.current.addToCompare(item));
          });

          const compareList = result.current.compareItems;

          // Check no duplicates by (type, id)
          const seen = new Set<string>();
          for (const item of compareList) {
            const key = `${item.type}:${item.data.id}`;
            expect(seen.has(key)).toBe(false);
            seen.add(key);
          }

          // Length should be ≤ unique count from input
          const uniqueInput = new Set(items.map((i) => `${i.type}:${i.data.id}`));
          expect(compareList.length).toBeLessThanOrEqual(uniqueInput.size);

          // Cleanup
          act(() => result.current.clearCompare());
        },
      ),
      { numRuns: 100 },
    );
  });
});
