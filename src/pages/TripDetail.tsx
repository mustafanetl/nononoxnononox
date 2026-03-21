import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Share2, Plane, Hotel, Sparkles, CalendarDays, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FlightCard, { FlightData } from "@/components/FlightCard";
import FlightDetailModal from "@/components/FlightDetailModal";
import HotelCard from "@/components/HotelCard";
import HotelDetailModal from "@/components/HotelDetailModal";
import ActivityCard, { ActivityData } from "@/components/ActivityCard";
import ActivityDetailModal from "@/components/ActivityDetailModal";
import ItineraryCard from "@/components/ItineraryCard";
import TravelInfoCard from "@/components/TravelInfoCard";
import WeatherCard from "@/components/WeatherCard";
import PackingList from "@/components/PackingList";
import CurrencyConverter from "@/components/CurrencyConverter";
import TripMap, { type MapPoint } from "@/components/TripMap";
import { HotelData } from "@/contexts/TripContext";
import { TripPlanData } from "@/components/TripSummaryCard";
import { shareTripSummary } from "@/utils/tripSummary";
import { toast } from "sonner";

const TripDetail = () => {
  const navigate = useNavigate();
  const [tripData, setTripData] = useState<{ data: TripPlanData; destination: string } | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null);
  const [flightModalOpen, setFlightModalOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<HotelData | null>(null);
  const [hotelModalOpen, setHotelModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityData | null>(null);
  const [activityModalOpen, setActivityModalOpen] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("rzuma-trip-detail");
    if (raw) {
      try {
        setTripData(JSON.parse(raw));
      } catch {
        navigate("/chat");
      }
    } else {
      navigate("/chat");
    }
  }, [navigate]);

  if (!tripData) return null;

  const { data, destination } = tripData;

  const mapPoints: MapPoint[] = [
    ...data.hotels.filter((h: any) => h.lat && h.lng).map((h: any) => ({ name: h.name, lat: h.lat, lng: h.lng, type: "hotel" as const })),
    ...data.activities.filter((a: any) => a.lat && a.lng).map((a: any) => ({ name: a.name, lat: a.lat, lng: a.lng, type: "activity" as const })),
  ];

  const handleShare = async () => {
    try {
      const msgs = [{ role: "assistant" as const, content: data.text }];
      await shareTripSummary(msgs);
      toast.success("Trip summary copied!");
    } catch {
      toast.error("Couldn't share");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="font-semibold text-lg">{destination}</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview" className="gap-1.5"><Info className="h-3.5 w-3.5" /> Overview</TabsTrigger>
            {data.flights.length > 0 && <TabsTrigger value="flights" className="gap-1.5"><Plane className="h-3.5 w-3.5" /> Flights ({data.flights.length})</TabsTrigger>}
            {data.hotels.length > 0 && <TabsTrigger value="hotels" className="gap-1.5"><Hotel className="h-3.5 w-3.5" /> Hotels ({data.hotels.length})</TabsTrigger>}
            {data.activities.length > 0 && <TabsTrigger value="activities" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Activities ({data.activities.length})</TabsTrigger>}
            {data.itinerary.length > 0 && <TabsTrigger value="itinerary" className="gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Itinerary</TabsTrigger>}
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {data.travelInfo && (
              <>
                <TravelInfoCard info={data.travelInfo} />
                {data.travelInfo.currency && <CurrencyConverter destinationCurrency={data.travelInfo.currency} />}
              </>
            )}
            {data.weather && (
              <>
                <WeatherCard weather={data.weather} />
                {data.weather.packingTips?.length > 0 && <PackingList items={data.weather.packingTips} />}
              </>
            )}
            {mapPoints.length > 0 && <TripMap points={mapPoints} />}
            <p className="text-xs text-muted-foreground text-center pt-4">
              All prices are approximate estimates. Verify on booking sites before purchasing.
            </p>
          </TabsContent>

          {/* Flights */}
          <TabsContent value="flights" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.flights.map((f, i) => (
                <FlightCard key={f.id || i} flight={f} onClick={() => { setSelectedFlight(f); setFlightModalOpen(true); }} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">Prices are approximate. Click a flight to book on Skyscanner.</p>
          </TabsContent>

          {/* Hotels */}
          <TabsContent value="hotels" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.hotels.map((h, i) => (
                <HotelCard key={h.id || i} hotel={h} onClick={() => { setSelectedHotel(h); setHotelModalOpen(true); }} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">Prices are approximate. Click a hotel to book on Booking.com.</p>
          </TabsContent>

          {/* Activities */}
          <TabsContent value="activities" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.activities.map((a, i) => (
                <ActivityCard key={a.id || i} activity={a} onClick={() => { setSelectedActivity(a); setActivityModalOpen(true); }} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">Prices are approximate. Click to find on GetYourGuide.</p>
          </TabsContent>

          {/* Itinerary */}
          <TabsContent value="itinerary" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.itinerary.map((item, i) => (
                <ItineraryCard key={i} item={item} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <FlightDetailModal flight={selectedFlight} open={flightModalOpen} onOpenChange={setFlightModalOpen} />
      <HotelDetailModal hotel={selectedHotel} open={hotelModalOpen} onOpenChange={setHotelModalOpen} />
      <ActivityDetailModal activity={selectedActivity} open={activityModalOpen} onOpenChange={setActivityModalOpen} />
    </div>
  );
};

export default TripDetail;
