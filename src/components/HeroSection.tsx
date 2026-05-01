import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";

const HeroSection = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const suggestions = ["Paris", "Tokyo", "Bali", "Lisbon"];

  const handleSubmit = (q: string) => {
    const trimmed = q.trim();
    if (trimmed) navigate(`/chat?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-12 lg:gap-16 items-start">
        <div className="max-w-4xl">
          <span className="inline-block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6">
            Your AI travel agent
          </span>

          <h1 className="font-sans text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] text-foreground">
            Trips, planned
            <br />
            in a conversation.
          </h1>

          <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
            Tell us where. We handle the flights, the hotels, what to eat, what to skip — in one quiet thread.
          </p>

          {/* Search */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSubmit(query); }}
            className="mt-10 flex items-center gap-2 max-w-xl border border-border rounded-full pl-5 pr-2 py-2 bg-background hover:border-foreground/30 focus-within:border-foreground transition-colors"
          >
            <input
              type="text"
              placeholder="Where do you want to go?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent py-2 text-base md:text-lg text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <Button type="submit" size="lg" className="rounded-full gap-1">
              Plan
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            <span>Try</span>
            {suggestions.map((s, i) => (
              <span key={s} className="flex items-center gap-3">
                <button
                  onClick={() => handleSubmit(`Plan a trip to ${s}`)}
                  className="text-foreground/80 hover:text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors"
                >
                  {s}
                </button>
                {i < suggestions.length - 1 && <span className="text-border">·</span>}
              </span>
            ))}
          </div>

          {/* Social proof strip */}
          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs uppercase tracking-[0.15em] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-foreground text-foreground" />
              <span className="text-foreground font-medium normal-case tracking-normal">4.9</span>
              <span>average rating</span>
            </span>
            <span className="hidden sm:inline text-border">/</span>
            <span>Real places, real photos</span>
            <span className="hidden sm:inline text-border">/</span>
            <span>Plans in under 20 seconds</span>
          </div>
        </div>

        {/* Hero image collage */}
        <div className="hidden lg:grid grid-cols-2 gap-3 mt-2">
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-border row-span-2">
            <img
              src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=900&q=80&auto=format&fit=crop"
              alt="Paris, Eiffel Tower"
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/70">France</div>
              <div className="text-xl font-bold text-white">Paris</div>
            </div>
          </div>
          <div className="relative aspect-square rounded-2xl overflow-hidden border border-border">
            <img
              src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80&auto=format&fit=crop"
              alt="Tokyo skyline"
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/70">Japan</div>
              <div className="text-base font-bold text-white">Tokyo</div>
            </div>
          </div>
          <div className="relative aspect-square rounded-2xl overflow-hidden border border-border">
            <img
              src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80&auto=format&fit=crop"
              alt="Bali rice terraces"
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/70">Indonesia</div>
              <div className="text-base font-bold text-white">Bali</div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
