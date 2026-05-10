import { Wand2, PiggyBank, MapPin, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Wand2,
    title: "Tailor-made",
    description:
      "Personalized itineraries designed around your preferences, budget, and travel style. Every detail tuned to you.",
  },
  {
    icon: PiggyBank,
    title: "Save money",
    description:
      "Real-time prices on flights, hotels, and activities. Find the best deals and maximize every dollar.",
  },
  {
    icon: MapPin,
    title: "Hidden gems",
    description:
      "Discover off-the-beaten-path spots and local secrets that most tourists never find.",
  },
  {
    icon: ShieldCheck,
    title: "No surprises",
    description:
      "Every flight, hotel, and activity double-checked for accuracy. Focus on memories, not logistics.",
  },
];

const WhyJolliday = () => {
  return (
    <section className="bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-20 md:py-28 lg:py-36 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <p className="text-xs sm:text-sm font-semibold text-primary tracking-[0.15em] uppercase mb-3">
            Why Jolliday
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Everything you need.
            <br className="hidden sm:block" />
            <span className="text-primary">Nothing you don't.</span>
          </h2>
        </div>

        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-white p-6 sm:p-8 flex items-start gap-5 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:border-primary group-hover:scale-110 transition-all duration-300">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary group-hover:text-white transition-colors" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyJolliday;
