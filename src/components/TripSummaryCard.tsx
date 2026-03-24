import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plane, Hotel, Sparkles, MapPin, ArrowRight, Crown } from "lucide-react";
import { FlightData } from "@/components/FlightCard";
import { HotelData } from "@/contexts/TripContext";
import { ActivityData } from "@/components/ActivityCard";
import { ItineraryData } from "@/components/ItineraryCard";
import { WeatherData } from "@/components/WeatherCard";
import { TravelInfoData } from "@/components/TravelInfoCard";
import { TimelineLeg } from "@/components/TripTimeline";
import { useSubscription } from "@/hooks/useSubscription";
import PaywallModal from "@/components/PaywallModal";

const cityImages: Record<string, string> = {
  dubai: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&h=300&fit=crop",
  paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=300&fit=crop",
  tokyo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=300&fit=crop",
  bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=300&fit=crop",
  rome: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&h=300&fit=crop",
  london: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=300&fit=crop",
  maldives: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600&h=300&fit=crop",
  singapore: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&h=300&fit=crop",
  barcelona: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&h=300&fit=crop",
  santorini: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&h=300&fit=crop",
  default: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=300&fit=crop",
};

export type TripPlanData = {
  flights: FlightData[];
  hotels: HotelData[];
  activities: ActivityData[];
  itinerary: ItineraryData[];
  timeline: TimelineLeg[];
  travelInfo: TravelInfoData | null;
  weather: WeatherData | null;
  quickReplies: string[];
  text: string;
};

const getDestinationImage = (destination: string) => {
  const key = destination.toLowerCase().replace(/[^a-z]/g, "");
  return cityImages[key] || cityImages.default;
};

const TripSummaryCard = ({ data, destination }: { data: TripPlanData; destination: string }) => {
  const navigate = useNavigate();
  const { isPremium } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);

  const handleClick = () => {
    if (!isPremium) {
      setShowPaywall(true);
      return;
    }
    sessionStorage.setItem("rzuma-trip-detail", JSON.stringify({ data, destination }));
    navigate("/trip/view");
  };

  const occasion = data.activities[0]?.occasion;
  const days = data.itinerary.length;

  return (
    <>
      <div
        onClick={handleClick}
        className="mt-4 w-full max-w-sm rounded-2xl border border-border bg-card overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
      >
        <div className="relative h-32">
          <img
            src={getDestinationImage(destination)}
            alt={destination}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-white/90" />
              <h3 className="text-lg font-bold text-white">{destination}</h3>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {occasion && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white capitalize">
                  {occasion}
                </span>
              )}
              {days > 0 && (
                <span className="text-[10px] text-white/80">{days} days</span>
              )}
            </div>
          </div>
        </div>

        <div className="p-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {data.flights.length > 0 && (
              <span className="flex items-center gap-1">
                <Plane className="h-3 w-3" /> {data.flights.length} flights
              </span>
            )}
            {data.hotels.length > 0 && (
              <span className="flex items-center gap-1">
                <Hotel className="h-3 w-3" /> {data.hotels.length} hotels
              </span>
            )}
            {data.activities.length > 0 && (
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> {data.activities.length} activities
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground">Prices are approximate</span>
            <span className="flex items-center gap-1 text-xs font-medium text-foreground">
              {!isPremium && <Crown className="h-3 w-3 text-primary" />}
              View Full Plan <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>

      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />
    </>
  );
};

export default TripSummaryCard;
