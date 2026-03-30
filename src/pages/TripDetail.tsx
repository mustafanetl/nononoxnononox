import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Download, Share2, Plane, Hotel, Sparkles,
  MapPin, Clock, Sun, Banknote, Globe, CalendarDays,
  ExternalLink, Star, Bookmark, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
import { getCityImage } from "@/utils/cityImages";
import { exportTripPlanPDF } from "@/utils/pdfExport";
import { getSkyscannerUrl, getBookingDotComUrl, getGetYourGuideUrl } from "@/utils/bookingLinks";
import { getHotelImage } from "@/components/HotelCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const getHeroImage = (destination: string) => getCityImage(destination, 1200, 600);


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

/* ───── Budget Donut ───── */
const BudgetDonut = ({
  segments, currency, total, compact = false,
}: {
  segments: { label: string; value: number; color: string; icon: React.ElementType }[];
  currency: string;
  total: number;
  compact?: boolean;
}) => {
  const radius = compact ? 36 : 70;
  const circumference = 2 * Math.PI * radius;
  const viewBox = compact ? "0 0 90 90" : "0 0 180 180";
  const center = compact ? 45 : 90;
  let cumulativeOffset = 0;

  return (
    <div className={`flex ${compact ? "items-center gap-3" : "flex-col sm:flex-row items-center gap-6"}`}>
      <div className={`relative shrink-0 ${compact ? "w-[72px] h-[72px]" : "w-[180px] h-[180px]"}`}>
        <svg viewBox={viewBox} className="w-full h-full -rotate-90">
          {segments.filter(s => s.value > 0).map((seg, i) => {
            const pct = seg.value / total;
            const dashLength = pct * circumference;
            const offset = cumulativeOffset;
            cumulativeOffset += dashLength;
            return (
              <circle
                key={seg.label} cx={center} cy={center} r={radius}
                fill="none" stroke={seg.color}
                strokeWidth={compact ? 7 : 14}
                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                strokeDashoffset={-offset} strokeLinecap="round"
                className="animate-ring-fill"
                style={{ "--ring-circumference": circumference, "--ring-offset": circumference - dashLength, animationDelay: `${i * 200}ms` } as React.CSSProperties}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold text-foreground animate-count-up ${compact ? "text-xs" : "text-lg"}`}>
            {currency}{total.toLocaleString()}
          </span>
          {!compact && <span className="text-[10px] text-muted-foreground">Total</span>}
        </div>
      </div>

      {!compact && (
        <div className="flex flex-col gap-3 flex-1">
          {segments.filter(s => s.value > 0).map((seg) => {
            const Icon = seg.icon;
            return (
              <div key={seg.label} className="flex items-center gap-3 animate-count-up">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground flex-1">{seg.label}</span>
                <span className="text-sm font-semibold text-foreground">{currency}{seg.value.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
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
    const raw = sessionStorage.getItem("jolliday-trip-detail");
    if (raw) {
      try { setTripData(JSON.parse(raw)); }
      catch { navigate("/chat"); }
    } else { navigate("/chat"); }
  }, [navigate]);

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
  

  const budgetSegments = [
    { label: "Flights", value: flightsCost, color: "hsl(221, 83%, 53%)", icon: Plane },
    { label: `Hotels (${days}n)`, value: hotelsCost, color: "hsl(142, 76%, 36%)", icon: Hotel },
    { label: "Activities", value: activitiesCost, color: "hsl(38, 92%, 50%)", icon: Sparkles },
  ];

  // Day-to-activity mapping
  const getActivitiesForDay = (day: number) =>
    data.activities.filter((_, i) => data.itinerary.length > 0 && ((i % data.itinerary.length) + 1) === day);

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
        user_id: user.id, title: `Trip to ${destination}`, destination,
        data_json: data as any, status: "planning",
      });
      if (error) throw error;
      toast.success("Trip saved!");
    } catch { toast.error("Couldn't save trip"); }
    finally { setSaving(false); }
  };

  const handleDayClick = (day: number) => {
    setActiveDay((prev) => (prev === day ? null : day));
  };

  const isOverview = activeDay === null;

  return (
    <div className="min-h-screen bg-background pb-24 sm:pb-8">
      {/* ── Compact Hero ── */}
      <div className="relative h-[200px] sm:h-[260px]">
        <img src={getHeroImage(destination)} alt={destination} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

        <div className="absolute top-4 left-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}
            className="rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-3.5 w-3.5 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{destination}</h1>
          </div>
        </div>
      </div>

      {/* ── At a Glance Summary ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-8 -mt-1">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 animate-stagger-in">
          {/* Flight */}
          {data.flights.length > 0 && (
            <div className="p-3 rounded-xl bg-card border border-border space-y-1">
              <div className="flex items-center gap-1.5">
                <Plane className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Flight</span>
              </div>
              <p className="text-sm font-bold text-foreground truncate">
                {data.flights[0].from} → {data.flights[0].to}
              </p>
              <p className="text-xs text-muted-foreground">{data.flights[0].airline}</p>
            </div>
          )}

          {/* Hotel */}
          {data.hotels.length > 0 && (
            <div className="p-3 rounded-xl bg-card border border-border space-y-1">
              <div className="flex items-center gap-1.5">
                <Hotel className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Stay</span>
              </div>
              <p className="text-sm font-bold text-foreground truncate">{data.hotels[0].name}</p>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: data.hotels[0].stars }).map((_, j) => (
                  <Star key={j} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
          )}

          {/* Duration */}
          {data.itinerary.length > 0 && (
            <div className="p-3 rounded-xl bg-card border border-border space-y-1">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Duration</span>
              </div>
              <p className="text-sm font-bold text-foreground">{data.itinerary.length} Days</p>
              <p className="text-xs text-muted-foreground">{Math.max(data.itinerary.length - 1, 1)} nights</p>
            </div>
          )}

          {/* Budget */}
          {totalBudget > 0 && (
            <div className="p-3 rounded-xl bg-card border border-border space-y-1">
              <div className="flex items-center gap-1.5">
                <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Budget</span>
              </div>
              <p className="text-sm font-bold text-foreground">{currency}{totalBudget.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">total est.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky Day Selector ── */}
      {data.itinerary.length > 0 && (
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border mt-4">
          <div className="max-w-3xl mx-auto px-4 sm:px-8">
            <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
              <Button
                variant={isOverview ? "default" : "outline"} size="sm"
                className="shrink-0 rounded-full text-xs h-8 px-4"
                onClick={() => setActiveDay(null)}
              >
                Overview
              </Button>
              {data.itinerary.map((item) => (
                <Button
                  key={item.day}
                  variant={activeDay === item.day ? "default" : "outline"} size="sm"
                  className={`shrink-0 rounded-full text-xs h-8 px-4 transition-all ${activeDay === item.day ? "scale-105" : ""}`}
                  onClick={() => handleDayClick(item.day)}
                >
                  Day {item.day}
                </Button>
              ))}
            </div>
            <div className="h-0.5 bg-secondary rounded-full mb-1 overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: activeDay ? `${(activeDay / data.itinerary.length) * 100}%` : "100%" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6 space-y-8">

        {/* Travel Info Strip */}
        {data.travelInfo && isOverview && (
          <div className="flex flex-wrap gap-4 p-3.5 rounded-xl bg-card border border-border animate-stagger-in">
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
          <div className="animate-stagger-in">
            <TripMap points={mapPoints} activeDay={activeDay} onMarkerClick={scrollToCard} />
          </div>
        )}

        {/* ════════ OVERVIEW MODE ════════ */}
        {isOverview && (
          <div className="space-y-8 animate-day-switch">
            {/* Flights */}
            {data.flights.length > 0 && (
              <section>
                <SectionHeader icon={Plane} title="Flights" />
                <div className="space-y-3">
                  {data.flights.map((f, i) => (
                    <FlightRow key={f.id || i} flight={f} destination={destination}
                      focused={focusedCard === f.airline + f.from + f.to}
                      ref={(el) => { cardRefs.current[f.airline + f.from + f.to] = el; }}
                      onClick={() => { setSelectedFlight(f); setFlightModalOpen(true); }}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Hotels */}
            {data.hotels.length > 0 && (
              <section>
                <SectionHeader icon={Hotel} title="Hotels" />
                <div className="grid gap-4 sm:grid-cols-2">
                  {data.hotels.map((h, i) => (
                    <HotelRow key={h.id || i} hotel={h} destination={destination}
                      focused={focusedCard === h.name}
                      ref={(el) => { cardRefs.current[h.name] = el; }}
                      onClick={() => { setSelectedHotel(h); setHotelModalOpen(true); }}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Itinerary */}
            {data.itinerary.length > 0 && (
              <section>
                <SectionHeader icon={CalendarDays} title="Day-by-Day Itinerary" />
                <ItineraryTimeline items={data.itinerary} activeDay={activeDay} onDayClick={handleDayClick} singleDayExpanded={false} />
              </section>
            )}

            {/* Activities */}
            {data.activities.length > 0 && (
              <section>
                <SectionHeader icon={Sparkles} title="Activities & Experiences" />
                <div className="space-y-3">
                  {data.activities.map((a, i) => (
                    <ActivityRow key={a.id || i} activity={a} destination={destination}
                      focused={focusedCard === a.name}
                      ref={(el) => { cardRefs.current[a.name] = el; }}
                      onClick={() => { setSelectedActivity(a); setActivityModalOpen(true); }}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Budget Breakdown */}
            {totalBudget > 0 && (
              <section className="p-5 rounded-2xl bg-card border border-border">
                <SectionHeader icon={TrendingUp} title="Estimated Budget" />
                <BudgetDonut segments={budgetSegments} currency={currency} total={totalBudget} />
              </section>
            )}
          </div>
        )}

        {/* ════════ DAY VIEW MODE ════════ */}
        {activeDay !== null && (
          <div className="space-y-6 animate-day-switch" key={`day-${activeDay}`}>
            {/* Day Itinerary */}
            {data.itinerary.filter(it => it.day === activeDay).length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {activeDay}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      {data.itinerary.find(it => it.day === activeDay)?.title || `Day ${activeDay}`}
                    </h2>
                    
                  </div>
                </div>
                <ItineraryTimeline
                  items={data.itinerary.filter(it => it.day === activeDay)}
                  activeDay={activeDay} onDayClick={handleDayClick}
                  singleDayExpanded={true}
                />
              </section>
            )}

            {/* Day's Activities */}
            {getActivitiesForDay(activeDay).length > 0 && (
              <section>
                <SectionHeader icon={Sparkles} title={`Day ${activeDay} Activities`} />
                <div className="space-y-3">
                  {getActivitiesForDay(activeDay).map((a, i) => (
                    <ActivityRow key={a.id || i} activity={a} destination={destination}
                      focused={focusedCard === a.name}
                      ref={(el) => { cardRefs.current[a.name] = el; }}
                      onClick={() => { setSelectedActivity(a); setActivityModalOpen(true); }}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Day hotel (show the primary hotel) */}
            {data.hotels.length > 0 && (
              <section>
                <SectionHeader icon={Hotel} title="Your Stay" />
                <HotelRow hotel={data.hotels[0]} destination={destination}
                  focused={focusedCard === data.hotels[0].name}
                  ref={(el) => { cardRefs.current[data.hotels[0].name] = el; }}
                  onClick={() => { setSelectedHotel(data.hotels[0]); setHotelModalOpen(true); }}
                />
              </section>
            )}

            {/* Mini budget for the day */}
            {totalBudget > 0 && (
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border">
                <BudgetDonut segments={budgetSegments} currency={currency} total={totalBudget} compact />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">Total Trip Budget</p>
                  <p className="text-[10px] text-muted-foreground">Across {days} days</p>
                </div>


              </div>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center py-4">
          Generated by Jolliday • All prices are approximate estimates
        </p>
      </div>

      {/* ── Floating Action Bar (mobile) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden">
        <div className="bg-card/90 backdrop-blur-xl border-t border-border px-4 py-3">
          <div className="flex items-center justify-between gap-2 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 flex-1 justify-end">
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 h-9">
                <Bookmark className="h-3.5 w-3.5" /> {saving ? "..." : "Save"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF} className="h-9 w-9 p-0">
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare} className="h-9 w-9 p-0">
                <Share2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop action bar in hero */}
      <div className="hidden sm:flex absolute top-4 right-4 z-10 items-center gap-2" style={{ position: 'fixed' }}>
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 bg-background/50 backdrop-blur-sm hover:bg-background/80">
          <Bookmark className="h-3.5 w-3.5" /> {saving ? "..." : "Save Trip"}
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportPDF} className="bg-background/50 backdrop-blur-sm hover:bg-background/80 gap-1.5">
          <Download className="h-3.5 w-3.5" /> PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleShare} className="bg-background/50 backdrop-blur-sm hover:bg-background/80 gap-1.5">
          <Share2 className="h-3.5 w-3.5" /> Share
        </Button>
      </div>

      <FlightDetailModal flight={selectedFlight} open={flightModalOpen} onOpenChange={setFlightModalOpen} />
      <HotelDetailModal hotel={selectedHotel} open={hotelModalOpen} onOpenChange={setHotelModalOpen} />
      <ActivityDetailModal activity={selectedActivity} open={activityModalOpen} onOpenChange={setActivityModalOpen} />
    </div>
  );
};

/* ───── Reusable Sub-Components ───── */

const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon className="h-5 w-5 text-foreground" />
    <h2 className="text-lg font-bold text-foreground">{title}</h2>
    {subtitle && <span className="text-[10px] text-muted-foreground ml-auto">{subtitle}</span>}
  </div>
);



const FlightRow = React.forwardRef<HTMLDivElement, {
  flight: FlightData; destination: string; focused: boolean; onClick: () => void;
}>(({ flight: f, focused, onClick }, ref) => (
  <div ref={ref}
    className={`group relative p-4 rounded-2xl bg-card border transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.01] ${
      focused ? "border-primary animate-glow-pulse" : "border-border hover:border-foreground/20"
    }`}
    onClick={onClick}
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
        <p className="text-lg font-bold text-foreground">{f.currency}{f.price}</p>
        <p className="text-xs text-muted-foreground">{f.airline}</p>
      </div>
    </div>
    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{f.date}</span>
      <a href={getSkyscannerUrl(f.from, f.to, f.date)} target="_blank" rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
        Search on Skyscanner <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  </div>
));
FlightRow.displayName = "FlightRow";

const HotelRow = React.forwardRef<HTMLDivElement, {
  hotel: HotelData; destination: string; focused: boolean; onClick: () => void;
}>(({ hotel: h, destination, focused, onClick }, ref) => (
  <div ref={ref}
    className={`group rounded-2xl bg-card border overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.01] ${
      focused ? "border-primary animate-glow-pulse" : "border-border hover:border-foreground/20"
    }`}
    onClick={onClick}
  >
    <div className="flex flex-col sm:flex-row">
      <div className="relative h-36 sm:h-auto sm:w-40 overflow-hidden shrink-0">
        <img src={getHotelImage(h.image)} alt={h.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm text-[10px] font-bold">
          {h.currency}{h.pricePerNight}/night
        </div>
      </div>
      <div className="p-4 flex-1 space-y-2">
        <h3 className="font-bold text-foreground">{h.name}</h3>
        <div className="flex items-center gap-1">
          {Array.from({ length: h.stars }).map((_, j) => (
            <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /> {h.location}
        </div>
        {h.description && <p className="text-xs text-muted-foreground line-clamp-2">{h.description}</p>}
        <a href={getBookingDotComUrl(h.name, h.location)} target="_blank" rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline pt-1">
          Check on Booking.com <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  </div>
));
HotelRow.displayName = "HotelRow";

const ActivityRow = React.forwardRef<HTMLDivElement, {
  activity: ActivityData; destination: string; focused: boolean; onClick: () => void;
}>(({ activity: a, destination, focused, onClick }, ref) => (
  <div ref={ref}
    className={`group flex rounded-2xl bg-card border overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-[1.01] ${
      focused ? "border-primary animate-glow-pulse" : "border-border hover:border-foreground/20"
    }`}
    onClick={onClick}
  >
    <div className="relative w-28 sm:w-36 shrink-0 overflow-hidden">
      <img src={activityImageMap[a.image] || activityImageMap.default} alt={a.name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/20" />
    </div>
    <div className="p-3 flex-1 flex flex-col justify-between min-w-0">
      <div>
        <h3 className="font-bold text-sm text-foreground truncate">{a.name}</h3>
        {a.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{a.description}</p>}
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {a.duration}</span>
          <span className="font-bold text-foreground">{a.currency}{a.price}</span>
        </div>
        <a href={getGetYourGuideUrl(a.name, destination)} target="_blank" rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline shrink-0">
          Book <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  </div>
));
ActivityRow.displayName = "ActivityRow";

export default TripDetail;
