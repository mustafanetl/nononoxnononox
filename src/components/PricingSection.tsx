import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Monthly",
    price: "$12.99",
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
    price: "$49.99",
    period: "/year",
    description: "Best value — save over 67%",
    features: [
      "Everything in Monthly",
      "Save $106/year vs monthly",
      "Priority support",
      "Early access to features",
    ],
    cta: "Subscribe Annually",
    href: "/auth",
    highlighted: true,
    subtextCta: "Cancel anytime",
  },
];

const PricingSection = () => {
  return (
    <section className="container mx-auto px-4 py-16 border-t border-border">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">Simple Pricing</h2>
      <p className="text-muted-foreground text-center mb-10">
        Start with a 3-day free trial
      </p>

      <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl border p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
              plan.highlighted
                ? "border-primary bg-card shadow-xl ring-2 ring-primary/30 scale-[1.03]"
                : "border-border bg-card"
            }`}
          >
            {plan.highlighted && (
              <span className="text-xs font-bold bg-primary text-primary-foreground px-3 py-1 rounded-full self-start mb-3">
                Recommended
              </span>
            )}
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

            <Link to={plan.href}>
              <Button
                className="w-full"
                variant={plan.highlighted ? "default" : "outline"}
              >
                {plan.cta}
              </Button>
            </Link>
            <p className="text-[11px] text-muted-foreground text-center mt-2">
              {plan.subtextCta}
            </p>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-6">
        Prices shown in USD. Local currency pricing available at checkout.
      </p>
    </section>
  );
};

export default PricingSection;
