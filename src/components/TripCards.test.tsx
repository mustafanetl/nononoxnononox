import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { createElement } from "react";
import { TripProvider } from "@/contexts/TripContext";
import FlightCard from "./FlightCard";
import HotelCard from "./HotelCard";
import ActivityCard from "./ActivityCard";

const wrapper = ({ children }: { children: React.ReactNode }) =>
  createElement(TripProvider, null, children);

const mockFlight = {
  id: "f1",
  airline: "TestAir",
  from: "JFK",
  to: "LAX",
  departureTime: "10:00",
  arrivalTime: "14:00",
  duration: "4h",
  price: 350,
  currency: "$",
  stops: 0,
  date: "2025-03-15",
};

const mockHotel = {
  id: "h1",
  name: "Grand Hotel",
  stars: 4,
  pricePerNight: 150,
  currency: "$",
  image: "https://example.com/hotel.jpg",
  location: "Downtown",
  description: "A lovely hotel",
};

const mockActivity = {
  id: "a1",
  name: "City Tour",
  category: "sightseeing",
  duration: "3h",
  price: 45,
  currency: "$",
  image: "",
  occasion: "daytime",
  description: "A guided city tour",
  neighborhood: "Old Town",
};

describe("FlightCard", () => {
  it("renders flight details correctly", () => {
    const onClick = vi.fn();
    render(
      createElement(TripProvider, null,
        createElement(FlightCard, { flight: mockFlight, onClick })
      )
    );

    expect(screen.getByText("TestAir")).toBeInTheDocument();
    expect(screen.getByText("JFK")).toBeInTheDocument();
    expect(screen.getByText("LAX")).toBeInTheDocument();
    expect(screen.getByText("10:00")).toBeInTheDocument();
    expect(screen.getByText("14:00")).toBeInTheDocument();
    expect(screen.getByText("$350")).toBeInTheDocument();
  });

  it("calls onClick when card is clicked", () => {
    const onClick = vi.fn();
    render(
      createElement(TripProvider, null,
        createElement(FlightCard, { flight: mockFlight, onClick })
      )
    );

    // Click the card container
    const card = screen.getByText("TestAir").closest("[class*='cursor-pointer']");
    if (card) fireEvent.click(card);
    expect(onClick).toHaveBeenCalled();
  });
});

describe("HotelCard", () => {
  it("renders hotel details correctly", () => {
    const onClick = vi.fn();
    render(
      createElement(TripProvider, null,
        createElement(HotelCard, { hotel: mockHotel, onClick })
      )
    );

    expect(screen.getByText("Grand Hotel")).toBeInTheDocument();
    expect(screen.getByText("Downtown")).toBeInTheDocument();
  });

  it("calls onClick when card is clicked", () => {
    const onClick = vi.fn();
    render(
      createElement(TripProvider, null,
        createElement(HotelCard, { hotel: mockHotel, onClick })
      )
    );

    const card = screen.getByText("Grand Hotel").closest("[class*='cursor-pointer']");
    if (card) fireEvent.click(card);
    expect(onClick).toHaveBeenCalled();
  });
});

describe("ActivityCard", () => {
  it("renders activity details correctly", () => {
    const onClick = vi.fn();
    render(
      createElement(TripProvider, null,
        createElement(ActivityCard, { activity: mockActivity, onClick })
      )
    );

    expect(screen.getByText("City Tour")).toBeInTheDocument();
    expect(screen.getByText("3h")).toBeInTheDocument();
    expect(screen.getByText("Old Town")).toBeInTheDocument();
  });

  it("calls onClick when card is clicked", () => {
    const onClick = vi.fn();
    render(
      createElement(TripProvider, null,
        createElement(ActivityCard, { activity: mockActivity, onClick })
      )
    );

    const card = screen.getByText("City Tour").closest("[class*='cursor-pointer']");
    if (card) fireEvent.click(card);
    expect(onClick).toHaveBeenCalled();
  });
});
