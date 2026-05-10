import { Search, Calendar, Ticket } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Tell us where",
    description:
      "Type your destination, dates, and who's coming. That's all we need.",
  },
  {
    icon: Calendar,
    title: "Get your itinerary",
    description:
      "A full day-by-day plan with places to stay, things to do, and where to eat.",
  },
  {
    icon: Ticket,
    title: "Book and go",
    description:
      "Everything links directly to booking. Tweak anything, then hit the road.",
  },
];

const HowItWorks = () => {
  return (
    <section className="bg-[hsl(0_0%_98%)]">
      <div className="container mx-auto px-4 py-16 md:py-28 lg:py-36 max-w-5xl">
        <div className="text-center max-w-xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            How it works
          </h2>
          <p className="mt-3 text-muted-foreground">
            Three steps. One minute. Done.
          </p>
        </div>

        <div className="grid gap-12 md:gap-8 md:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-foreground/5 border border-border flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-foreground" />
                </div>
                <h3 className="text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-[260px]">
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
