import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Play } from "lucide-react";

const HeroSection = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (q: string) => {
    const trimmed = q.trim();
    if (trimmed) navigate(`/chat?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden bg-white">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-24 pb-16 sm:pt-28 sm:pb-20 md:pt-32 md:pb-24 flex flex-col items-center text-center">
        {/* Headline */}
        <h1 className="font-display text-[2.75rem] leading-[1.02] sm:text-[3.75rem] md:text-[5rem] lg:text-[6rem] xl:text-[7rem] font-extrabold tracking-[-0.03em] text-foreground">
          Your trip.
          <br />
          Planned in minutes.
        </h1>

        {/* Three CTA buttons */}
        <div className="mt-10 md:mt-14 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link to="/chat">
            <Button
              size="lg"
              className="h-14 w-full sm:w-auto px-8 rounded-full text-base font-semibold gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/15 press-bounce"
            >
              Create a new trip
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/chat?q=Inspire me where to go">
            <Button
              variant="outline"
              size="lg"
              className="h-14 w-full sm:w-auto px-8 rounded-full text-base font-semibold gap-2 border-2 border-border hover:border-primary/30 hover:bg-primary/5 press-bounce"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              Inspire me where to go
            </Button>
          </Link>
          <Link to="/chat?q=What can you help me with?">
            <Button
              variant="outline"
              size="lg"
              className="h-14 w-full sm:w-auto px-8 rounded-full text-base font-semibold gap-2 border-2 border-border hover:border-primary/30 hover:bg-primary/5 press-bounce"
            >
              <Play className="h-4 w-4 text-primary" />
              See how I can help
            </Button>
          </Link>
        </div>
      </div>

      {/* Second block — input + counter (below fold, separate section) */}
      <div className="w-full bg-white border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 md:py-24 flex flex-col items-center text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            Your trip in minutes,<span className="text-muted-foreground"> not weeks.</span>
          </h2>

          {/* Input — clean pill like Layla */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(query);
            }}
            className="mt-10 w-full max-w-xl flex items-center rounded-full border-2 border-border bg-white pl-5 sm:pl-6 pr-2 py-2 hover:border-primary/30 focus-within:border-primary focus-within:shadow-lg focus-within:shadow-primary/10 transition-all duration-200"
          >
            <input
              type="text"
              placeholder="Plan my trip"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 min-w-0 bg-transparent py-3 text-base sm:text-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
            />
            <Button
              type="submit"
              size="lg"
              className="h-12 px-6 rounded-full gap-1.5 shrink-0 font-semibold shadow-md text-base bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Plan my trip
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Trip counter */}
          <div className="mt-10">
            <span className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-foreground tabular-nums">
              48,293
            </span>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Trips Planned
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
