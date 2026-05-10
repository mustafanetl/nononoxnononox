import { Wand2, PiggyBank, MapPin, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Wand2,
    title: "Tailor-made",
    description:
      "Get a personalized itinerary tailored to your preferences and travel style. Every moment is designed around your unique interests.",
  },
  {
    icon: PiggyBank,
    title: "Cheaper",
    description:
      "Find the best deals on flights, hotels, and activities. Real-time prices mean you always get the most value for your budget.",
  },
  {
    icon: MapPin,
    title: "Hidden Gems",
    description:
      "Discover off-the-beaten-path destinations and local secrets that most tourists never find. Experience places like a local.",
  },
  {
    icon: ShieldCheck,
    title: "No Surprises",
    description:
      "Everything runs smoothly from flights to accommodations. Detailed planning means you can focus on making memories.",
  },
];

const WhyJolliday = () => {
  return (
    <section className="bg-[hsl(0_0%_98%)]">
      <div className="container mx-auto px-4 py-20 md:py-32 lg:py-40 max-w-5xl">
        <div className="text-center max-w-2xl mx-auto mb-14 md:mb-16">
          <p className="text-sm font-semibold text-primary tracking-wide uppercase mb-3">
            Why Jolliday
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            I'll be there for you
            <br className="hidden sm:block" />
            in every step
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-white p-7 flex items-start gap-5 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:scale-105 transition-all duration-300">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-1.5">
                    {f.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
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
