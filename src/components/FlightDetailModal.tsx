import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plane, Clock, MapPin, Calendar, ArrowRight, ExternalLink, PlusCircle, CheckCircle } from "lucide-react";
import { FlightData } from "./FlightCard";
import { Button } from "@/components/ui/button";
import { useTripContext } from "@/contexts/TripContext";

const cityInfo: Record<string, { description: string; image: string }> = {
  dubai: {
    description: "Dubai is a city of superlatives—home to the world's tallest building, largest shopping malls, and most luxurious hotels.",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
  },
  paris: {
    description: "The City of Light captivates with its iconic Eiffel Tower, world-renowned museums, and romantic Seine river cruises.",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
  },
  tokyo: {
    description: "Tokyo blends ultra-modern technology with ancient traditions. Experience cutting-edge innovation alongside centuries-old culture.",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
  },
  bali: {
    description: "Bali offers tropical paradise with stunning beaches, lush rice terraces, ancient temples, and vibrant arts scene.",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
  },
  rome: {
    description: "The Eternal City is an open-air museum of ancient history—from the Colosseum to the Vatican.",
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80",
  },
  london: {
    description: "London combines royal heritage with modern cool. Explore historic landmarks, world-class theaters, and diverse neighborhoods.",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80",
  },
  newyork: {
    description: "The city that never sleeps offers iconic skylines, Broadway shows, Central Park, and endless cultural experiences.",
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
  },
  sydney: {
    description: "Sydney dazzles with its harbor, Opera House, and beautiful beaches. A vibrant city blending culture and nature.",
    image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80",
  },
  maldives: {
    description: "Crystal clear waters, overwater bungalows, and pristine beaches make the Maldives a paradise for relaxation.",
    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80",
  },
  singapore: {
    description: "A futuristic city-state where tradition meets innovation, with stunning gardens and world-class cuisine.",
    image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80",
  },
  barcelona: {
    description: "Barcelona enchants with Gaudí's architecture, Mediterranean beaches, and a vibrant food and nightlife scene.",
    image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80",
  },
  default: {
    description: "Discover amazing destinations around the world. Each journey brings new experiences and memories.",
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

const airportData: Record<string, { city: string; skyscannerCode: string }> = {
  JFK: { city: "New York", skyscannerCode: "JFK" },
  LAX: { city: "Los Angeles", skyscannerCode: "LAX" },
  DXB: { city: "Dubai", skyscannerCode: "DXB" },
  CDG: { city: "Paris", skyscannerCode: "CDG" },
  LHR: { city: "London", skyscannerCode: "LHR" },
  NRT: { city: "Tokyo", skyscannerCode: "NRT" },
  HND: { city: "Tokyo", skyscannerCode: "HND" },
  FCO: { city: "Rome", skyscannerCode: "FCO" },
  SYD: { city: "Sydney", skyscannerCode: "SYD" },
  SIN: { city: "Singapore", skyscannerCode: "SIN" },
  DPS: { city: "Bali", skyscannerCode: "DPS" },
  BCN: { city: "Barcelona", skyscannerCode: "BCN" },
  MLE: { city: "Maldives", skyscannerCode: "MLE" },
  AMS: { city: "Amsterdam", skyscannerCode: "AMS" },
  ORD: { city: "Chicago", skyscannerCode: "ORD" },
  SFO: { city: "San Francisco", skyscannerCode: "SFO" },
  MIA: { city: "Miami", skyscannerCode: "MIA" },
  BKK: { city: "Bangkok", skyscannerCode: "BKK" },
  IST: { city: "Istanbul", skyscannerCode: "IST" },
  DOH: { city: "Doha", skyscannerCode: "DOH" },
  AUH: { city: "Abu Dhabi", skyscannerCode: "AUH" },
  FRA: { city: "Frankfurt", skyscannerCode: "FRA" },
  MAD: { city: "Madrid", skyscannerCode: "MAD" },
  DEL: { city: "Delhi", skyscannerCode: "DEL" },
  BOM: { city: "Mumbai", skyscannerCode: "BOM" },
  HKG: { city: "Hong Kong", skyscannerCode: "HKG" },
  ICN: { city: "Seoul", skyscannerCode: "ICN" },
  YYZ: { city: "Toronto", skyscannerCode: "YYZ" },
  MEL: { city: "Melbourne", skyscannerCode: "MEL" },
  ZRH: { city: "Zurich", skyscannerCode: "ZRH" },
};

const getFullCityName = (code: string): string => {
  return airportData[code]?.city || code;
};

const generateSkyscannerUrl = (flight: FlightData): string => {
  const parseDate = (dateStr: string): string => {
    const months: Record<string, string> = {
      jan: "01", january: "01", feb: "02", february: "02", mar: "03", march: "03",
      apr: "04", april: "04", may: "05", jun: "06", june: "06", jul: "07", july: "07",
      aug: "08", august: "08", sep: "09", september: "09", oct: "10", october: "10",
      nov: "11", november: "11", dec: "12", december: "12",
    };
    const parts = dateStr.toLowerCase().trim().split(/\s+/);
    const monthStr = parts[0];
    const day = parts[1]?.padStart(2, "0") || "15";
    const month = months[monthStr] || months[monthStr.slice(0, 3)] || "01";
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const flightMonth = parseInt(month);
    const year = flightMonth < currentMonth ? currentYear + 1 : currentYear;
    return `${year}${month}${day}`;
  };

  const fromCode = airportData[flight.from]?.skyscannerCode || flight.from;
  const toCode = airportData[flight.to]?.skyscannerCode || flight.to;
  const outboundDate = parseDate(flight.date);
  const outDate = new Date(parseInt(outboundDate.slice(0, 4)), parseInt(outboundDate.slice(4, 6)) - 1, parseInt(outboundDate.slice(6, 8)));
  outDate.setDate(outDate.getDate() + 7);
  const returnDate = `${outDate.getFullYear()}${String(outDate.getMonth() + 1).padStart(2, "0")}${String(outDate.getDate()).padStart(2, "0")}`;
  return `https://www.skyscanner.com/transport/flights/${fromCode}/${toCode}/${outboundDate}/${returnDate}/?adultsv2=1&cabinclass=economy&childrenv2=&ref=home&rtn=1&preferdirects=false`;
};

interface FlightDetailModalProps {
  flight: FlightData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FlightDetailModal = ({ flight, open, onOpenChange }: FlightDetailModalProps) => {
  const { addItem, removeItem, isInTrip } = useTripContext();

  if (!flight) return null;

  const info = getCityInfo(flight.cityImage);
  const cityName = formatCityName(flight.cityImage);
  const fromCity = getFullCityName(flight.from);
  const toCity = getFullCityName(flight.to);
  const skyscannerUrl = generateSkyscannerUrl(flight);
  const inTrip = isInTrip("flight", flight.id);

  const toggleTrip = () => {
    if (inTrip) removeItem("flight", flight.id);
    else addItem({ type: "flight", data: flight });
  };

  const handleBookClick = () => {
    window.open(skyscannerUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div className="relative h-44 w-full overflow-hidden">
          <img src={info.image} alt={cityName} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {cityName}
              </DialogTitle>
            </DialogHeader>
            <p className="text-white/80 text-sm mt-1 line-clamp-2">{info.description}</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <Plane className="h-4 w-4" />
              </div>
              <span className="font-medium">{flight.airline}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{flight.date}</span>
            </div>
          </div>

          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-foreground" />
              <span className="text-xs font-medium uppercase tracking-wide">Outbound</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-xl font-bold">{flight.departureTime}</p>
                <p className="text-xs text-muted-foreground font-medium">{flight.from}</p>
                <p className="text-xs text-muted-foreground">{fromCity}</p>
              </div>
              <div className="flex-1 flex flex-col items-center px-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Clock className="h-3 w-3" />
                  <span>{flight.duration}</span>
                </div>
                <div className="w-full flex items-center gap-1">
                  <div className="h-px flex-1 bg-border" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div className="h-px flex-1 bg-border" />
                </div>
                <span className="text-[10px] text-muted-foreground mt-1">
                  {flight.stops === 0 ? "Direct" : `${flight.stops} stop`}
                </span>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{flight.arrivalTime}</p>
                <p className="text-xs text-muted-foreground font-medium">{flight.to}</p>
                <p className="text-xs text-muted-foreground">{toCity}</p>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-muted-foreground" />
              <span className="text-xs font-medium uppercase tracking-wide">Return</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-xl font-bold">{flight.arrivalTime}</p>
                <p className="text-xs text-muted-foreground font-medium">{flight.to}</p>
                <p className="text-xs text-muted-foreground">{toCity}</p>
              </div>
              <div className="flex-1 flex flex-col items-center px-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Clock className="h-3 w-3" />
                  <span>{flight.duration}</span>
                </div>
                <div className="w-full flex items-center gap-1">
                  <div className="h-px flex-1 bg-border" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div className="h-px flex-1 bg-border" />
                </div>
                <span className="text-[10px] text-muted-foreground mt-1">
                  {flight.stops === 0 ? "Direct" : `${flight.stops} stop`}
                </span>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{flight.departureTime}</p>
                <p className="text-xs text-muted-foreground font-medium">{flight.from}</p>
                <p className="text-xs text-muted-foreground">{fromCity}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xs text-muted-foreground">Round trip total</p>
              <p className="text-2xl font-bold">{flight.currency}{flight.price}</p>
            </div>
            <div className="flex gap-2">
              <Button variant={inTrip ? "secondary" : "outline"} size="lg" className="gap-2" onClick={toggleTrip}>
                {inTrip ? <CheckCircle className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                {inTrip ? "Added" : "Add"}
              </Button>
              <Button size="lg" className="px-6 gap-2" onClick={handleBookClick}>
                Book
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FlightDetailModal;
