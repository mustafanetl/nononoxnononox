import { Crown, Check, X, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { startCheckout } from "@/lib/stripeCheckout";
import { useNavigate } from "react-router-dom";
import { getCurrencyPrices } from "@/utils/currencyLocale";
import TrustLine from "./TrustLine";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  destination?: string;
  tripStats?: { activities?: number; hotels?: number; days?: number };
}

const features = [
  "View complete trip itineraries",
  "Unlimited trip plans",
  "PDF export & sharing",
  "Smart packing lists",
  "Priority AI responses",
];

const PaywallModal = ({ open, onClose, destination, tripStats }: PaywallModalProps) => {
  const [selected, setSelected] = useState("annual");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const prices = getCurrencyPrices();

  if (!open) return null;

  const hasContext = destination && destination.length > 0;

  const plans = [
    { name: "annual", price: `${prices.symbol}${prices.annualMonthly}`, period: "/mo", label: "Annual", badge: "Save 67%" },
    { name: "monthly", price: `${prices.symbol}${prices.monthly}`, period: "/mo", label: "Monthly", badge: null },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="relative bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in"
        style={{ animationDuration: "0.25s" }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground">
            {hasContext ? `Your ${destination} plan is ready 🔥` : "Unlock Premium"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {hasContext && tripStats ? (
              <>
                {tripStats.days && `${tripStats.days} days · `}
                {tripStats.activities && `${tripStats.activities} experiences · `}
                {tripStats.hotels && `${tripStats.hotels} hotels`}
                {" — all waiting for you"}
              </>
            ) : (
              "Start your 3-day free trial to unlock everything"
            )}
          </p>
        </div>

        {/* Features */}
        <ul className="space-y-2 mb-5">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-foreground">
              <Check className="h-4 w-4 text-primary shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        {/* Plan selection */}
        <div className="space-y-2 mb-4">
          {plans.map((p) => (
            <button
              key={p.name}
              onClick={() => setSelected(p.name)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                selected === p.name
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  selected === p.name ? "border-primary" : "border-muted-foreground/30"
                }`}>
                  {selected === p.name && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <span className="font-semibold text-sm">{p.label}</span>
                {p.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">
                    {p.badge}
                  </span>
                )}
              </div>
              <span className="font-bold text-sm">{p.price}<span className="text-muted-foreground font-normal">{p.period}</span></span>
            </button>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={async () => {
            if (!user) {
              onClose();
              navigate("/auth");
              return;
            }
            setCheckoutLoading(true);
            await startCheckout(selected as "monthly" | "annual");
            setCheckoutLoading(false);
          }}
          disabled={checkoutLoading}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Start Free Trial — 3 Days Free
        </button>
        <TrustLine />

        {/* Social proof + fine print */}
        <div className="mt-3 text-center space-y-1">
          <p className="text-[11px] text-muted-foreground">
            Join 2,000+ travelers planning smarter trips
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaywallModal;
