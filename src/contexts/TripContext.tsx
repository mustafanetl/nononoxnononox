import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { FlightData } from "@/components/FlightCard";
import { ActivityData } from "@/components/ActivityCard";

export type HotelData = {
  id: string;
  name: string;
  stars: number;
  pricePerNight: number;
  currency: string;
  image: string;
  location: string;
  description: string;
};

type TripItem = 
  | { type: "flight"; data: FlightData }
  | { type: "activity"; data: ActivityData }
  | { type: "hotel"; data: HotelData };

type TripContextType = {
  items: TripItem[];
  addItem: (item: TripItem) => void;
  removeItem: (type: string, id: string) => void;
  isInTrip: (type: string, id: string) => boolean;
  clearTrip: () => void;
  totalBudget: number;
  currency: string;
};

const TripContext = createContext<TripContextType | null>(null);

export const useTripContext = () => {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTripContext must be used within TripProvider");
  return ctx;
};

const getItemId = (item: TripItem) => {
  if (item.type === "flight") return item.data.id;
  if (item.type === "activity") return item.data.id;
  return item.data.id;
};

export const TripProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<TripItem[]>([]);

  const addItem = useCallback((item: TripItem) => {
    setItems((prev) => [...prev, item]);
  }, []);

  const removeItem = useCallback((type: string, id: string) => {
    setItems((prev) => prev.filter((i) => !(i.type === type && getItemId(i) === id)));
  }, []);

  const isInTrip = useCallback((type: string, id: string) => {
    return items.some((i) => i.type === type && getItemId(i) === id);
  }, [items]);

  const clearTrip = useCallback(() => setItems([]), []);

  const totalBudget = items.reduce((sum, item) => {
    if (item.type === "flight") return sum + item.data.price;
    if (item.type === "activity") return sum + item.data.price;
    if (item.type === "hotel") return sum + item.data.pricePerNight * 3; // estimate 3 nights
    return sum;
  }, 0);

  const currency = items.length > 0
    ? (items[0].type === "flight" ? items[0].data.currency : items[0].type === "activity" ? items[0].data.currency : items[0].data.currency)
    : "$";

  return (
    <TripContext.Provider value={{ items, addItem, removeItem, isInTrip, clearTrip, totalBudget, currency }}>
      {children}
    </TripContext.Provider>
  );
};
