import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Settings,
  Menu,
  X,
  Instagram,
  Twitter,
  Youtube,
  Mail,
} from "lucide-react";
import Logo from "@/components/Logo";
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
      {/* Navbar — truly full-width, edge to edge */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl border-b border-border shadow-sm"
            : "bg-white/70 backdrop-blur-md border-b border-transparent"
        }`}
      >
        <nav className="w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-12 h-16 lg:h-[72px]">
          {/* Logo — far left */}
          <Link to="/" className="shrink-0">
            <Logo size="md" />
          </Link>

          {/* Center nav — desktop only, absolutely centered */}
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

          {/* Right side — far right */}
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

      {/* Footer — light and refined */}
      <footer className="bg-[hsl(0_0%_97%)] border-t border-border">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-16 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-8 md:gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-5">
              <Logo size="md" />
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xs">
                Your AI travel planner. Turn any idea into a fully booked trip
                in under a minute.
              </p>

              {/* Socials */}
              <div className="mt-6 flex items-center gap-2">
                <a
                  href="https://instagram.com/jolliday.online"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center hover:border-primary/30 hover:text-primary transition-colors text-muted-foreground"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="https://x.com/jollidayonline"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                  className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center hover:border-primary/30 hover:text-primary transition-colors text-muted-foreground"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href="https://youtube.com/@jolliday"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center hover:border-primary/30 hover:text-primary transition-colors text-muted-foreground"
                >
                  <Youtube className="h-4 w-4" />
                </a>
                <a
                  href="mailto:hello@jolliday.online"
                  aria-label="Email"
                  className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center hover:border-primary/30 hover:text-primary transition-colors text-muted-foreground"
                >
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div className="md:col-span-2">
              <h4 className="text-xs uppercase tracking-[0.15em] text-foreground mb-4 font-bold">
                Product
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    to="/chat"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Plan a Trip
                  </Link>
                </li>
                <li>
                  <Link
                    to="/my-trips"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    My Trips
                  </Link>
                </li>
                <li>
                  <a
                    href="#destinations"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Destinations
                  </a>
                </li>
                <li>
                  <Link
                    to="/blog"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div className="md:col-span-2">
              <h4 className="text-xs uppercase tracking-[0.15em] text-foreground mb-4 font-bold">
                Company
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#testimonials"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Reviews
                  </a>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    to="/faq"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className="md:col-span-3">
              <h4 className="text-xs uppercase tracking-[0.15em] text-foreground mb-4 font-bold">
                Legal
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    to="/terms"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Jolliday. All rights reserved.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
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
