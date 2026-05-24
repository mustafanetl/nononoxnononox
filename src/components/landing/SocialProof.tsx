import { Star, MapPin, CheckCircle2, Clock } from "lucide-react";

const highlights = [
  {
    icon: CheckCircle2,
    title: "Every venue verified",
    description:
      "We check every recommendation against Google Places. If it doesn't exist, it doesn't make the plan.",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    icon: MapPin,
    title: "Real photos, real places",
    description:
      "No stock images. Every photo comes from the actual venue, stored on our servers so they never expire.",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    icon: Clock,
    title: "Plans in under 5 seconds",
    description:
      "Pre-cached itineraries mean most plans load instantly. No waiting, no spinning wheels.",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
];

const SocialProof = () => {
  return (
    <section className="bg-[hsl(0_0%_98%)] dark:bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 py-20 md:py-28 lg:py-36 max-w-6xl">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-xs sm:text-sm font-semibold text-primary tracking-[0.15em] uppercase mb-3">
            Why Jolliday
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            10x better than ChatGPT
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-lg mx-auto">
            ChatGPT gives you a text list. Jolliday gives you verified venues, real photos, walking times, maps, and one-click booking.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {highlights.map((h) => (
            <div
              key={h.title}
              className="relative rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div
                className={`w-12 h-12 rounded-xl ${h.bgColor} flex items-center justify-center mb-4`}
              >
                <h.icon className={`h-6 w-6 ${h.color}`} />
              </div>

              <h3 className="text-lg font-bold text-foreground mb-2">
                {h.title}
              </h3>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {h.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
