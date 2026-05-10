import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Play } from "lucide-react";

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
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, hsl(234 62% 47% / 0.06) 0%, transparent 70%), linear-gradient(180deg, hsl(0 0% 99%) 0%, hsl(0 0% 100%) 100%)",
        }}
      />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(0 0% 0%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 0%) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-16 md:pt-32 md:pb-24 lg:pt-40 lg:pb-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 mb-8 animate-fade-in">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary tracking-wide">
              AI-Powered Trip Planning
            </span>
          </div>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-extrabold tracking-tight leading-[1.05] text-foreground">
            Your trip. Planned
            <br className="hidden sm:block" />
            <span className="relative">
              {" "}in minutes.
              <svg
                className="absolute -bottom-2 left-0 w-full h-3 text-primary/30"
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
          </h1>

          {/* Subtitle */}
          <p className="mt-6 md:mt-8 text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Tell us where you want to go. Get a complete itinerary with flights,
            hotels, and things to do — ready to book. No more juggling tabs.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link to="/chat">
              <Button
                size="lg"
                className="h-14 px-8 rounded-full text-base font-semibold gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 press-bounce"
              >
                Create a new trip
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/chat?q=Inspire me where to go">
              <Button
                variant="outline"
                size="lg"
                className="h-14 px-8 rounded-full text-base font-semibold gap-2 border-border hover:bg-foreground/5 press-bounce"
              >
                <Play className="h-4 w-4" />
                Inspire me
              </Button>
            </Link>
          </div>

          {/* Search bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(query);
            }}
            className="mt-8 flex items-center gap-2 max-w-xl mx-auto border border-border rounded-full pl-5 pr-2 py-2 bg-white shadow-sm hover:border-foreground/20 focus-within:border-primary/40 focus-within:shadow-md focus-within:shadow-primary/5 transition-all duration-200"
          >
            <input
              type="text"
              placeholder="Where do you want to go?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 min-w-0 bg-transparent py-2 text-base md:text-lg text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
            />
            <Button
              type="submit"
              size="lg"
              className="min-h-[44px] min-w-[44px] rounded-full gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 shadow-sm"
            >
              <span className="hidden sm:inline">Plan my trip</span>
              <span className="sm:hidden">Go</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Trip counter */}
          <div
            ref={counterRef}
            className="mt-10 flex items-center justify-center gap-6 sm:gap-10"
          >
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tabular-nums">
                {tripCount.toLocaleString()}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                Trips Planned
              </div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                &lt;60s
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                Average Plan Time
              </div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                Free
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                To Get Started
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
