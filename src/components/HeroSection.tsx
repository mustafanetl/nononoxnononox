import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-adventure.jpeg";

const HeroSection = () => {
  const [query, setQuery] = useState("");

  const suggestions = [
    "Desert safari in Dubai",
    "Beach getaway in Maldives",
    "Mountain trek in Nepal",
  ];

  return (
    <section className="relative min-h-screen hero-bg pt-28 pb-16 px-4">
      <div className="container mx-auto">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
          {/* Text Content */}
          <div className="order-2 lg:order-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6 animate-fade-up">
              <Sparkles className="h-4 w-4" />
              AI-Powered Travel Planning
            </div>

            <h1 className="font-display text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl animate-fade-up animation-delay-100">
              Your Next Adventure
              <span className="block text-gradient">Starts Here</span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 animate-fade-up animation-delay-200">
              Tell Rzuma where you want to go, and our AI will craft the perfect
              trip tailored just for you.
            </p>

            {/* Search Input */}
            <div className="mt-8 animate-fade-up animation-delay-300">
              <div className="relative glass-card rounded-2xl p-2 max-w-xl mx-auto lg:mx-0">
                <input
                  type="text"
                  placeholder="Where do you want to go?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent px-4 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none text-base md:text-lg"
                />
                <Button
                  variant="hero"
                  size="lg"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <Send className="h-5 w-5" />
                  <span className="hidden sm:inline">Plan Trip</span>
                </Button>
              </div>

              {/* Suggestions */}
              <div className="mt-4 flex flex-wrap gap-2 justify-center lg:justify-start">
                <span className="text-sm text-muted-foreground">Try:</span>
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setQuery(suggestion)}
                    className="text-sm text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="relative animate-float-bounce">
              <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-3xl transform scale-90 -z-10" />
              <img
                src={heroImage}
                alt="Desert adventure"
                className="w-72 h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 object-cover rounded-3xl float-shadow"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[
            { value: "50K+", label: "Trips Planned" },
            { value: "120+", label: "Destinations" },
            { value: "4.9★", label: "User Rating" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-2xl md:text-3xl font-bold text-foreground">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
