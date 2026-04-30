import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Compass, ArrowRight, User, Settings } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import HeroSection from "@/components/HeroSection";
import ProductPreview from "@/components/landing/ProductPreview";
import ValueRows from "@/components/landing/ValueRows";
import DestinationsMosaic from "@/components/landing/DestinationsMosaic";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ctaQuery, setCtaQuery] = useState("");

  const handleCtaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = ctaQuery.trim();
    if (trimmed) navigate(`/chat?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <nav className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
              <Compass className="h-4 w-4 text-background" />
            </div>
            <span className="font-semibold text-lg tracking-tight">Jolliday</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#examples" className="hover:text-foreground transition-colors">Example</a>
            <a href="#destinations" className="hover:text-foreground transition-colors">Destinations</a>
            <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
            {user ? (
              <>
                <Link to="/my-trips">
                  <Button variant="ghost" size="sm" className="gap-1">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">My Trips</span>
                  </Button>
                </Link>
                <Link to="/settings">
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/chat">
                  <Button size="sm" className="rounded-full">
                    Start Planning
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="gap-1">
                    <User className="h-4 w-4 sm:hidden" />
                    <span className="hidden sm:inline">Sign in</span>
                  </Button>
                </Link>
                <Link to="/chat">
                  <Button size="sm" className="rounded-full">
                    Start Planning
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main>
        <HeroSection />

        <ProductPreview />

        <div id="destinations">
          <DestinationsMosaic />
        </div>

        <ValueRows />

        {/* Closing CTA band */}
        <section className="border-t border-border">
          <div className="container mx-auto px-4 py-24 md:py-32 max-w-4xl text-center">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.95]">
              Where to next?
            </h2>
            <form
              onSubmit={handleCtaSubmit}
              className="mt-10 flex items-center gap-2 max-w-xl mx-auto border border-border rounded-full pl-5 pr-2 py-2 bg-background hover:border-foreground/30 focus-within:border-foreground transition-colors"
            >
              <input
                type="text"
                value={ctaQuery}
                onChange={(e) => setCtaQuery(e.target.value)}
                placeholder="A weekend in Rome, a week in Japan…"
                className="flex-1 bg-transparent py-2 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <Button type="submit" size="lg" className="rounded-full gap-1">
                Plan
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="container mx-auto px-4 pt-16 pb-10 max-w-6xl">
          {/* Oversized wordmark */}
          <div className="pb-12 mb-12 border-b border-border">
            <div className="text-[18vw] md:text-[14rem] leading-[0.85] font-bold tracking-tighter text-foreground/90 select-none">
              Jolliday
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
                  <Compass className="h-3.5 w-3.5 text-background" />
                </div>
                <span className="font-semibold tracking-tight">Jolliday</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your AI travel companion. Plan trips in seconds, not hours.
              </p>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">Product</h4>
              <ul className="space-y-2.5">
                <li><Link to="/chat" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Plan a Trip</Link></li>
                <li><Link to="/my-trips" className="text-sm text-muted-foreground hover:text-foreground transition-colors">My Trips</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">Support</h4>
              <ul className="space-y-2.5">
                <li><Link to="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</Link></li>
                <li><Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact Us</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">Legal</h4>
              <ul className="space-y-2.5">
                <li><Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Use</Link></li>
                <li><Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Jolliday. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
