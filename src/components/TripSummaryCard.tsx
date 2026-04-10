import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plane, Hotel, Sparkles, MapPin, ArrowRight } from "lucide-react";
import { FlightData } from "@/components/FlightCard";
import { HotelData } from "@/contexts/TripContext";
import { ActivityData } from "@/components/ActivityCard";
import { ItineraryData } from "@/components/ItineraryCard";
import { WeatherData } from "@/components/WeatherCard";
import { TravelInfoData } from "@/components/TravelInfoCard";
import { TimelineLeg } from "@/components/TripTimeline";
import { useSubscription } from "@/hooks/useSubscription";
import PaywallModal from "@/components/PaywallModal";

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

const TripSummaryCard = ({ data, destination, enrichedImages }: { data: TripPlanData; destination: string; enrichedImages?: any[] }) => {
  const navigate = useNavigate();
  const { isPremium } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);

  const handleClick = () => {
    if (!isPremium) {
      setShowPaywall(true);
      return;
    }
    sessionStorage.setItem("jolliday-trip-detail", JSON.stringify({ data, destination, enrichedImages }));
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
          {(enrichedImages?.[0]?.url || enrichedImages?.[0]?.thumbUrl) ? (
            <img
              src={enrichedImages[0].thumbUrl || enrichedImages[0].url}
              alt={destination}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-muted to-accent/20 flex items-center justify-center">
              <MapPin className="h-10 w-10 text-muted-foreground/40" />
            </div>
          )}
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

          <div className="flex items-center justify-end mt-3 pt-3 border-t border-border">
            <span className="flex items-center gap-1 text-xs font-medium text-foreground">
              View Full Plan <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>

      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        destination={destination}
        tripStats={{
          activities: data.activities.length,
          hotels: data.hotels.length,
          days: data.itinerary.length,
        }}
      />
    </>
  );
};

export default TripSummaryCard;
