import { MessageSquare, Calendar, Ticket } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    number: "01",
    title: "Tell us where",
    description:
      "Type your destination, dates, and who's coming along. That's all we need to get started.",
  },
  {
    icon: Calendar,
    number: "02",
    title: "Get your itinerary",
    description:
      "A full day-by-day plan with hotels, things to do, and where to eat — in under 60 seconds.",
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
      <div className="container mx-auto px-4 sm:px-6 py-20 md:py-28 lg:py-36 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-14 md:mb-20">
          <p className="text-xs sm:text-sm font-semibold text-primary tracking-[0.15em] uppercase mb-3">
            Simple as 1-2-3
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Your trip in minutes,
            <br className="hidden sm:block" />
            <span className="text-primary">not weeks.</span>
          </h2>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Skip the spreadsheets and 50 browser tabs. Just chat with us.
          </p>
        </div>

        <div className="grid gap-6 md:gap-8 md:grid-cols-3 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-[3.75rem] left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="relative flex flex-col items-center text-center p-6 sm:p-8 rounded-2xl border border-border bg-white hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1 transition-all duration-300 group"
              >
                {/* Step number */}
                <span className="absolute top-4 right-5 text-xs font-bold text-muted-foreground/30 tracking-wider">
                  {step.number}
                </span>

                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary group-hover:border-primary group-hover:scale-110 transition-all duration-300">
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2.5">
                  {step.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-[280px]">
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
