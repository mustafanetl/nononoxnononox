import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-card to-primary/10 border border-primary/20 p-8 md:p-12 lg:p-16 text-center">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary blur-3xl" />
          </div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              Ready to Start Your Adventure?
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Join thousands of travelers who have discovered their perfect trips
              with Rzuma.
            </p>
            <Button
              variant="hero"
              size="xl"
              className="mt-8"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Start Planning Free
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
