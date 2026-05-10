import { Star } from "lucide-react";

const reviews = [
  {
    quote:
      "Planned our Bali honeymoon in 3 minutes. Would have taken hours on my own. The itinerary was perfect.",
    name: "Sofia M.",
    detail: "Honeymoon · Bali",
    avatar: "S",
  },
  {
    quote:
      "Every recommendation for my Japan trip was spot on. Genuinely impressed by how accurate it was.",
    name: "James T.",
    detail: "Solo · Tokyo",
    avatar: "J",
  },
  {
    quote:
      "Finally something that gives me a real plan, not just a list of ideas. Booked everything in one sitting.",
    name: "Priya K.",
    detail: "Family · Europe",
    avatar: "P",
  },
];

const SocialProof = () => {
  return (
    <section className="bg-background">
      <div className="container mx-auto px-4 py-20 md:py-32 lg:py-40 max-w-5xl">
        <div className="text-center mb-14 md:mb-16">
          <p className="text-sm font-semibold text-primary tracking-wide uppercase mb-3">
            Testimonials
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            What travellers say
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {reviews.map((r) => (
            <div
              key={r.name}
              className="rounded-2xl border border-border bg-white p-7 flex flex-col hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>

              <p className="text-sm md:text-base text-foreground leading-relaxed flex-1">
                "{r.quote}"
              </p>

              <div className="mt-6 flex items-center gap-3 pt-4 border-t border-border">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  {r.avatar}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
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
