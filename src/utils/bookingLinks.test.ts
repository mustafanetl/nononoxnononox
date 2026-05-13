import { describe, it, expect } from "vitest";
import { buildSkyscannerUrl, buildBookingHotelUrl } from "./bookingLinks";

describe("buildSkyscannerUrl", () => {
  it("builds a clean one-way deep link from IATA codes and date", () => {
    const url = buildSkyscannerUrl({ from: "ARN", to: "CDG", date: "20250615" });
    expect(url).toBe("https://www.skyscanner.com/transport/flights/ARN/CDG/20250615/");
  });

  it("encodes segments with spaces and non-ASCII characters", () => {
    const url = buildSkyscannerUrl({ from: "New York", to: "São Paulo", date: "2025-07-01" });
    expect(url).toBe(
      "https://www.skyscanner.com/transport/flights/New%20York/S%C3%A3o%20Paulo/2025-07-01/"
    );
  });

  it("trims surrounding whitespace from each input", () => {
    const url = buildSkyscannerUrl({ from: "  arn  ", to: "\tcdg\n", date: " 20250101 " });
    expect(url).toBe("https://www.skyscanner.com/transport/flights/arn/cdg/20250101/");
  });

  it("falls back to the flights landing page when origin is empty", () => {
    expect(buildSkyscannerUrl({ from: "", to: "CDG", date: "20250101" })).toBe(
      "https://www.skyscanner.com/flights"
    );
  });

  it("falls back to the flights landing page when destination is empty", () => {
    expect(buildSkyscannerUrl({ from: "ARN", to: "   ", date: "20250101" })).toBe(
      "https://www.skyscanner.com/flights"
    );
  });

  it("omits the date segment when date is missing but route is valid", () => {
    expect(buildSkyscannerUrl({ from: "ARN", to: "CDG", date: "" })).toBe(
      "https://www.skyscanner.com/transport/flights/ARN/CDG/"
    );
  });
});

describe("buildBookingHotelUrl", () => {
  it("builds a searchresults URL from name and location", () => {
    const url = buildBookingHotelUrl({ name: "Hotel Central", location: "Paris" });
    expect(url).toBe("https://www.booking.com/searchresults.html?ss=Hotel+Central+Paris");
  });

  it("encodes special characters and unicode in name and location", () => {
    const url = buildBookingHotelUrl({
      name: "Café & Co",
      location: "Zürich, Switzerland",
    });
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe("https://www.booking.com/searchresults.html");
    expect(parsed.searchParams.get("ss")).toBe("Café & Co Zürich, Switzerland");
  });

  it("appends checkin and checkout when provided", () => {
    const url = buildBookingHotelUrl({
      name: "Grand",
      location: "Rome",
      checkIn: "2025-06-10",
      checkOut: "2025-06-15",
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get("ss")).toBe("Grand Rome");
    expect(parsed.searchParams.get("checkin")).toBe("2025-06-10");
    expect(parsed.searchParams.get("checkout")).toBe("2025-06-15");
  });

  it("omits check-in/check-out params when they are blank", () => {
    const url = buildBookingHotelUrl({
      name: "Grand",
      location: "Rome",
      checkIn: "   ",
      checkOut: undefined,
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.has("checkin")).toBe(false);
    expect(parsed.searchParams.has("checkout")).toBe(false);
  });

  it("falls back to the search results landing page when both name and location are empty", () => {
    expect(buildBookingHotelUrl({ name: "", location: "" })).toBe(
      "https://www.booking.com/searchresults.html"
    );
  });

  it("still builds a useful search when only location is provided", () => {
    const url = buildBookingHotelUrl({ name: "", location: "Lisbon" });
    const parsed = new URL(url);
    expect(parsed.searchParams.get("ss")).toBe("Lisbon");
  });

  it("still builds a useful search when only name is provided", () => {
    const url = buildBookingHotelUrl({ name: "Ritz", location: "" });
    const parsed = new URL(url);
    expect(parsed.searchParams.get("ss")).toBe("Ritz");
  });
});
