import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Download, Share2, Plane, Hotel, Sparkles,
  MapPin, Clock, Sun, Banknote, Globe, CalendarDays,
  ExternalLink, Star, Bookmark, ChevronRight, Trophy, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import FlightDetailModal from "@/components/FlightDetailModal";
import HotelDetailModal from "@/components/HotelDetailModal";
import ActivityDetailModal from "@/components/ActivityDetailModal";
import ItineraryTimeline from "@/components/ItineraryTimeline";
import TripMap, { type MapPoint } from "@/components/TripMap";
import { HotelData } from "@/contexts/TripContext";
import { FlightData } from "@/components/FlightCard";
import { ActivityData } from "@/components/ActivityCard";
import { TripPlanData } from "@/components/TripSummaryCard";
import { shareTripSummary } from "@/utils/tripSummary";
import { exportTripPlanPDF } from "@/utils/pdfExport";
import { getSkyscannerUrl, getBookingDotComUrl, getGetYourGuideUrl } from "@/utils/bookingLinks";
import { getHotelImage } from "@/components/HotelCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const cityImages: Record<string, string> = {
  dubai: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&h=600&fit=crop",
  paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&h=600&fit=crop",
  tokyo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&h=600&fit=crop",
  bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&h=600&fit=crop",
  rome: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&h=600&fit=crop",
  london: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&h=600&fit=crop",
  maldives: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&h=600&fit=crop",
  singapore: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&h=600&fit=crop",
  barcelona: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&h=600&fit=crop",
  santorini: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&h=600&fit=crop",
  default: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=600&fit=crop",
};

const getHeroImage = (destination: string) => {
  const key = destination.toLowerCase().replace(/[^a-z]/g, "");
  return cityImages[key] || cityImages.default;
};

const activityImageMap: Record<string, string> = {
  cruise: "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=400&h=250&fit=crop",
  spa: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=250&fit=crop",
  temple: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=250&fit=crop",
  beach: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=250&fit=crop",
  hiking: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=250&fit=crop",
  market: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=250&fit=crop",
  museum: "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=400&h=250&fit=crop",
  diving: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=250&fit=crop",
  safari: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400&h=250&fit=crop",
  food: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=250&fit=crop",
  waterfall: "https://images.unsplash.com/photo-1432405972618-c6b0cfba8673?w=400&h=250&fit=crop",
  yoga: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=250&fit=crop",
  sunset: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=400&h=250&fit=crop",
  default: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=250&fit=crop",
};

// Trip Score calculation
const calcTripScore = (data: TripPlanData): { score: number; tips: string[] } => {
  let score = 0;
  const tips: string[] = [];

  if (data.flights.length > 0) { score += 20; } else { tips.push("Add flights to boost your score"); }
  if (data.hotels.length > 0) { score += 20; } else { tips.push("Add hotels for a complete plan"); }
  if (data.activities.length > 0) { score += 15; } else { tips.push("Add activities for more fun"); }
  if (data.activities.length >= 3) { score += 5; }
  if (data.itinerary.length > 0) { score += 20; } else { tips.push("Add a day-by-day itinerary"); }
  if (data.itinerary.length >= 5) { score += 10; } else if (data.itinerary.length > 0) { tips.push("Plan 5+ days for a thorough trip"); }
  if (data.travelInfo) { score += 10; }

  return { score: Math.min(score, 100), tips };
};

// Donut Chart SVG Component
const BudgetDonut = ({
  segments,
  currency,
  total,
}: {
  segments: { label: string; value: number; color: string; icon: React.ElementType }[];
  currency: string;
  total: number;
}) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-[180px] h-[180px] shrink-0">
        <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90">
          {segments.filter(s => s.value > 0).map((seg, i) => {
            const pct = seg.value / total;
            const dashLength = pct * circumference;
            const offset = cumulativeOffset;
            cumulativeOffset += dashLength;

            return (
              <circle
                key={seg.label}
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="14"
                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className="animate-ring-fill"
                style={{
                  "--ring-circumference": circumference,
                  "--ring-offset": circumference - dashLength,
                  animationDelay: `${i * 200}ms`,
                } as React.CSSProperties}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="text-lg font-bold text-foreground animate-count-up">
            ~{currency}{total.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {segments.filter(s => s.value > 0).map((seg) => {
          const Icon = seg.icon;
          return (
            <div key={seg.label} className="flex items-center gap-3 animate-count-up">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground flex-1">{seg.label}</span>
              <span className="text-sm font-semibold text-foreground">
                ~{currency}{seg.value.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Trip Score Ring
const TripScoreRing = ({ score, tips }: { score: number; tips: string[] }) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80 ? "hsl(142, 76%, 36%)" :
    score >= 50 ? "hsl(38, 92%, 50%)" :
    "hsl(0, 84%, 60%)";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative w-[68px] h-[68px] cursor-help shrink-0">
            <svg viewBox="0 0 68 68" className="w-full h-full -rotate-90">
              <circle cx="34" cy="34" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="5" />
              <circle
                cx="34"
                cy="34"
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="animate-ring-fill"
                style={{
                  "--ring-circumference": circumference,
                  "--ring-offset": offset,
                } as React.CSSProperties}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-bold text-foreground">{score}</span>
              <span className="text-[8px] text-muted-foreground">score</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px]">
          <p className="font-semibold text-xs mb-1">Trip Score</p>
          {tips.length > 0 ? (
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {tips.map((t, i) => (
                <li key={i}>• {t}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Your trip plan looks great!</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const TripDetail = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tripData, setTripData] = useState<{ data: TripPlanData; destination: string } | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null);
  const [flightModalOpen, setFlightModalOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<HotelData | null>(null);
  const [hotelModalOpen, setHotelModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityData | null>(null);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [focusedCard, setFocusedCard] = useState<string | null>(null);

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const raw = sessionStorage.getItem("rzuma-trip-detail");
    if (raw) {
      try { setTripData(JSON.parse(raw)); }
      catch { navigate("/chat"); }
    } else { navigate("/chat"); }
  }, [navigate]);

  // Clear focus effect after animation
  useEffect(() => {
    if (focusedCard) {
      const timer = setTimeout(() => setFocusedCard(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [focusedCard]);

  const scrollToCard = useCallback((name: string) => {
    const el = cardRefs.current[name];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setFocusedCard(name);
    }
  }, []);

  if (!tripData) return null;
  const { data, destination } = tripData;

  // Assign days to map points based on itinerary (heuristic)
  const mapPoints: MapPoint[] = [
    ...data.hotels.filter((h: any) => h.lat && h.lng).map((h: any) => ({
      name: h.name, lat: h.lat, lng: h.lng, type: "hotel" as const, day: 1,
    })),
    ...data.activities.filter((a: any) => a.lat && a.lng).map((a: any, i: number) => ({
      name: a.name, lat: a.lat, lng: a.lng, type: "activity" as const,
      day: data.itinerary.length > 0 ? ((i % data.itinerary.length) + 1) : undefined,
    })),
  ];

  const days = data.itinerary.length || 1;
  const flightsCost = data.flights.reduce((s, f) => s + f.price, 0);
  const hotelsCost = data.hotels.reduce((s, h) => s + h.pricePerNight * days, 0);
  const activitiesCost = data.activities.reduce((s, a) => s + a.price, 0);
  const totalBudget = flightsCost + hotelsCost + activitiesCost;
  const currency = data.flights[0]?.currency || data.hotels[0]?.currency || data.activities[0]?.currency || "$";

  const { score: tripScore, tips: tripTips } = calcTripScore(data);

  const handleShare = async () => {
    try {
      await shareTripSummary([{ role: "assistant" as const, content: data.text }]);
      toast.success("Trip summary copied!");
    } catch { toast.error("Couldn't share"); }
  };

  const handleExportPDF = () => {
    exportTripPlanPDF({ data, destination });
    toast.success("PDF downloaded!");
  };

  const handleSave = async () => {
    if (!user) { toast.error("Sign in to save trips"); navigate("/auth"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("saved_trips").insert({
        user_id: user.id,
        title: `Trip to ${destination}`,
        destination,
        data_json: data as any,
        status: "planning",
      });
      if (error) throw error;
      toast.success("Trip saved!");
    } catch { toast.error("Couldn't save trip"); }
    finally { setSaving(false); }
  };

  const handleDayClick = (day: number) => {
    setActiveDay((prev) => (prev === day ? null : day));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative h-[280px] sm:h-[340px]">
        <img src={getHeroImage(destination)} alt={destination} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        <div className="absolute top-4 left-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/chat")} className="rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Trip</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">{destination}</h1>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {data.itinerary.length > 0 && (
                    <span className="flex items-center gap-1.5 text-xs bg-secondary/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-foreground">
                      <CalendarDays className="h-3 w-3" /> {data.itinerary.length} days
                    </span>
                  )}
                  {totalBudget > 0 && (
                    <span className="flex items-center gap-1.5 text-xs bg-secondary/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-foreground">
                      <Banknote className="h-3 w-3" /> ~{currency}{totalBudget.toLocaleString()}
                    </span>
                  )}
                  {data.weather && (
                    <span className="flex items-center gap-1.5 text-xs bg-secondary/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-foreground">
                      <Sun className="h-3 w-3" /> {data.weather.tempLow}°–{data.weather.tempHigh}°C
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                    <Bookmark className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save Trip"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1.5">
                    <Download className="h-3.5 w-3.5" /> PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
                    <Share2 className="h-3.5 w-3.5" /> Share
                  </Button>
                </div>
              </div>

              {/* Trip Score */}
              <TripScoreRing score={tripScore} tips={tripTips} />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Day Selector */}
      {data.itinerary.length > 0 && (
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="max-w-3xl mx-auto px-4 sm:px-8">
            <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
              <Button
                variant={activeDay === null ? "default" : "outline"}
                size="sm"
                className="shrink-0 rounded-full text-xs h-8 px-4 transition-all"
                onClick={() => setActiveDay(null)}
              >
                All Days
              </Button>
              {data.itinerary.map((item) => (
                <Button
                  key={item.day}
                  variant={activeDay === item.day ? "default" : "outline"}
                  size="sm"
                  className={`shrink-0 rounded-full text-xs h-8 px-4 transition-all ${
                    activeDay === item.day ? "scale-105" : ""
                  }`}
                  onClick={() => handleDayClick(item.day)}
                >
                  Day {item.day}
                </Button>
              ))}
            </div>
            {/* Progress bar */}
            <div className="h-0.5 bg-secondary rounded-full mb-1 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{
                  width: activeDay
                    ? `${(activeDay / data.itinerary.length) * 100}%`
                    : "100%",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 space-y-10">

        {/* Info Strip */}
        {data.travelInfo && (
          <div className="flex flex-wrap gap-4 p-4 rounded-2xl bg-card border border-border animate-stagger-in">
            {[
              { icon: Globe, label: "Visa", value: data.travelInfo.visa },
              { icon: Banknote, label: "Currency", value: data.travelInfo.currency },
              { icon: Clock, label: "Timezone", value: data.travelInfo.timezone },
              { icon: Sun, label: "Best Season", value: data.travelInfo.bestSeason },
            ].map(({ icon: Icon, label, value }) => value && (
              <div key={label} className="flex items-center gap-2 text-xs">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{label}:</span>
                <span className="font-medium text-foreground">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Interactive Map */}
        {mapPoints.length > 0 && (
          <TripMap
            points={mapPoints}
            activeDay={activeDay}
            onMarkerClick={scrollToCard}
          />
        )}

        {/* Flights */}
        {data.flights.length > 0 && (
          <section className="animate-stagger-in" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <Plane className="h-5 w-5 text-foreground" />
              <h2 className="text-lg font-bold text-foreground">Flights</h2>
              <span className="text-xs text-muted-foreground ml-auto">Prices are approximate</span>
            </div>
            <div className="space-y-3">
              {data.flights.map((f, i) => (
                <div
                  key={f.id || i}
                  ref={(el) => { cardRefs.current[f.airline + f.from + f.to] = el; }}
                  className={`group relative p-4 rounded-2xl bg-card border transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.01] ${
                    focusedCard === f.airline + f.from + f.to
                      ? "border-primary animate-glow-pulse"
                      : "border-border hover:border-foreground/20"
                  }`}
                  onClick={() => { setSelectedFlight(f); setFlightModalOpen(true); }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="text-center shrink-0">
                        <p className="text-lg font-bold text-foreground">{f.departureTime}</p>
                        <p className="text-xs text-muted-foreground uppercase">{f.from}</p>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1 px-2">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" /> {f.duration}
                        </span>
                        <div className="w-full flex items-center gap-1">
                          <div className="h-px flex-1 bg-border" />
                          <Plane className="h-3 w-3 text-muted-foreground" />
                          <div className="h-px flex-1 bg-border" />
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {f.stops === 0 ? "Direct" : `${f.stops} stop${f.stops > 1 ? "s" : ""}`}
                        </span>
                      </div>
                      <div className="text-center shrink-0">
                        <p className="text-lg font-bold text-foreground">{f.arrivalTime}</p>
                        <p className="text-xs text-muted-foreground uppercase">{f.to}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-foreground">~{f.currency}{f.price}</p>
                      <p className="text-xs text-muted-foreground">{f.airline}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{f.date}</span>
                    <a
                      href={getSkyscannerUrl(f.from, f.to, f.date)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                    >
                      Search on Skyscanner <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Hotels */}
        {data.hotels.length > 0 && (
          <section className="animate-stagger-in" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <Hotel className="h-5 w-5 text-foreground" />
              <h2 className="text-lg font-bold text-foreground">Hotels</h2>
              <span className="text-xs text-muted-foreground ml-auto">Prices are approximate</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {data.hotels.map((h, i) => (
                <div
                  key={h.id || i}
                  ref={(el) => { cardRefs.current[h.name] = el; }}
                  className={`group rounded-2xl bg-card border overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                    focusedCard === h.name
                      ? "border-primary animate-glow-pulse"
                      : "border-border hover:border-foreground/20"
                  }`}
                  onClick={() => { setSelectedHotel(h); setHotelModalOpen(true); }}
                >
                  <div className="relative h-40 overflow-hidden">
                    <img src={getHotelImage(h.image)} alt={h.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs font-bold">
                      ~{h.currency}{h.pricePerNight}/night
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-foreground">{h.name}</h3>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: h.stars }).map((_, j) => (
                        <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {h.location}
                    </div>
                    {h.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{h.description}</p>
                    )}
                    <a
                      href={getBookingDotComUrl(h.name, h.location)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline pt-1"
                    >
                      Check on Booking.com <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Activities */}
        {data.activities.length > 0 && (
          <section className="animate-stagger-in" style={{ animationDelay: "300ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-foreground" />
              <h2 className="text-lg font-bold text-foreground">Activities</h2>
              <span className="text-xs text-muted-foreground ml-auto">Prices are approximate</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {data.activities.map((a, i) => (
                <div
                  key={a.id || i}
                  ref={(el) => { cardRefs.current[a.name] = el; }}
                  className={`group rounded-2xl bg-card border overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
                    focusedCard === a.name
                      ? "border-primary animate-glow-pulse"
                      : "border-border hover:border-foreground/20"
                  }`}
                  onClick={() => { setSelectedActivity(a); setActivityModalOpen(true); }}
                >
                  <div className="relative h-36 overflow-hidden">
                    <img src={activityImageMap[a.image] || activityImageMap.default} alt={a.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-foreground">{a.name}</h3>
                    {a.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {a.duration}</span>
                      <span className="font-bold text-foreground">~{a.currency}{a.price}</span>
                    </div>
                    <a
                      href={getGetYourGuideUrl(a.name, destination)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline pt-1"
                    >
                      Find on GetYourGuide <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Itinerary Timeline */}
        {data.itinerary.length > 0 && (
          <section className="animate-stagger-in" style={{ animationDelay: "400ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="h-5 w-5 text-foreground" />
              <h2 className="text-lg font-bold text-foreground">Day-by-Day Itinerary</h2>
            </div>
            <ItineraryTimeline
              items={activeDay ? data.itinerary.filter((it) => it.day === activeDay) : data.itinerary}
              activeDay={activeDay}
              onDayClick={handleDayClick}
            />
          </section>
        )}

        {/* Budget Donut */}
        {totalBudget > 0 && (
          <section className="p-6 rounded-2xl bg-card border border-border animate-stagger-in" style={{ animationDelay: "500ms" }}>
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-foreground" />
              <h2 className="text-lg font-bold text-foreground">Estimated Budget</h2>
            </div>
            <BudgetDonut
              segments={[
                { label: "Flights", value: flightsCost, color: "hsl(221, 83%, 53%)", icon: Plane },
                { label: `Hotels (${days}n)`, value: hotelsCost, color: "hsl(142, 76%, 36%)", icon: Hotel },
                { label: "Activities", value: activitiesCost, color: "hsl(38, 92%, 50%)", icon: Sparkles },
              ]}
              currency={currency}
              total={totalBudget}
            />
            <p className="text-[10px] text-muted-foreground mt-4">
              Prices are approximate estimates. Verify on booking sites before purchasing.
            </p>
          </section>
        )}

        <p className="text-xs text-muted-foreground text-center py-4">
          Generated by Rzuma • All prices are approximate estimates
        </p>
      </div>

      <FlightDetailModal flight={selectedFlight} open={flightModalOpen} onOpenChange={setFlightModalOpen} />
      <HotelDetailModal hotel={selectedHotel} open={hotelModalOpen} onOpenChange={setHotelModalOpen} />
      <ActivityDetailModal activity={selectedActivity} open={activityModalOpen} onOpenChange={setActivityModalOpen} />
    </div>
  );
};

export default TripDetail;
