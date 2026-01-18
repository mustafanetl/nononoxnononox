const steps = [
  {
    number: "01",
    title: "Tell Us Your Dream",
    description:
      "Share your travel preferences, dates, budget, and what kind of experiences you're looking for.",
  },
  {
    number: "02",
    title: "AI Creates Your Plan",
    description:
      "Our AI analyzes thousands of options to craft a personalized itinerary perfect for you.",
  },
  {
    number: "03",
    title: "Book & Explore",
    description:
      "Review your trip, make adjustments, book with confidence, and set off on your adventure.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            How It <span className="text-gradient">Works</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Planning your perfect trip has never been easier.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="relative text-center">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/50 to-primary/10" />
              )}

              <div className="relative z-10">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-display text-xl font-bold mb-4 animate-pulse-glow">
                  {step.number}
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
