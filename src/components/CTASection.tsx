import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-primary p-8 md:p-12 lg:p-16 text-center">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-accent" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-accent" />
          </div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground">
              Ready to Start Your Adventure?
            </h2>
            <p className="mt-4 text-primary-foreground/80 text-lg">
              Join thousands of travelers who have discovered their perfect trips
              with Rzuma.
            </p>
            <Button
              variant="glass"
              size="xl"
              className="mt-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
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
