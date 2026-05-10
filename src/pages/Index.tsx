import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Compass, ArrowRight, User, Settings, Menu, X } from "lucide-react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl border-b border-border shadow-sm"
            : "bg-transparent"
        }`}
      >
        <nav className="w-full max-w-[1400px] mx-auto flex items-center justify-between px-6 lg:px-10 h-16 lg:h-[72px]">
          {/* Logo — always left */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Compass className="h-[18px] w-[18px] text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">
              Jolliday
            </span>
          </Link>

          {/* Center nav links — desktop only */}
          <div className="hidden lg:flex items-center gap-1">
            <Link
              to="/#how-it-works"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-foreground/5"
            >
              How it works
            </Link>
            <Link
              to="/#destinations"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-foreground/5"
            >
              Destinations
            </Link>
            <Link
              to="/faq"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-foreground/5"
            >
              FAQ
            </Link>
            {user && (
              <Link
                to="/my-trips"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-foreground/5"
              >
                My Trips
              </Link>
            )}
          </div>

          {/* Right side — CTA + auth */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link to="/settings" className="hidden sm:block">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/chat">
                  <Button
                    size="sm"
                    className="h-10 rounded-full px-5 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-sm"
                  >
                    Start Planning
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth" className="hidden sm:block">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 px-4 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                  >
                    Sign in
                  </Button>
                </Link>
                <Link to="/chat">
                  <Button
                    size="sm"
                    className="h-10 rounded-full px-5 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-sm"
                  >
                    Start Planning
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden ml-1 p-2 rounded-lg hover:bg-foreground/5 text-foreground"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white/95 backdrop-blur-xl border-b border-border px-4 pb-4 pt-2 animate-fade-in">
            <div className="flex flex-col gap-1">
              <Link
                to="/#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 text-sm font-medium text-foreground rounded-lg hover:bg-foreground/5"
              >
                How it works
              </Link>
              <Link
                to="/#destinations"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 text-sm font-medium text-foreground rounded-lg hover:bg-foreground/5"
              >
                Destinations
              </Link>
              <Link
                to="/faq"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 text-sm font-medium text-foreground rounded-lg hover:bg-foreground/5"
              >
                FAQ
              </Link>
              {user && (
                <Link
                  to="/my-trips"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-sm font-medium text-foreground rounded-lg hover:bg-foreground/5"
                >
                  My Trips
                </Link>
              )}
              {!user && (
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-sm font-medium text-foreground rounded-lg hover:bg-foreground/5"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main>
        <HeroSection />

        <div id="how-it-works">
          <HowItWorks />
        </div>

        <div id="destinations">
          <DestinationsMosaic />
        </div>

        <WhyJolliday />

        <SocialProof />

        <HomeFAQ />

        <FinalCTA />
      </main>

      <footer className="border-t border-border bg-[hsl(0_0%_98%)]">
        <div className="container mx-auto px-4 pt-14 pb-8 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Compass className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold tracking-tight text-foreground">
                  Jolliday
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your trip, planned in seconds.
              </p>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 font-semibold">
                Product
              </h4>
              <ul className="space-y-1">
                <li>
                  <Link
                    to="/chat"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center min-h-[36px]"
                  >
                    Plan a Trip
                  </Link>
                </li>
                <li>
                  <Link
                    to="/my-trips"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center min-h-[36px]"
                  >
                    My Trips
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 font-semibold">
                Support
              </h4>
              <ul className="space-y-1">
                <li>
                  <Link
                    to="/faq"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center min-h-[36px]"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center min-h-[36px]"
                  >
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 font-semibold">
                Legal
              </h4>
              <ul className="space-y-1">
                <li>
                  <Link
                    to="/terms"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center min-h-[36px]"
                  >
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center min-h-[36px]"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Jolliday. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      <MobileStickyCTA />
    </div>
  );
};

export default Index;
