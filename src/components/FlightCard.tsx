import { Plane, Clock, ArrowRight } from "lucide-react";

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

interface FlightCardProps {
  flight: FlightData;
}

// City image URLs (using Unsplash for reliable images)
const cityImages: Record<string, string> = {
  dubai: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=200&fit=crop",
  paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=200&fit=crop",
  tokyo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=200&fit=crop",
  bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=200&fit=crop",
  rome: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&h=200&fit=crop",
  london: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=200&fit=crop",
  newyork: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=200&fit=crop",
  sydney: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&h=200&fit=crop",
  maldives: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&h=200&fit=crop",
  singapore: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&h=200&fit=crop",
  barcelona: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&h=200&fit=crop",
  amsterdam: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400&h=200&fit=crop",
  santorini: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=200&fit=crop",
  japan: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=200&fit=crop",
  thailand: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&h=200&fit=crop",
  hawaii: "https://images.unsplash.com/photo-1507876466758-bc54f384809c?w=400&h=200&fit=crop",
  default: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=200&fit=crop",
};

const getImageUrl = (city?: string): string => {
  if (!city) return cityImages.default;
  const key = city.toLowerCase().replace(/\s+/g, "");
  return cityImages[key] || cityImages.default;
};

const FlightCard = ({ flight }: FlightCardProps) => {
  return (
    <div className="min-w-[280px] w-[280px] bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 flex-shrink-0">
      {/* City Image */}
      <div className="relative h-24 w-full">
        <img
          src={getImageUrl(flight.cityImage)}
          alt={flight.to}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent" />
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
          <span className="text-xs font-medium text-foreground bg-card/80 backdrop-blur-sm px-2 py-1 rounded-md">
            {flight.airline}
          </span>
          <span className="text-xs text-foreground/80 bg-card/80 backdrop-blur-sm px-2 py-1 rounded-md">
            {flight.date}
          </span>
        </div>
      </div>

      <div className="p-3">
        {/* Flight Times */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-center">
            <p className="text-base font-bold text-foreground">{flight.departureTime}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{flight.from}</p>
          </div>

          <div className="flex-1 flex flex-col items-center px-2">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-2.5 w-2.5" />
              <span>{flight.duration}</span>
            </div>
            <div className="w-full flex items-center gap-1 my-1">
              <div className="h-[1px] flex-1 bg-border" />
              <Plane className="h-3 w-3 text-primary rotate-90" />
              <div className="h-[1px] flex-1 bg-border" />
            </div>
            <span className="text-[10px] text-muted-foreground">
              {flight.stops === 0 ? "Direct" : `${flight.stops} stop`}
            </span>
          </div>

          <div className="text-center">
            <p className="text-base font-bold text-foreground">{flight.arrivalTime}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{flight.to}</p>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-[10px] text-muted-foreground">Round trip</span>
          <span className="text-lg font-bold text-primary">
            {flight.currency}{flight.price}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FlightCard;
