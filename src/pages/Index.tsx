import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Compass,
  ArrowRight,
  Settings,
  Menu,
  X,
  Instagram,
  Twitter,
  Youtube,
  Mail,
} from "lucide-react";
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

  // Close mobile menu on route/link click
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/85 backdrop-blur-xl border-b border-border shadow-sm"
            : "bg-white/60 backdrop-blur-md"
        }`}
      >
        <nav className="w-full max-w-[1400px] mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-10 h-16 lg:h-[72px]">
          {/* Logo — left */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <Compass className="h-[18px] w-[18px] text-primary-foreground" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-foreground">
              Jolliday
            </span>
          </Link>

          {/* Center nav — desktop only */}
          <div className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            <a
              href="#how-it-works"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-foreground/5"
            >
              How it works
            </a>
            <a
              href="#destinations"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-foreground/5"
            >
              Destinations
            </a>
            <a
              href="#testimonials"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-foreground/5"
            >
              Reviews
            </a>
            <Link
              to="/faq"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-foreground/5"
            >
              FAQ
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <>
                <Link to="/my-trips" className="hidden md:block">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 px-4 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                  >
                    My Trips
                  </Button>
                </Link>
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
                    className="h-10 rounded-full px-4 sm:px-5 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-sm"
                  >
                    <span className="hidden sm:inline">Start Planning</span>
                    <span className="sm:hidden">Plan</span>
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
                    className="h-10 rounded-full px-4 sm:px-5 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-sm"
                  >
                    <span className="hidden sm:inline">Start Planning</span>
                    <span className="sm:hidden">Plan</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden ml-0.5 p-2 rounded-lg hover:bg-foreground/5 text-foreground"
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
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-border shadow-lg animate-fade-in">
            <div className="flex flex-col gap-1 p-4">
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 text-sm font-medium text-foreground rounded-lg hover:bg-foreground/5"
              >
                How it works
              </a>
              <a
                href="#destinations"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 text-sm font-medium text-foreground rounded-lg hover:bg-foreground/5"
              >
                Destinations
              </a>
              <a
                href="#testimonials"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 text-sm font-medium text-foreground rounded-lg hover:bg-foreground/5"
              >
                Reviews
              </a>
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

        <div id="testimonials">
          <SocialProof />
        </div>

        <HomeFAQ />

        <FinalCTA />
      </main>

      {/* Footer */}
      <footer className="bg-[hsl(0_0%_4%)] text-white">
        <div className="container mx-auto px-4 sm:px-6 pt-16 pb-8 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-8 md:gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-4">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                  <Compass className="h-[18px] w-[18px] text-primary-foreground" />
                </div>
                <span className="font-extrabold text-xl tracking-tight text-white">
                  Jolliday
                </span>
              </div>
              <p className="text-sm text-white/60 leading-relaxed max-w-xs">
                Your AI travel planner. Turn any idea into a fully booked trip
                in under a minute.
              </p>

              {/* Socials */}
              <div className="mt-6 flex items-center gap-2">
                <a
                  href="#"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-colors"
                >
                  <Instagram className="h-4 w-4 text-white/70" />
                </a>
                <a
                  href="#"
                  aria-label="Twitter"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-colors"
                >
                  <Twitter className="h-4 w-4 text-white/70" />
                </a>
                <a
                  href="#"
                  aria-label="YouTube"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-colors"
                >
                  <Youtube className="h-4 w-4 text-white/70" />
                </a>
                <a
                  href="mailto:hello@jolliday.com"
                  aria-label="Email"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-colors"
                >
                  <Mail className="h-4 w-4 text-white/70" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div className="md:col-span-2">
              <h4 className="text-xs uppercase tracking-[0.15em] text-white/40 mb-4 font-semibold">
                Product
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    to="/chat"
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    Plan a Trip
                  </Link>
                </li>
                <li>
                  <Link
                    to="/my-trips"
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    My Trips
                  </Link>
                </li>
                <li>
                  <a
                    href="#destinations"
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    Destinations
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div className="md:col-span-2">
              <h4 className="text-xs uppercase tracking-[0.15em] text-white/40 mb-4 font-semibold">
                Company
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#testimonials"
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    Reviews
                  </a>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    to="/faq"
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className="md:col-span-2">
              <h4 className="text-xs uppercase tracking-[0.15em] text-white/40 mb-4 font-semibold">
                Legal
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    to="/terms"
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    Terms
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="col-span-2 md:col-span-2">
              <h4 className="text-xs uppercase tracking-[0.15em] text-white/40 mb-4 font-semibold">
                Get Inspired
              </h4>
              <p className="text-sm text-white/60 mb-3 leading-relaxed">
                Travel tips in your inbox.
              </p>
              <Link to="/chat">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-10 rounded-full bg-white text-black hover:bg-white/90 border-0 font-medium gap-1.5"
                >
                  Start Planning
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-white/50">
              &copy; {new Date().getFullYear()} Jolliday. All rights reserved.
            </p>
            <p className="text-xs sm:text-sm text-white/50">
              Made with <span className="text-primary">♥</span> for travellers
            </p>
          </div>
        </div>
      </footer>
      <MobileStickyCTA />
    </div>
  );
};

export default Index;
