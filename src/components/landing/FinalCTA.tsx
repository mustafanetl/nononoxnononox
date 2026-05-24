import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const FinalCTA = () => {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-20 md:py-28 lg:py-36 max-w-5xl">
        {/* Dark CTA card */}
        <div className="relative rounded-3xl overflow-hidden bg-[hsl(0_0%_7%)] px-6 sm:px-10 md:px-16 py-16 md:py-20 lg:py-24 text-center">
          {/* Background effects */}
          <div
            className="absolute inset-0 opacity-50"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 0%, hsl(234 62% 60% / 0.3) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-white/90">
                Ready to give it a try?
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Stop planning.
              <br />
              <span className="text-primary bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
                Start going.
              </span>
            </h2>

            <p className="mt-5 md:mt-6 text-base sm:text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
              One message. Full itinerary. Real prices. Verified venues.
              <br className="hidden sm:block" />
              Your next trip, ready to book in 60 seconds.
            </p>

            <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/chat">
                <Button
                  size="lg"
                  className="h-14 px-8 sm:px-10 rounded-full text-base sm:text-lg font-bold gap-2 bg-white text-black hover:bg-white/90 shadow-2xl shadow-white/10 press-bounce"
                >
                  Try Jolliday now
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-white/50">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                3-day free trial
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Cancel anytime
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Any destination worldwide
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
