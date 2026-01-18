import { Brain, Clock, MapPin, Wallet } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Recommendations",
    description:
      "Get personalized trip suggestions based on your preferences, budget, and travel style.",
  },
  {
    icon: Clock,
    title: "Instant Itineraries",
    description:
      "Receive detailed day-by-day plans in seconds, not hours of research.",
  },
  {
    icon: MapPin,
    title: "Local Insights",
    description:
      "Discover hidden gems and authentic experiences that only locals know about.",
  },
  {
    icon: Wallet,
    title: "Budget Optimization",
    description:
      "Find the best deals on flights, hotels, and activities that fit your budget.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 px-4 bg-card">
      <div className="container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Why Choose <span className="text-gradient">Rzuma</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            We combine AI intelligence with real travel expertise to create
            unforgettable experiences.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group glass-card rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
