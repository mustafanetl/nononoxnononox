import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const HeroSection = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (q: string) => {
    const trimmed = q.trim();
    if (trimmed) navigate(`/chat?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <section
      className="relative pt-28 pb-16 md:pt-[200px] md:pb-[120px] lg:pt-[240px] lg:pb-[140px] px-4 min-h-[70vh] md:min-h-[85vh] flex items-center"
      style={{ background: "linear-gradient(180deg, hsl(0 0% 97%), hsl(0 0% 100%))" }}
    >
      <div className="relative z-10 container mx-auto max-w-3xl text-center">
        <h1 className="font-sans text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-foreground">
          Plan your next trip in seconds
        </h1>

        <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Tell us where you want to go. Get a complete itinerary with flights, hotels, and things to do — ready to book.
        </p>

        {/* Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(query);
          }}
          className="mt-10 flex items-center gap-2 max-w-lg mx-auto border border-border rounded-full pl-4 sm:pl-5 pr-2 py-2 bg-white shadow-sm transition-colors"
        >
          <input
            type="text"
            placeholder="Where do you want to go?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 min-w-0 bg-transparent py-2 text-base md:text-lg text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <Button type="submit" size="lg" className="min-h-[44px] min-w-[44px] rounded-full gap-1 bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
            <span className="hidden sm:inline">Plan my trip</span>
            <span className="sm:hidden">Go</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <p className="mt-4 text-xs text-muted-foreground">
          Free to try · No credit card required
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
