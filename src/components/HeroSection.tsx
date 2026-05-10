import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowUp,
  Sparkles,
  Star,
  MapPin,
  Plane,
  Calendar,
  Users,
} from "lucide-react";

const suggestions = [
  { icon: MapPin, label: "Weekend in Paris", query: "Plan a weekend in Paris" },
  { icon: Plane, label: "7 days in Japan", query: "Plan 7 days in Japan" },
  { icon: Calendar, label: "Bali honeymoon", query: "Plan a Bali honeymoon" },
  {
    icon: Users,
    label: "Family Europe trip",
    query: "Plan a family trip to Europe",
  },
];

const HeroSection = () => {
  const [query, setQuery] = useState("");
  const [tripCount, setTripCount] = useState(0);
  const navigate = useNavigate();
  const counterRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasAnimated = useRef(false);

  const TARGET_COUNT = 48293;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          animateCounter();
        }
      },
      { threshold: 0.3 }
    );

    if (counterRef.current) observer.observe(counterRef.current);
    return () => observer.disconnect();
  }, []);

  const animateCounter = () => {
    const duration = 2000;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setTripCount(Math.floor(eased * TARGET_COUNT));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [query]);

  const handleSubmit = (q: string) => {
    const trimmed = q.trim();
    if (trimmed) navigate(`/chat?q=${encodeURIComponent(trimmed)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(query);
    }
  };

  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden pt-20 sm:pt-24">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 70% at 50% 0%, hsl(234 62% 47% / 0.09) 0%, transparent 65%), linear-gradient(180deg, hsl(0 0% 99.5%) 0%, hsl(0 0% 100%) 100%)",
        }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(0 0% 0%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 0%) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Decorative blurred orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main headline */}
          <h1 className="font-display text-[2.75rem] leading-[1.02] sm:text-[3.5rem] md:text-[4.5rem] lg:text-[5.5rem] xl:text-[6.25rem] font-extrabold tracking-[-0.03em] text-foreground animate-fade-in">
            Plan your dream trip
            <br />
            in{" "}
            <span className="relative inline-block">
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, hsl(234 62% 52%), hsl(260 70% 60%))",
                }}
              >
                minutes
              </span>
              <svg
                className="absolute -bottom-1 sm:-bottom-2 left-0 w-full h-3 text-primary/40"
                viewBox="0 0 200 12"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 8 C50 2, 150 2, 198 8"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            .
          </h1>

          {/* Subtitle */}
          <p className="mt-6 md:mt-8 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2">
            Tell me where you want to go. I'll build a complete itinerary with
            flights, hotels, and things to do — ready to book in 60 seconds.
          </p>

          {/* BIG composer-style input (Layla-style) */}
          <div className="mt-10 md:mt-12 max-w-2xl mx-auto">
            <div className="relative rounded-3xl border-2 border-border bg-white shadow-[0_4px_24px_-4px_rgba(45,66,179,0.08)] hover:border-primary/30 focus-within:border-primary focus-within:shadow-[0_8px_40px_-8px_rgba(45,66,179,0.25)] transition-all duration-200">
              {/* Label above */}
              <div className="flex items-center gap-2 px-5 pt-4 pb-1">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-primary tracking-wide uppercase">
                  Tell me about your trip
                </span>
              </div>

              <textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Plan a 5-day trip to Japan for a couple in April with a mid-range budget..."
                rows={2}
                className="w-full px-5 pt-2 pb-3 text-base sm:text-lg text-foreground placeholder:text-muted-foreground/50 bg-transparent focus:outline-none resize-none leading-relaxed min-h-[80px] max-h-[200px]"
              />

              {/* Action row */}
              <div className="flex items-center justify-between gap-3 px-3 pb-3 pt-1">
                {/* Quick pills on the left */}
                <div className="hidden sm:flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto scrollbar-hide pl-2">
                  {suggestions.slice(0, 3).map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => setQuery(s.query)}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground bg-foreground/[0.03] hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-all"
                      >
                        <Icon className="h-3 w-3" />
                        {s.label}
                      </button>
                    );
                  })}
                </div>

                {/* Submit button */}
                <Button
                  type="button"
                  onClick={() => handleSubmit(query)}
                  disabled={!query.trim()}
                  size="lg"
                  className="h-12 px-5 rounded-2xl gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 shadow-md font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: query.trim()
                      ? "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))"
                      : undefined,
                  }}
                >
                  <span className="hidden sm:inline">Plan my trip</span>
                  <ArrowUp className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Mobile suggestions — below input */}
            <div className="sm:hidden mt-4 flex gap-2 overflow-x-auto scrollbar-hide px-1">
              {suggestions.slice(0, 3).map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => handleSubmit(s.query)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium text-muted-foreground bg-white border border-border hover:border-primary/30 hover:text-primary transition-all"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Free 3-day trial
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Cancel anytime
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Instant results
            </div>
          </div>

          {/* Stats */}
          <div
            ref={counterRef}
            className="mt-12 md:mt-16 flex items-center justify-center gap-4 sm:gap-8 md:gap-12"
          >
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground tabular-nums">
                {tripCount.toLocaleString()}+
              </div>
              <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                Trips Planned
              </div>
            </div>
            <div className="w-px h-8 sm:h-10 bg-border" />
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground">
                &lt;60s
              </div>
              <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                Avg Plan Time
              </div>
            </div>
            <div className="w-px h-8 sm:h-10 bg-border" />
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground flex items-center justify-center gap-1">
                4.9
                <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-amber-400 text-amber-400" />
              </div>
              <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                Avg Rating
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
