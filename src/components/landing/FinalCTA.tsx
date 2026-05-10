import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const FinalCTA = () => {
  return (
    <section className="bg-foreground">
      <div className="container mx-auto px-4 py-20 md:py-28 max-w-3xl text-center">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-background leading-[1.1]">
          Ready to plan your next trip?
        </h2>
        <p className="mt-4 text-base text-background/70 max-w-md mx-auto">
          Start for free. Get a complete itinerary in under a minute.
        </p>

        <div className="mt-8">
          <Link to="/chat">
            <Button size="lg" className="rounded-full gap-1 bg-background text-foreground hover:bg-background/90">
              Start planning
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
