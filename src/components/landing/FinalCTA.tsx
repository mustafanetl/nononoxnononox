import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const FinalCTA = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 100%, hsl(234 62% 47% / 0.06) 0%, transparent 70%), linear-gradient(180deg, hsl(0 0% 100%) 0%, hsl(0 0% 98%) 100%)",
        }}
      />

      <div className="relative container mx-auto px-4 py-24 md:py-36 lg:py-44 max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 mb-6">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">
            Ready to give it a try?
          </span>
        </div>

        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
          See how Jolliday can turn any idea into a trip in under a minute.
        </h2>

        <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-lg mx-auto">
          Start for free. No credit card required. Cancel anytime.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/chat">
            <Button
              size="lg"
              className="h-14 px-8 rounded-full text-base font-semibold gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 press-bounce"
            >
              Try Jolliday now
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
