import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Send, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-adventure.jpeg";

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
    <section className="relative min-h-[85vh] flex items-center pt-20 pb-12 px-4">
      <div className="container mx-auto">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
          {/* Text Content */}
          <div className="order-2 lg:order-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6 animate-fade-in">
              <Sparkles className="h-4 w-4" />
              AI-Powered Travel Planning
            </div>

            <h1 className="font-sans text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Your Next Adventure
              <span className="block bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Starts Here</span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Tell Rzuma where you want to go, and our AI will craft the perfect
              trip tailored just for you.
            </p>

            {/* Search Input */}
            <div className="mt-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <form
                onSubmit={(e) => { e.preventDefault(); handleSubmit(query); }}
                className="relative bg-card border border-border rounded-2xl p-2 max-w-xl mx-auto lg:mx-0 shadow-lg"
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
              <div className="mt-4 flex flex-wrap gap-2 justify-center lg:justify-start">
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
          </div>

          {/* Hero Image */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="relative animate-fade-in" style={{ animationDelay: "0.15s" }}>
              <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-3xl transform scale-90 -z-10" />
              <img
                src={heroImage}
                alt="Desert adventure"
                className="w-60 h-60 md:w-72 md:h-72 lg:w-96 lg:h-96 object-cover rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-14 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[
            { value: "50K+", label: "Trips Planned" },
            { value: "120+", label: "Destinations" },
            { value: "4.9★", label: "User Rating" },
          ].map((stat, i) => (
            <div key={stat.label} className="text-center animate-fade-in" style={{ animationDelay: `${0.4 + i * 0.1}s` }}>
              <div className="font-sans text-2xl md:text-3xl font-bold text-foreground">
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
