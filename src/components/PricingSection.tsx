import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    monthly: 0,
    annual: 0,
    period: "forever",
    description: "Try Rzuma risk-free",
    features: [
      "3 trip plans per month",
      "Flight & hotel suggestions",
      "Activity recommendations",
      "Basic itineraries",
    ],
    cta: "Get Started",
    href: "/chat",
    highlighted: false,
  },
  {
    name: "Pro",
    monthly: 10,
    annual: 8,
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
    cta: "Start Pro Trial",
    href: "/auth",
    highlighted: true,
  },
  {
    name: "Lifetime",
    monthly: 50,
    annual: 50,
    period: "one-time",
    description: "Pay once, plan forever",
    features: [
      "Everything in Pro",
      "Lifetime access",
      "Early access to new features",
      "Collaborative trip planning",
      "Cost splitting tools",
    ],
    cta: "Get Lifetime",
    href: "/auth",
    highlighted: false,
  },
];

const PricingSection = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section className="container mx-auto px-4 py-16 border-t border-border">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">Simple Pricing</h2>
      <p className="text-muted-foreground text-center mb-6">
        Start free, upgrade when you're ready
      </p>

      {/* Toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <span className={`text-sm font-medium ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
        <button
          onClick={() => setIsAnnual(!isAnnual)}
          className={`relative w-12 h-6 rounded-full transition-colors ${isAnnual ? "bg-primary" : "bg-input"}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background shadow transition-transform ${isAnnual ? "translate-x-6" : "translate-x-0"}`} />
        </button>
        <span className={`text-sm font-medium ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
          Annual
        </span>
        {isAnnual && (
          <Badge variant="default" className="text-[10px] px-2 py-0.5 bg-primary text-primary-foreground">
            Save 20%
          </Badge>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {plans.map((plan) => {
          const price = plan.name === "Lifetime"
            ? "$50"
            : plan.monthly === 0
              ? "$0"
              : isAnnual ? `$${plan.annual}` : `$${plan.monthly}`;

          return (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                plan.highlighted
                  ? "border-primary bg-card shadow-xl ring-1 ring-primary/20 scale-[1.02]"
                  : "border-border bg-card"
              }`}
            >
              {plan.highlighted && (
                <span className="text-xs font-semibold bg-foreground text-background px-3 py-1 rounded-full self-start mb-4">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <div className="mt-2 mb-1">
                <span className="text-3xl font-bold">{price}</span>
                <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>

              <ul className="space-y-2.5 mb-6 flex-1">
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
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PricingSection;
