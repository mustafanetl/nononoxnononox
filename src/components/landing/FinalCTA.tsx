import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const FinalCTA = () => {
  return (
    <section className="bg-background">
      <div className="container mx-auto px-4 py-20 md:py-32 lg:py-40 max-w-3xl text-center">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
          Ready to plan your next trip?
        </h2>
        <p className="mt-4 text-base text-muted-foreground max-w-md mx-auto">
          Start for free. Get a complete itinerary in under a minute.
        </p>

        <div className="mt-8">
          <Link to="/chat">
            <Button size="lg" className="min-h-[44px] rounded-full gap-1 bg-primary text-primary-foreground hover:bg-primary/90">
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
