import { Plane, Hotel, Sparkles, MapPin, Calendar, ArrowRight, Check, Lock, Star, Loader2, Compass, CalendarDays } from "lucide-react";
import { useState } from "react";
import { getCityImage } from "@/utils/cityImages";
import { useCityHeroImage } from "@/hooks/useCityHeroImage";
import { TripPlanData, StatTile, DayRailMini } from "@/components/TripSummaryCard";
import { getCurrencyPrices } from "@/utils/currencyLocale";
import { useAuth } from "@/hooks/useAuth";
import { startCheckout } from "@/lib/stripeCheckout";
import { useNavigate } from "react-router-dom";

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
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const days = data.itinerary.length;
  const stops = data.itinerary.reduce(
    (s: number, d: any) => s + (Array.isArray(d?.slots) ? d.slots.length : 0),
    0,
  ) || data.activities.length;
  const stockHero = useCityHeroImage(destination);
  const heroImg =
    stockHero ||
    enrichedImages?.[0]?.url ||
    enrichedImages?.[0]?.thumbUrl ||
    getCityImage(destination, 800, 500);
  const prices = getCurrencyPrices();

  return (
    <div className="mt-4 w-full max-w-md rounded-3xl border border-border bg-card overflow-hidden shadow-xl animate-stagger-in">
      {/* ── Cinematic hero ── */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={heroImg}
          alt={destination}
          className="w-full h-full object-cover animate-ken-burns animate-punch-in"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/80" />
        <div className="absolute inset-0 noise-overlay opacity-40" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p
            className="text-[10px] uppercase tracking-[0.35em] text-white/85 mb-3 inline-flex items-center gap-2 animate-hero-rise"
            style={{ animationDelay: "0.05s" }}
          >
            <Compass className="h-3 w-3" /> Your Jolliday
          </p>
          <h3
            className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-[0.95] drop-shadow-lg"
            aria-label={destination}
          >
            {destination.split("").map((ch, i) => (
              <span
                key={i}
                className="letter-rise"
                style={{ animationDelay: `${0.18 + i * 0.04}s` }}
              >
                {ch === " " ? "\u00A0" : ch}
              </span>
            ))}
          </h3>
          {days > 0 && (
            <p
              className="mt-2 text-white/80 text-sm animate-hero-rise"
              style={{ animationDelay: "0.32s" }}
            >
              {days} {days === 1 ? "day" : "days"} crafted just for you
            </p>
          )}
        </div>
      </div>

      {/* ── Stat tiles overlapping hero ── */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="grid grid-cols-4 gap-2">
          <StatTile label="Days" value={days} icon={<CalendarDays className="h-3 w-3" />} delay="0.4s" />
          <StatTile label="Stops" value={stops} icon={<MapPin className="h-3 w-3" />} delay="0.45s" />
          <StatTile label="Stays" value={data.hotels.length} icon={<Hotel className="h-3 w-3" />} delay="0.5s" />
          <StatTile label="Flights" value={data.flights.length} icon={<Plane className="h-3 w-3" />} delay="0.55s" />
        </div>
      </div>

      {/* ── Day rail teaser ── */}
      {days > 0 && (
        <div className="px-5 pt-5 animate-hero-rise" style={{ animationDelay: "0.6s" }}>
          <DayRailMini itinerary={data.itinerary} />
        </div>
      )}

      {/* divider */}
      <div className="mx-5 mt-5 border-t border-border" />

      {/* Paywall section */}
      <div className="px-5 pt-4 pb-5">
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
            <span className="font-bold text-xs">{prices.symbol}{prices.annualMonthly}<span className="text-muted-foreground font-normal">/mo</span></span>
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
            <span className="font-bold text-xs">{prices.symbol}{prices.monthly}<span className="text-muted-foreground font-normal">/mo</span></span>
          </button>
        </div>

        {/* CTA */}
        <button
          onClick={async () => {
            if (!user) {
              navigate("/auth");
              return;
            }
            setCheckoutLoading(true);
            await startCheckout(selectedPlan);
            setCheckoutLoading(false);
          }}
          disabled={checkoutLoading}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {checkoutLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
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
