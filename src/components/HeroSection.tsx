import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Star } from "lucide-react";

const HeroSection = () => {
  const [query, setQuery] = useState("");
  const [tripCount, setTripCount] = useState(0);
  const navigate = useNavigate();
  const counterRef = useRef<HTMLDivElement>(null);
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

  const handleSubmit = (q: string) => {
    const trimmed = q.trim();
    if (trimmed) navigate(`/chat?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden pt-20 sm:pt-24">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 0%, hsl(234 62% 47% / 0.08) 0%, transparent 65%), linear-gradient(180deg, hsl(0 0% 99.5%) 0%, hsl(0 0% 100%) 100%)",
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

      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-24 lg:py-28">
        <div className="max-w-5xl mx-auto text-center">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-border shadow-sm mb-6 md:mb-8 animate-fade-in">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border-2 border-white"
                  style={{
                    background: `linear-gradient(135deg, hsl(${
                      200 + i * 30
                    } 70% 55%), hsl(${260 + i * 20} 70% 60%))`,
                  }}
                />
              ))}
            </div>
            <span className="text-xs sm:text-sm font-medium text-foreground">
              Trusted by <span className="font-bold">48,000+</span> travellers
            </span>
            <div className="flex gap-0.5 ml-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="h-3 w-3 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
          </div>

          {/* Main headline — larger, more responsive */}
          <h1 className="font-display text-[2.5rem] leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem] font-extrabold tracking-tight text-foreground">
            Plan your dream trip
            <br className="hidden sm:block" />
            <span className="relative inline-block">
              in <span className="text-primary">minutes</span>
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
            <span>,</span>
            <br />
            not weeks.
          </h1>

          {/* Subtitle */}
          <p className="mt-6 md:mt-8 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2">
            Tell us where you want to go. Get a complete itinerary with flights,
            hotels, and things to do — ready to book in under 60 seconds.
          </p>

          {/* Search bar — primary CTA */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(query);
            }}
            className="mt-8 md:mt-10 flex items-center gap-1.5 sm:gap-2 max-w-2xl mx-auto border-2 border-border rounded-full pl-4 sm:pl-6 pr-1.5 sm:pr-2 py-1.5 sm:py-2 bg-white shadow-lg shadow-primary/5 hover:border-primary/30 focus-within:border-primary focus-within:shadow-xl focus-within:shadow-primary/10 transition-all duration-200"
          >
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
            <input
              type="text"
              placeholder="Where do you want to go?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 min-w-0 bg-transparent py-2.5 sm:py-3 text-sm sm:text-base md:text-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            />
            <Button
              type="submit"
              size="lg"
              className="h-11 sm:h-12 px-4 sm:px-6 rounded-full gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 shadow-md font-semibold text-sm sm:text-base"
            >
              <span className="hidden sm:inline">Plan my trip</span>
              <span className="sm:hidden">Plan</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Secondary CTAs */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Free 3-day trial
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              No credit card
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Cancel anytime
            </div>
          </div>

          {/* Try examples */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Try:
            </span>
            {[
              "Weekend in Paris",
              "7 days in Japan",
              "Bali honeymoon",
            ].map((example) => (
              <Link
                key={example}
                to={`/chat?q=${encodeURIComponent(example)}`}
                className="px-3 py-1.5 text-xs sm:text-sm rounded-full border border-border bg-white hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all duration-200 text-muted-foreground"
              >
                {example}
              </Link>
            ))}
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
