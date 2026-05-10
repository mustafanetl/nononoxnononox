import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Compass, ArrowRight, User, Settings } from "lucide-react";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import WhyJolliday from "@/components/landing/WhyJolliday";
import SocialProof from "@/components/landing/SocialProof";
import DestinationsMosaic from "@/components/landing/DestinationsMosaic";
import HomeFAQ from "@/components/landing/HomeFAQ";
import FinalCTA from "@/components/landing/FinalCTA";
import MobileStickyCTA from "@/components/landing/MobileStickyCTA";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-200 ${
          scrolled
            ? "bg-white/80 backdrop-blur-md border-b border-border"
            : "bg-transparent"
        }`}
      >
        <nav className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Compass className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-foreground">Jolliday</span>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link to="/my-trips">
                  <Button variant="ghost" size="sm" className="min-h-[44px] min-w-[44px] gap-1 text-foreground hover:bg-foreground/5">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">My Trips</span>
                  </Button>
                </Link>
                <Link to="/settings">
                  <Button variant="ghost" size="icon" className="h-9 w-9 min-h-[44px] min-w-[44px] text-foreground hover:bg-foreground/5">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/chat">
                  <Button size="sm" className="min-h-[44px] rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                    Start Planning
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="min-h-[44px] min-w-[44px] text-foreground hover:bg-foreground/5">
                    <span className="hidden sm:inline">Sign in</span>
                    <User className="h-4 w-4 sm:hidden" />
                  </Button>
                </Link>
                <Link to="/chat">
                  <Button size="sm" className="min-h-[44px] rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
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

        <HowItWorks />

        <div id="destinations">
          <DestinationsMosaic />
        </div>

        <WhyJolliday />

        <SocialProof />

        <HomeFAQ />

        <FinalCTA />
      </main>

      <footer className="border-t border-border">
        <div className="container mx-auto px-4 pt-14 pb-8 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
                  <Compass className="h-3.5 w-3.5 text-background" />
                </div>
                <span className="font-semibold tracking-tight">Jolliday</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your trip, planned in seconds.
              </p>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">Product</h4>
              <ul className="space-y-1">
                <li><Link to="/chat" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center min-h-[44px]">Plan a Trip</Link></li>
                <li><Link to="/my-trips" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center min-h-[44px]">My Trips</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">Support</h4>
              <ul className="space-y-1">
                <li><Link to="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center min-h-[44px]">FAQ</Link></li>
                <li><Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center min-h-[44px]">Contact Us</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">Legal</h4>
              <ul className="space-y-1">
                <li><Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center min-h-[44px]">Terms of Use</Link></li>
                <li><Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center min-h-[44px]">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Jolliday. All rights reserved.</p>
          </div>
        </div>
      </footer>
      <MobileStickyCTA />
    </div>
  );
};

export default Index;
