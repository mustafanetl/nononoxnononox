import { MapPin, Sparkles, Briefcase } from "lucide-react";

const steps = [
  {
    icon: MapPin,
    title: "Tell us your trip",
    description:
      "Enter your destination, dates, budget, and travel style — just type it naturally.",
  },
  {
    icon: Sparkles,
    title: "AI builds your plan",
    description:
      "Get a full day-by-day itinerary with flights, hotels, and activities in seconds.",
  },
  {
    icon: Briefcase,
    title: "Book and go",
    description:
      "Browse your plan, tweak anything you want, and book with one click.",
  },
];

const HowItWorks = () => {
  return (
    <section className="border-t border-b border-border">
      <div className="container mx-auto px-4 py-20 md:py-28 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            How it works
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            From idea to full itinerary in under 60 seconds
          </p>
        </div>

        <div className="mt-14 grid gap-10 md:gap-8 md:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <div className="w-14 h-14 rounded-2xl border border-border bg-card flex items-center justify-center">
                    <Icon className="h-6 w-6 text-foreground" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-foreground text-background text-xs font-semibold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;