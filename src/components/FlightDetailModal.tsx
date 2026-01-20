import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plane, Clock, MapPin, Calendar, DollarSign } from "lucide-react";
import { FlightData } from "./FlightCard";
import { Button } from "@/components/ui/button";

interface FlightDetailModalProps {
  flight: FlightData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const cityInfo: Record<string, { description: string; image: string }> = {
  dubai: {
    description: "Dubai is a city of superlatives—home to the world's tallest building, largest shopping malls, and most luxurious hotels. Experience stunning architecture, desert adventures, and world-class dining.",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
  },
  paris: {
    description: "The City of Light captivates with its iconic Eiffel Tower, world-renowned museums like the Louvre, charming cafés, and romantic Seine river cruises. A timeless destination for art, culture, and cuisine.",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
  },
  tokyo: {
    description: "Tokyo blends ultra-modern technology with ancient traditions. From neon-lit Shibuya to serene temples, experience cutting-edge innovation alongside centuries-old culture.",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
  },
  bali: {
    description: "Bali offers tropical paradise with stunning beaches, lush rice terraces, ancient temples, and vibrant arts scene. Perfect for relaxation, adventure, and spiritual renewal.",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
  },
  rome: {
    description: "The Eternal City is an open-air museum of ancient history—from the Colosseum to the Vatican. Savor authentic Italian cuisine and la dolce vita lifestyle.",
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80",
  },
  london: {
    description: "London combines royal heritage with modern cool. Explore historic landmarks, world-class theaters, diverse neighborhoods, and iconic pubs.",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80",
  },
  newyork: {
    description: "The city that never sleeps offers iconic skylines, Broadway shows, Central Park, and endless cultural experiences. Energy and diversity in every corner.",
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
  },
  default: {
    description: "Discover amazing destinations around the world. Each journey brings new experiences, cultures, and memories waiting to be made.",
    image: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&q=80",
  },
};

const getCityInfo = (city?: string) => {
  if (!city) return cityInfo.default;
  const key = city.toLowerCase().replace(/\s+/g, "");
  return cityInfo[key] || cityInfo.default;
};

const formatCityName = (city?: string): string => {
  if (!city) return "Destination";
  return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
};

const FlightDetailModal = ({ flight, open, onOpenChange }: FlightDetailModalProps) => {
  if (!flight) return null;

  const info = getCityInfo(flight.cityImage);
  const cityName = formatCityName(flight.cityImage);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* City Image Header */}
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src={info.image}
            alt={cityName}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {cityName}
              </DialogTitle>
            </DialogHeader>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* City Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {info.description}
          </p>

          {/* Flight Details */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Plane className="h-4 w-4" />
              Flight Details
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Airline</p>
                <p className="font-medium">{flight.airline}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Date</p>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {flight.date}
                </p>
              </div>
            </div>

            {/* Route */}
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-lg font-bold">{flight.departureTime}</p>
                <p className="text-xs text-muted-foreground uppercase">{flight.from}</p>
              </div>

              <div className="flex-1 flex flex-col items-center px-4">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{flight.duration}</span>
                </div>
                <div className="w-full flex items-center gap-2 my-1">
                  <div className="h-px flex-1 bg-border" />
                  <Plane className="h-4 w-4 text-muted-foreground" />
                  <div className="h-px flex-1 bg-border" />
                </div>
                <span className="text-xs text-muted-foreground">
                  {flight.stops === 0 ? "Direct flight" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
                </span>
              </div>

              <div className="text-center">
                <p className="text-lg font-bold">{flight.arrivalTime}</p>
                <p className="text-xs text-muted-foreground uppercase">{flight.to}</p>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Round trip from</span>
              </div>
              <span className="text-xl font-bold">
                {flight.currency}{flight.price}
              </span>
            </div>
          </div>

          <Button className="w-full" size="lg">
            Book This Flight
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FlightDetailModal;
