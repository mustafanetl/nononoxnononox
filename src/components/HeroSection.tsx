import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle2, Zap, MapPin } from "lucide-react";

const HeroSection = () => {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (q: string) => {
    const trimmed = q.trim();
    if (trimmed) navigate(`/chat?q=${encodeURIComponent(trimmed)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(query);
    }
  };

  const examples = [
    "5 days in Tokyo for a couple",
    "Weekend in Barcelona, budget-friendly",
    "10 days Italy → Greece with friends",
    "Family trip to Bali, kid-friendly",
  ];

  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center bg-background px-4 sm:px-6 overflow-hidden">
      {/* Subtle ambient gradient — light mode only */}
      <div
        className="absolute inset-0 pointer-events-none dark:opacity-0 transition-opacity"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, hsl(234 62% 97%) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-2xl mx-auto pt-28 pb-12 sm:pt-32 sm:pb-16 md:pt-40 md:pb-20 flex flex-col items-center text-center">
        {/* Headline */}
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-[-0.03em] text-foreground leading-[1.05]">
          Your next trip.
          <br />
          Planned in seconds.
        </h1>

        <p className="mt-4 sm:mt-5 text-base sm:text-lg text-muted-foreground max-w-md leading-relaxed">
          Tell Jolliday where you want to go. Get a verified itinerary with real
          photos, walking times, and booking links — instantly.
        </p>

        {/* Clean single-line input */}
        <div className="mt-8 sm:mt-10 w-full max-w-xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(query);
            }}
          >
            <div
              className={`flex items-center gap-2 rounded-2xl border-2 bg-card px-4 sm:px-5 h-14 sm:h-16 shadow-lg shadow-black/[0.03] transition-all duration-200 ${
                focused
                  ? "border-primary shadow-xl shadow-primary/10"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <MapPin className="h-5 w-5 text-muted-foreground/50 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder="Where do you want to go?"
                aria-label="Describe your trip"
                className="flex-1 bg-transparent text-[15px] sm:text-base text-foreground placeholder:text-muted-foreground/50 focus:outline-none min-w-0"
              />
              <Button
                type="submit"
                disabled={!query.trim()}
                size="sm"
                className="h-9 sm:h-10 px-4 sm:px-5 rounded-xl gap-1.5 font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm disabled:opacity-30 disabled:shadow-none shrink-0"
              >
                <span className="hidden sm:inline">Plan</span>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>

        {/* Example prompts as pills */}
        <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-2">
          {examples.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => handleSubmit(ex)}
              className="px-3.5 py-1.5 rounded-full border border-border bg-card text-xs sm:text-sm text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 active:scale-95 transition-all"
            >
              {ex}
            </button>
          ))}
        </div>

        {/* Trust indicators */}
        <div className="mt-10 sm:mt-14 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Verified venues</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span>Instant plans</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>Real photos & walking times</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
