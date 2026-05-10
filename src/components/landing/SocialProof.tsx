import { Star, Quote } from "lucide-react";

const reviews = [
  {
    quote:
      "Planned our Bali honeymoon in 3 minutes. Would have taken hours on my own. The itinerary was perfect.",
    name: "Sofia M.",
    detail: "Honeymoon · Bali",
    avatar: "S",
    color: "from-pink-400 to-rose-500",
  },
  {
    quote:
      "Every recommendation for my Japan trip was spot on. Genuinely impressed by how accurate it was.",
    name: "James T.",
    detail: "Solo · Tokyo",
    avatar: "J",
    color: "from-blue-400 to-indigo-500",
  },
  {
    quote:
      "Finally something that gives me a real plan, not just a list of ideas. Booked everything in one sitting.",
    name: "Priya K.",
    detail: "Family · Europe",
    avatar: "P",
    color: "from-amber-400 to-orange-500",
  },
];

const SocialProof = () => {
  return (
    <section className="bg-[hsl(0_0%_98%)]">
      <div className="container mx-auto px-4 sm:px-6 py-20 md:py-28 lg:py-36 max-w-6xl">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-xs sm:text-sm font-semibold text-primary tracking-[0.15em] uppercase mb-3">
            Testimonials
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Loved by travellers
          </h2>
          <div className="mt-5 flex items-center justify-center gap-1.5">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4 sm:h-5 sm:w-5 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
            <span className="text-sm sm:text-base text-muted-foreground font-medium ml-1">
              4.9/5 from 2,400+ reviews
            </span>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {reviews.map((r) => (
            <div
              key={r.name}
              className="relative rounded-2xl border border-border bg-white p-6 sm:p-8 flex flex-col hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1 transition-all duration-300"
            >
              <Quote className="absolute top-6 right-6 h-8 w-8 text-primary/10" />

              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>

              <p className="text-sm sm:text-base text-foreground leading-relaxed flex-1 relative z-10">
                "{r.quote}"
              </p>

              <div className="mt-6 flex items-center gap-3 pt-5 border-t border-border">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${r.color} flex items-center justify-center text-sm font-bold text-white shadow-sm`}
                >
                  {r.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {r.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{r.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
