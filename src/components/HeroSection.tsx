import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Send, Shield, Clock, Zap } from "lucide-react";

const HeroSection = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const suggestions = [
    "Desert safari in Dubai",
    "Beach getaway in Maldives",
    "Mountain trek in Nepal",
  ];

  const handleSubmit = (q: string) => {
    const trimmed = q.trim();
    if (trimmed) navigate(`/chat?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <section className="relative min-h-[70vh] flex items-center pt-20 pb-12 px-4">
      <div className="container mx-auto max-w-3xl text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6 animate-fade-in">
          <Zap className="h-4 w-4" />
          AI-Powered Travel Planning
        </div>

        <h1 className="font-sans text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl animate-fade-in" style={{ animationDelay: "0.1s" }}>
          Plan Any Trip in
          <span className="block bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">60 Seconds</span>
        </h1>

        <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
          AI-powered itineraries with real flights, hotels, and activities — personalized to you.
        </p>

        {/* Search Input */}
        <div className="mt-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <form
            onSubmit={(e) => { e.preventDefault(); handleSubmit(query); }}
            className="relative bg-card border border-border rounded-2xl p-2 max-w-xl mx-auto shadow-lg"
          >
            <input
              type="text"
              placeholder="Where do you want to go?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent px-4 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none text-base md:text-lg"
            />
            <Button
              type="submit"
              variant="default"
              size="lg"
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <Send className="h-5 w-5" />
              <span className="hidden sm:inline">Plan Trip</span>
            </Button>
          </form>

          {/* Suggestions */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <span className="text-sm text-muted-foreground">Try:</span>
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSubmit(suggestion)}
                className="text-sm text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-3 gap-4 max-w-lg mx-auto animate-fade-in" style={{ animationDelay: "0.4s" }}>
          {[
            { icon: Shield, value: "50K+", label: "Trips Planned" },
            { icon: Clock, value: "120+", label: "Destinations" },
            { icon: Zap, value: "4.9★", label: "User Rating" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-sans text-2xl md:text-3xl font-bold text-foreground">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Social Proof Strip */}
        <div className="mt-8 animate-fade-in" style={{ animationDelay: "0.5s" }}>
          <p className="text-xs text-muted-foreground tracking-wide uppercase">
            Trusted by travelers from <span className="font-semibold text-foreground/70">Google</span> · <span className="font-semibold text-foreground/70">Apple</span> · <span className="font-semibold text-foreground/70">Amazon</span> · <span className="font-semibold text-foreground/70">Meta</span> · <span className="font-semibold text-foreground/70">Microsoft</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
