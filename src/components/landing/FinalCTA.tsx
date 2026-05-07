import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const FinalCTA = () => {
  return (
    <section className="border-t border-border bg-muted/40">
      <div className="container mx-auto px-4 py-24 md:py-32 max-w-3xl text-center">
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
          Your next trip is one minute away
        </h2>
        <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
          Join thousands of travellers who've stopped spending hours planning and started actually enjoying the journey.
        </p>

        <div className="mt-10 flex flex-col items-center">
          <Link to="/auth">
            <Button size="lg" className="rounded-full gap-1">
              Start my free trial
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <p
            className="text-center text-muted-foreground mt-2"
            style={{ fontSize: "12px" }}
          >
            3-day free trial · Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;