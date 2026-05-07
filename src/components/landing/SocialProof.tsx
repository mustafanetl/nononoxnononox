const reviews = [
  {
    quote: "Planned our Bali honeymoon in 3 minutes. Would have taken me hours on my own.",
    name: "Sofia M.",
    country: "Spain",
  },
  {
    quote: "Finally an AI travel tool that actually gives real suggestions, not just generic tips.",
    name: "James T.",
    country: "United Kingdom",
  },
  {
    quote: "Used it for a solo Japan trip. Every single recommendation was spot on.",
    name: "Priya K.",
    country: "India",
  },
];

const Stars = ({ className = "" }: { className?: string }) => (
  <span className={`text-amber-400 tracking-wider ${className}`} aria-label="5 out of 5 stars">
    ★★★★★
  </span>
);

const SocialProof = () => {
  return (
    <section className="border-t border-border">
      <div className="container mx-auto px-4 py-20 md:py-24 max-w-6xl">
        <p className="text-center text-sm text-muted-foreground">
          <Stars className="mr-2" />
          Loved by travellers across 80+ countries
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {reviews.map((r) => (
            <div
              key={r.name}
              className="rounded-2xl border border-border bg-card p-6 flex flex-col"
            >
              <Stars />
              <p className="mt-4 text-base text-foreground italic leading-relaxed flex-1">
                "{r.quote}"
              </p>
              <p className="mt-5 text-sm text-muted-foreground">
                {r.name} — {r.country}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;