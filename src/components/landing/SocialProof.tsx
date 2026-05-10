const reviews = [
  {
    quote: "Planned our Bali honeymoon in 3 minutes. Would have taken hours on my own.",
    name: "Sofia M.",
    country: "Spain",
  },
  {
    quote: "Every recommendation for my Japan trip was spot on. Genuinely impressed.",
    name: "James T.",
    country: "United Kingdom",
  },
  {
    quote: "Finally something that gives me a real plan, not just a list of ideas.",
    name: "Priya K.",
    country: "India",
  },
];

const SocialProof = () => {
  return (
    <section className="bg-background">
      <div className="container mx-auto px-4 py-20 md:py-24 max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Loved by travellers
          </h2>
          <p className="mt-3 text-muted-foreground">
            Join thousands planning smarter trips.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {reviews.map((r) => (
            <div
              key={r.name}
              className="rounded-2xl border border-border bg-card p-6 flex flex-col"
            >
              <p className="text-base text-foreground leading-relaxed flex-1">
                "{r.quote}"
              </p>
              <p className="mt-5 text-sm text-muted-foreground">
                {r.name} · {r.country}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
