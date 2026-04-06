import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { getCurrencyPrices } from "@/utils/currencyLocale";
import { useAuth } from "@/hooks/useAuth";
import { startCheckout } from "@/lib/stripeCheckout";
import { useState } from "react";

const PricingSection = () => {
  const prices = getCurrencyPrices();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const plans = [
    {
      name: "Monthly",
      price: `${prices.symbol}${prices.monthly}`,
      period: "/month",
      description: "For frequent travelers",
      features: [
        "Unlimited trip plans",
        "Save trips to your account",
        "PDF export & sharing",
        "Smart packing lists",
        "Multi-city planning",
        "Priority AI responses",
      ],
      cta: "Subscribe Monthly",
      href: "/auth",
      highlighted: false,
      subtextCta: "Cancel anytime",
    },
    {
      name: "Annual",
      price: `${prices.symbol}${prices.annualMonthly}`,
      period: "/month",
      description: "Best value — save over 67%",
      features: [
        "Everything in Monthly",
        "Biggest savings",
        "Priority support",
        "Early access to features",
      ],
      cta: "Subscribe Annually",
      href: "/auth",
      highlighted: true,
      subtextCta: "Cancel anytime",
    },
  ];

  return (
    <section className="container mx-auto px-4 py-16 border-t border-border">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">Simple Pricing</h2>
      <p className="text-muted-foreground text-center mb-10">
        Choose the plan that works for you
      </p>

      <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl border p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
              plan.highlighted
                ? "border-primary bg-card shadow-lg"
                : "border-border bg-card"
            }`}
          >
            <h3 className="text-lg font-bold">{plan.name}</h3>
            <div className="mt-2 mb-1">
              <span className="text-3xl font-bold">{plan.price}</span>
              <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-5">{plan.description}</p>

            <ul className="space-y-2 mb-5 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              className="w-full"
              variant={plan.highlighted ? "default" : "outline"}
              disabled={loadingPlan !== null}
              onClick={async () => {
                if (!user) {
                  navigate("/auth");
                  return;
                }
                const planKey = plan.name.toLowerCase() as "monthly" | "annual";
                setLoadingPlan(planKey);
                await startCheckout(planKey);
                setLoadingPlan(null);
              }}
            >
              {loadingPlan === plan.name.toLowerCase() ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {plan.cta}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center mt-2">
              {plan.subtextCta}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PricingSection;
