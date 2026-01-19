import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Compass, ArrowRight, Plane, MapPin, Sparkles } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <nav className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
              <Compass className="h-4 w-4 text-background" />
            </div>
            <span className="font-semibold text-lg">Rzuma</span>
          </div>

          <Link to="/chat">
            <Button size="sm">
              Start Planning
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="pt-20">
        <section className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-muted rounded-full px-4 py-2 text-sm mb-6">
              <Sparkles className="h-4 w-4" />
              AI-Powered Travel Planning
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Plan your perfect trip with AI
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Just tell Rzuma where you want to go. Get personalized flight options, 
              travel tips, and itineraries in seconds.
            </p>

            <Link to="/chat">
              <Button size="lg" className="text-base px-8">
                Start Planning
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-16 border-t border-border">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Plane className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Find Flights</h3>
              <p className="text-sm text-muted-foreground">
                Compare flight options with prices, times, and airlines at a glance.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">Discover Destinations</h3>
              <p className="text-sm text-muted-foreground">
                Get personalized recommendations based on your travel style.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">AI Assistant</h3>
              <p className="text-sm text-muted-foreground">
                Chat naturally and get instant answers to all your travel questions.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-20">
          <div className="bg-muted rounded-2xl p-8 md:p-12 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to plan your next adventure?
            </h2>
            <p className="text-muted-foreground mb-6">
              Start chatting with Rzuma and discover your perfect trip.
            </p>
            <Link to="/chat">
              <Button size="lg">
                Try Rzuma Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 Rzuma. Your AI travel companion.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
