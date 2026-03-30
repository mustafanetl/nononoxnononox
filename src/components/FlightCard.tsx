import { Plane, Clock, GitCompare } from "lucide-react";
import { useTripContext } from "@/contexts/TripContext";

export interface FlightData {
  id: string;
  airline: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  currency: string;
  stops: number;
  date: string;
  cityImage?: string;
}

// FlightCardProps moved below after formatCityName

import { getCityImage } from "@/utils/cityImages";

const getImageUrl = (city?: string): string => {
  return getCityImage(city || "default", 400, 200);
};

interface FlightCardProps {
  flight: FlightData;
  onClick?: () => void;
}

const formatCityName = (city?: string): string => {
  if (!city) return "";
  return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
};

const FlightCard = ({ flight, onClick }: FlightCardProps) => {
  const { addToCompare, removeFromCompare, isInCompare } = useTripContext();
  const comparing = isInCompare("flight", flight.id);

  const toggleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (comparing) removeFromCompare("flight", flight.id);
    else addToCompare({ type: "flight", data: flight });
  };

  return (
    <div 
      onClick={onClick}
      className="min-w-[260px] w-[260px] bg-card border border-border rounded-xl overflow-hidden hover:border-foreground/20 hover:shadow-lg transition-all duration-200 flex-shrink-0 cursor-pointer relative"
    >
      {/* City Image */}
      <div className="relative h-24 w-full">
        <img
          src={getImageUrl(flight.cityImage)}
          alt={flight.to}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-base font-bold text-white">
            {formatCityName(flight.cityImage)}
          </p>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-xs text-white/90">
              {flight.airline}
            </span>
            <span className="text-xs text-white/80">
              {flight.date}
            </span>
          </div>
        </div>
      </div>

      <div className="p-3">
        {/* Flight Times */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-center">
            <p className="text-sm font-semibold">{flight.departureTime}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{flight.from}</p>
          </div>

          <div className="flex-1 flex flex-col items-center px-2">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-2.5 w-2.5" />
              <span>{flight.duration}</span>
            </div>
            <div className="w-full flex items-center gap-1 my-1">
              <div className="h-px flex-1 bg-border" />
              <Plane className="h-3 w-3 text-muted-foreground" />
              <div className="h-px flex-1 bg-border" />
            </div>
            <span className="text-[10px] text-muted-foreground">
              {flight.stops === 0 ? "Direct" : `${flight.stops} stop`}
            </span>
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold">{flight.arrivalTime}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{flight.to}</p>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <button onClick={toggleCompare} className={`p-1 rounded-md transition-colors ${comparing ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}>
            <GitCompare className="h-3 w-3" />
          </button>
          <span className="text-base font-bold">
            {flight.currency}{flight.price}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FlightCard;
