import { MessageSquare, Calendar, Ticket } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    number: "01",
    title: "Tell me where",
    description:
      "Type your destination, dates, and who's coming. That's all I need to get started.",
  },
  {
    icon: Calendar,
    number: "02",
    title: "Get your itinerary",
    description:
      "A full day-by-day plan with places to stay, things to do, and where to eat — in under a minute.",
  },
  {
    icon: Ticket,
    number: "03",
    title: "Book and go",
    description:
      "Everything links directly to booking. Tweak anything you want, then hit the road.",
  },
];

const HowItWorks = () => {
  return (
    <section className="bg-background relative">
      <div className="container mx-auto px-4 py-20 md:py-32 lg:py-40 max-w-5xl">
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
          <p className="text-sm font-semibold text-primary tracking-wide uppercase mb-3">
            Simple as 1-2-3
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            Your trip in minutes,
            <br className="hidden sm:block" />
            not weeks.
          </h2>
        </div>

        <div className="grid gap-8 md:gap-6 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="relative flex flex-col items-center text-center p-8 rounded-2xl border border-border bg-white hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 group"
              >
                {/* Step number */}
                <span className="absolute top-4 right-4 text-xs font-bold text-muted-foreground/40 tracking-wider">
                  {step.number}
                </span>

                <div className="w-14 h-14 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/10 group-hover:scale-105 transition-all duration-300">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">
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
