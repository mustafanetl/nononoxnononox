import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Send, ChevronDown } from "lucide-react";

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

  const scrollToHowItWorks = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[60vh] flex items-center pt-28 pb-12 px-4">
      <div className="container mx-auto max-w-3xl text-center">
        <h1 className="font-sans text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl animate-fade-in">
          Plan Any Trip in <span className="text-primary">60 Seconds</span>
        </h1>

        <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto animate-fade-in" style={{ animationDelay: "0.1s" }}>
          AI-powered itineraries with real flights, hotels, and activities — personalized to you.
        </p>

        {/* Search Input */}
        <div className="mt-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
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

          <p className="mt-4 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.25s" }}>
            Start with a 3-day free trial
          </p>
        </div>

        {/* See how it works */}
        <button
          onClick={scrollToHowItWorks}
          className="mt-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          See how it works
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
};

export default HeroSection;
