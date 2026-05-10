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
    <section className="relative pt-36 pb-24 md:pt-48 md:pb-36 px-4">
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80&auto=format&fit=crop"
          alt=""
          className="h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <div className="relative z-10 container mx-auto max-w-3xl text-center">
        <h1 className="font-sans text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-white">
          Plan your next trip in seconds
        </h1>

        <p className="mt-6 text-base md:text-lg text-white/80 max-w-lg mx-auto leading-relaxed">
          Tell us where you want to go. Get a complete itinerary with flights, hotels, and things to do — ready to book.
        </p>

        {/* Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(query);
          }}
          className="mt-10 flex items-center gap-2 max-w-lg mx-auto border border-white/20 rounded-full pl-5 pr-2 py-2 bg-white/10 backdrop-blur-md hover:bg-white/15 focus-within:bg-white/15 transition-colors"
        >
          <input
            type="text"
            placeholder="Where do you want to go?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent py-2 text-base md:text-lg text-white placeholder:text-white/60 focus:outline-none"
          />
          <Button type="submit" size="lg" className="rounded-full gap-1 bg-white text-black hover:bg-white/90">
            Plan my trip
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <p className="mt-4 text-xs text-white/50">
          Free to try · No credit card required
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
