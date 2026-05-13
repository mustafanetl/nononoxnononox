import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center bg-white px-4 sm:px-6">
      <div className="w-full max-w-3xl mx-auto pt-28 pb-12 sm:pt-32 sm:pb-16 md:pt-40 md:pb-20 flex flex-col items-center text-center">
        {/* Headline */}
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-[-0.03em] text-foreground leading-[1.05]">
          Any trip.
          <br />
          In one chat.
        </h1>

        {/* Big text box */}
        <div className="mt-10 sm:mt-14 md:mt-16 w-full">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(query);
            }}
          >
            <div className="rounded-2xl border-2 border-border bg-white shadow-xl shadow-black/[0.04] hover:border-primary/40 focus-within:border-primary focus-within:shadow-2xl focus-within:shadow-primary/10 transition-all duration-200">
              <textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your dream trip... e.g. 5 days in Tokyo for a couple, mid-range budget"
                rows={3}
                className="w-full px-4 sm:px-6 pt-4 sm:pt-5 pb-2 sm:pb-3 text-[15px] sm:text-lg text-foreground placeholder:text-muted-foreground/50 bg-transparent focus:outline-none resize-none leading-relaxed min-h-[100px] sm:min-h-[120px] max-h-[160px]"
              />
              <div className="flex items-center justify-between px-3 sm:px-4 pb-3 sm:pb-4">
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Press Enter to plan
                </p>
                <Button
                  type="submit"
                  disabled={!query.trim()}
                  className="h-10 sm:h-11 px-4 sm:px-6 rounded-xl gap-2 font-semibold text-sm sm:text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-md disabled:opacity-40 disabled:shadow-none ml-auto"
                >
                  Plan my trip
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Route-style example chips */}
        <div className="mt-5 sm:mt-6 flex flex-wrap items-center justify-center gap-2">
          {[
            "Stockholm → Amsterdam for 2 days",
            "Tokyo → Kyoto for a week",
            "NYC → Lisbon, long weekend",
          ].map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => handleSubmit(ex)}
              className="px-3.5 py-1.5 rounded-full border border-border bg-white text-xs sm:text-sm text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 active:scale-95 transition-all"
            >
              {ex}
            </button>
          ))}
        </div>

        {/* Action links */}
        <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <Link to="/chat">
            <Button
              variant="ghost"
              className="h-10 sm:h-12 px-4 sm:px-6 rounded-full text-sm font-medium gap-1.5 text-foreground hover:bg-foreground/5"
            >
              <ArrowRight className="h-4 w-4 text-primary" />
              Create a new trip
            </Button>
          </Link>
          <Link to="/chat?q=Inspire me where to go">
            <Button
              variant="ghost"
              className="h-10 sm:h-12 px-4 sm:px-6 rounded-full text-sm font-medium gap-1.5 text-foreground hover:bg-foreground/5"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              Inspire me
            </Button>
          </Link>
          <Link to="/chat?q=What can you help me with?">
            <Button
              variant="ghost"
              className="h-10 sm:h-12 px-4 sm:px-6 rounded-full text-sm font-medium gap-1.5 text-foreground hover:bg-foreground/5"
            >
              <Play className="h-4 w-4 text-primary" />
              See how I help
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
