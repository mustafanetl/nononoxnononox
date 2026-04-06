import { Plane, Hotel, Sparkles, MapPin, Calendar, ArrowRight, Check, Lock, Star } from "lucide-react";
import { useState } from "react";
import { getCityImage } from "@/utils/cityImages";
import { TripPlanData } from "@/components/TripSummaryCard";

interface PlanPreviewGateProps {
  data: TripPlanData;
  destination: string;
  enrichedImages?: any[];
  onUpgrade: () => void;
}

const features = [
  "Full day-by-day itinerary",
  "Hotel deals & booking links",
  "Unlimited trip planning",
  "PDF export & sharing",
];

const PlanPreviewGate = ({ data, destination, enrichedImages, onUpgrade }: PlanPreviewGateProps) => {
  const [selectedPlan, setSelectedPlan] = useState<"annual" | "monthly">("annual");
  const days = data.itinerary.length;
  const heroImg = enrichedImages?.[0]?.url || enrichedImages?.[0]?.thumbUrl || getCityImage(destination, 800, 500);

  // Show 2-3 activity names as teaser
  const teaserActivities = data.activities.slice(0, 3);

  return (
    <div className="mt-4 w-full max-w-sm rounded-2xl border border-border bg-card overflow-hidden shadow-xl">
      {/* Hero image */}
      <div className="relative h-56">
        <img src={heroImg} alt={destination} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <MapPin className="h-4 w-4 text-white/90" />
            <h3 className="text-xl font-bold text-white">{destination}</h3>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-white/80">
            {days > 0 && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{days} days</span>}
            <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" />{data.activities.length} experiences</span>
            {data.hotels.length > 0 && <span className="flex items-center gap-1"><Hotel className="h-3 w-3" />{data.hotels.length} hotels</span>}
            {data.flights.length > 0 && <span className="flex items-center gap-1"><Plane className="h-3 w-3" />{data.flights.length} flights</span>}
          </div>
        </div>
      </div>

      {/* Blurred activity teaser */}
      <div className="relative px-4 pt-4 pb-0">
        {teaserActivities.map((act, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 py-2 border-b border-border/50 last:border-0 ${i >= 1 ? "opacity-60" : ""} ${i >= 2 ? "blur-[2px]" : ""}`}
          >
            <Star className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-sm text-foreground truncate">{act.name}</span>
            {act.duration && <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{act.duration}</span>}
          </div>
        ))}
        {/* Blur overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent" />
      </div>

      {/* Paywall section */}
      <div className="px-4 pt-2 pb-5">
        <div className="text-center mb-3">
          <h4 className="text-base font-bold text-foreground">Your trip, complete. ✨</h4>
          <p className="text-xs text-muted-foreground mt-0.5">Unlock everything and start planning for real</p>
        </div>

        {/* Features */}
        <ul className="space-y-1.5 mb-4">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-xs text-foreground">
              <Check className="h-3.5 w-3.5 text-primary shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        {/* Plan toggle */}
        <div className="space-y-1.5 mb-3">
          <button
            onClick={() => setSelectedPlan("annual")}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
              selectedPlan === "annual"
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border hover:bg-muted/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                selectedPlan === "annual" ? "border-primary" : "border-muted-foreground/30"
              }`}>
                {selectedPlan === "annual" && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </div>
              <span className="font-semibold text-xs">Annual</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">Save 67%</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-xs">$4.17<span className="text-muted-foreground font-normal">/mo</span></span>
              <p className="text-[9px] text-muted-foreground">billed $49.99/yr</p>
            </div>
          </button>
          <button
            onClick={() => setSelectedPlan("monthly")}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
              selectedPlan === "monthly"
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border hover:bg-muted/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                selectedPlan === "monthly" ? "border-primary" : "border-muted-foreground/30"
              }`}>
                {selectedPlan === "monthly" && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </div>
              <span className="font-semibold text-xs">Monthly</span>
            </div>
            <span className="font-bold text-xs">$12.99<span className="text-muted-foreground font-normal">/mo</span></span>
          </button>
        </div>

        {/* CTA */}
        <button
          onClick={onUpgrade}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <Lock className="h-3.5 w-3.5" />
          Start Free Trial — 3 Days Free
        </button>

        <p className="text-[10px] text-muted-foreground/70 text-center mt-2">
          Cancel anytime · No charge for 3 days
        </p>
      </div>
    </div>
  );
};

export default PlanPreviewGate;
