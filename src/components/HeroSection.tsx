import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Play, Send } from "lucide-react";

const HeroSection = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (q: string) => {
    const trimmed = q.trim();
    if (trimmed) navigate(`/chat?q=${encodeURIComponent(trimmed)}`);
  };

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(query);
    }
  };

  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center bg-background px-4 sm:px-6 overflow-hidden">
      {/* Subtle ambient gradient */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 120% 80% at 50% -20%, hsl(234 62% 96%) 0%, transparent 60%)" }} />

      <div className="relative w-full max-w-3xl mx-auto pt-28 pb-12 sm:pt-32 sm:pb-16 md:pt-40 md:pb-20 flex flex-col items-center text-center">
        {/* Social proof chip */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-medium mb-6 animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Instant AI-powered trip plans
        </div>

        {/* Headline */}
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-[-0.03em] text-foreground leading-[1.05]">
          Any trip.
          <br />
          <span className="text-primary">
            In one chat.
          </span>
        </h1>

        <p className="mt-4 sm:mt-5 text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed">
          Tell Jolliday where you want to go. Get a complete itinerary with real flights, verified hotels, and day-by-day plans — in under 60 seconds.
        </p>

        {/* Big text box */}
        <div className="mt-8 sm:mt-10 w-full">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(query);
            }}
          >
            <div className="rounded-2xl border-2 border-border bg-card shadow-xl shadow-black/[0.04] hover:border-primary/40 focus-within:border-primary focus-within:shadow-2xl focus-within:shadow-primary/10 transition-all duration-200">
              <textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. 5 days in Tokyo for a couple, mid-range budget, love food and culture"
                aria-label="Describe your trip"
                rows={3}
                className="w-full px-4 sm:px-6 pt-4 sm:pt-5 pb-2 sm:pb-3 text-[15px] sm:text-lg text-foreground placeholder:text-muted-foreground/50 bg-transparent focus:outline-none resize-none leading-relaxed min-h-[100px] sm:min-h-[120px] max-h-[160px]"
              />
              <div className="flex items-center justify-between px-3 sm:px-4 pb-3 sm:pb-4">
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Press Enter to plan · Free to try
                </p>
                <Button
                  type="submit"
                  disabled={!query.trim()}
                  className="h-10 sm:h-11 px-5 sm:px-7 rounded-xl gap-2 font-semibold text-sm sm:text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-md disabled:opacity-40 disabled:shadow-none ml-auto"
                >
                  Plan my trip
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Route-style example chips */}
        <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-2">
          {[
            "3 days in Barcelona for 2",
            "Tokyo → Kyoto for a week",
            "Weekend in Amsterdam, budget-friendly",
          ].map((ex) => (
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

        {/* Trust bar */}
        <div className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>AI-verified venues</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Play className="h-3.5 w-3.5 text-primary" />
            <span>Real-time prices</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowRight className="h-3.5 w-3.5 text-primary" />
            <span>Book in one click</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
