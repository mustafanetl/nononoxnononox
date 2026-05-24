import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Menu,
  X,
  Instagram,
  Twitter,
  Youtube,
} from "lucide-react";
import Logo from "@/components/Logo";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import WhyJolliday from "@/components/landing/WhyJolliday";
import SocialProof from "@/components/landing/SocialProof";
import DestinationsMosaic from "@/components/landing/DestinationsMosaic";
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
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] overflow-x-hidden">
      {/* Navbar — minimal, transparent over hero */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/5"
            : "bg-transparent"
        }`}
      >
        <nav className="w-full flex items-center justify-between px-5 sm:px-8 lg:px-12 h-16 lg:h-[72px]">
          {/* Logo */}
          <Link to="/" className="shrink-0">
            <Logo size="md" />
          </Link>

          {/* Center nav — desktop */}
          <div className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            <a href="#how-it-works" className="px-4 py-2 text-sm font-medium text-white/50 hover:text-white transition-colors rounded-lg">
              How it works
            </a>
            <a href="#destinations" className="px-4 py-2 text-sm font-medium text-white/50 hover:text-white transition-colors rounded-lg">
              Destinations
            </a>
            <Link to="/faq" className="px-4 py-2 text-sm font-medium text-white/50 hover:text-white transition-colors rounded-lg">
              FAQ
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <Link to="/chat">
                <Button size="sm" className="h-10 rounded-full px-5 gap-1.5 bg-white text-black hover:bg-white/90 font-medium">
                  Start Planning
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="h-10 px-4 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5">
                    Log in
                  </Button>
                </Link>
                <Link to="/chat">
                  <Button size="sm" className="h-10 rounded-full px-5 gap-1.5 bg-white text-black hover:bg-white/90 font-medium">
                    Get started
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-[#0a0a0f] border-b border-white/5 animate-fade-in">
            <div className="flex flex-col gap-1 p-4">
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm font-medium text-white rounded-lg hover:bg-white/5">
                How it works
              </a>
              <a href="#destinations" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm font-medium text-white rounded-lg hover:bg-white/5">
                Destinations
              </a>
              <Link to="/faq" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm font-medium text-white rounded-lg hover:bg-white/5">
                FAQ
              </Link>
              {!user && (
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm font-medium text-white rounded-lg hover:bg-white/5">
                  Log in
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

        <SocialProof />

        <div id="destinations">
          <DestinationsMosaic />
        </div>

        <WhyJolliday />

        <FinalCTA />
      </main>

      {/* Footer — dark, minimal */}
      <footer className="bg-[#0a0a0f] border-t border-white/5">
        <div className="w-full max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 pt-16 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-8 md:gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-5">
              <Logo size="md" />
              <p className="mt-4 text-sm text-white/40 leading-relaxed max-w-xs">
                Your AI travel planner. Verified venues, real photos, instant itineraries.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <a href="https://instagram.com/jolliday.online" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:border-white/30 hover:text-white transition-colors text-white/40">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="https://x.com/jollidayonline" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:border-white/30 hover:text-white transition-colors text-white/40">
                  <Twitter className="h-4 w-4" />
                </a>
                <a href="https://youtube.com/@jolliday" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:border-white/30 hover:text-white transition-colors text-white/40">
                  <Youtube className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div className="md:col-span-2">
              <h4 className="text-xs uppercase tracking-[0.15em] text-white/70 mb-4 font-bold">Product</h4>
              <ul className="space-y-3">
                <li><Link to="/chat" className="text-sm text-white/40 hover:text-white transition-colors">Plan a Trip</Link></li>
                <li><a href="#destinations" className="text-sm text-white/40 hover:text-white transition-colors">Destinations</a></li>
                <li><Link to="/blog" className="text-sm text-white/40 hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div className="md:col-span-2">
              <h4 className="text-xs uppercase tracking-[0.15em] text-white/70 mb-4 font-bold">Company</h4>
              <ul className="space-y-3">
                <li><Link to="/contact" className="text-sm text-white/40 hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/faq" className="text-sm text-white/40 hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div className="md:col-span-3">
              <h4 className="text-xs uppercase tracking-[0.15em] text-white/70 mb-4 font-bold">Legal</h4>
              <ul className="space-y-3">
                <li><Link to="/terms" className="text-sm text-white/40 hover:text-white transition-colors">Terms of Use</Link></li>
                <li><Link to="/privacy" className="text-sm text-white/40 hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-xs text-white/30">
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
