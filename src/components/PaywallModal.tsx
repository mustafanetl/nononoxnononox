import { Crown, Check, X, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { startCheckout } from "@/lib/stripeCheckout";
import { useNavigate } from "react-router-dom";
import { getCurrencyPrices } from "@/utils/currencyLocale";
import { toast } from "sonner";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  destination?: string;
  tripStats?: { activities?: number; hotels?: number; days?: number };
}

const features = [
  "View complete trip itineraries",
  "Unlimited trip plans",
  "PDF export & calendar sync",
  "Priority AI responses",
  "Share trips with anyone",
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
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
    >
      <div
        className="relative bg-card border border-border rounded-t-3xl sm:rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto"
        style={{ animationDuration: "0.25s" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Crown className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-foreground" id="paywall-title">
            {hasContext ? `Your ${destination} plan is ready` : "Unlock Premium"}
          </h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
            {hasContext && tripStats ? (
              <>
                {tripStats.days && `${tripStats.days} days`}
                {tripStats.activities && ` · ${tripStats.activities} experiences`}
                {tripStats.hotels && ` · ${tripStats.hotels} hotels`}
              </>
            ) : (
              "Start your free trial to unlock everything"
            )}
          </p>
        </div>

        {/* Features */}
        <ul className="space-y-2.5 mb-6">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm text-foreground">
              <Check className="h-4 w-4 text-primary shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        {/* Plan selection */}
        <div className="space-y-2.5 mb-5">
          {plans.map((p) => (
            <button
              key={p.name}
              onClick={() => setSelected(p.name)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                selected === p.name
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/20 hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selected === p.name ? "border-primary" : "border-muted-foreground/30"
                }`}>
                  {selected === p.name && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
                <span className="font-semibold text-sm">{p.label}</span>
                {p.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">
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
            try {
              await startCheckout(selected as "monthly" | "annual");
            } catch {
              toast.error("Something went wrong. Please try again.");
            }
            setCheckoutLoading(false);
          }}
          disabled={checkoutLoading}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-primary/20"
        >
          {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Start Free Trial — 3 Days Free
        </button>

        {/* Trust line */}
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          Cancel anytime · No commitment · Secure payment via Stripe
        </p>
      </div>
    </div>
  );
};

export default PaywallModal;
