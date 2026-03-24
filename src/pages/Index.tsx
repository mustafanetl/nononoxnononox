import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Compass, ArrowRight, Plane, MapPin, Hotel, Calendar, Star, Twitter, Instagram } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import HeroSection from "@/components/HeroSection";
import PricingSection from "@/components/PricingSection";
import { useAuth } from "@/hooks/useAuth";
import { User } from "lucide-react";

const destinations = [
  { name: "Dubai", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&h=400&fit=crop", tag: "Luxury & Adventure" },
  { name: "Bali", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=400&fit=crop", tag: "Honeymoon Paradise" },
  { name: "Tokyo", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop", tag: "Culture & Tech" },
  { name: "Paris", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop", tag: "Romance & Art" },
  { name: "Maldives", image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600&h=400&fit=crop", tag: "Beach Escape" },
  { name: "Barcelona", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&h=400&fit=crop", tag: "Food & Nightlife" },
];

const testimonials = [
  { quote: "Rzuma planned our entire honeymoon in minutes. The activity suggestions were perfect!", name: "Sarah & Mike", trip: "Bali Honeymoon", initials: "SM" },
  { quote: "Found flights $200 cheaper than what I found manually. The budget tracker is genius.", name: "James L.", trip: "Tokyo Solo Trip", initials: "JL" },
  { quote: "My family loved every activity suggestion. It felt like having a personal travel agent.", name: "Priya K.", trip: "Dubai Family Vacation", initials: "PK" },
];

/* ---- Scroll reveal hook ---- */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("scroll-visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

const RevealSection = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const ref = useScrollReveal();
  return (
    <div ref={ref} className={`scroll-reveal ${className}`}>
      {children}
    </div>
  );
};

const Index = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <nav className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
              <Compass className="h-4 w-4 text-background" />
            </div>
            <span className="font-semibold text-lg">Rzuma</span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <>
                <Link to="/my-trips">
                  <Button variant="ghost" size="sm" className="gap-1">
                    <User className="h-4 w-4" /> My Trips
                  </Button>
                </Link>
                <Link to="/chat">
                  <Button size="sm">
                    Start Planning
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link to="/chat">
                  <Button size="sm">
                    Start Planning
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <HeroSection />

        {/* Popular Destinations */}
        <RevealSection>
          <section className="container mx-auto px-4 py-16 border-t border-border">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">Popular Destinations</h2>
            <p className="text-muted-foreground text-center mb-10">Click any destination to start planning instantly</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-w-5xl mx-auto">
              {destinations.map((d) => (
                <Link
                  key={d.name}
                  to={`/chat?q=Plan a trip to ${d.name}`}
                  className="group relative rounded-2xl overflow-hidden aspect-[4/3] border border-border hover:border-foreground/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  <img src={d.image} alt={d.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-white font-bold text-base md:text-lg">{d.name}</h3>
                    <p className="text-white/70 text-xs">{d.tag}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </RevealSection>

        {/* Features */}
        <RevealSection>
          <section className="container mx-auto px-4 py-16 border-t border-border">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">How Rzuma Works</h2>
            <p className="text-muted-foreground text-center mb-10">Everything you need for the perfect trip</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {[
                { icon: Plane, title: "Cheapest Flights", desc: "Compare airlines and find the best deals instantly." },
                { icon: Hotel, title: "Hotel Picks", desc: "Curated hotel recommendations for every budget." },
                { icon: MapPin, title: "Activities", desc: "Occasion-tailored experiences from dining to adventure." },
                { icon: Calendar, title: "Itineraries", desc: "Day-by-day plans so you don't miss a thing." },
              ].map((f) => (
                <div key={f.title} className="group flex items-start gap-4 p-5 rounded-2xl border border-border bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                    <f.icon className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </RevealSection>

        {/* Testimonials */}
        <RevealSection>
          <section className="container mx-auto px-4 py-16 border-t border-border">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">What Travelers Say</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {testimonials.map((t, i) => (
                <div key={i} className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star key={si} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-5 leading-relaxed">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground">
                      {t.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.trip}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </RevealSection>

        {/* Pricing */}
        <RevealSection>
          <PricingSection />
        </RevealSection>

        {/* CTA */}
        <RevealSection>
          <section className="container mx-auto px-4 py-20">
            <div className="relative rounded-2xl p-8 md:p-12 text-center max-w-2xl mx-auto overflow-hidden bg-muted">
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
              <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  Ready to plan your next adventure?
                </h2>
                <p className="text-sm text-muted-foreground mb-1">Join 50K+ travelers who plan with Rzuma</p>
                <p className="text-muted-foreground mb-6">
                  Start chatting and discover your perfect trip.
                </p>
                <Link to="/chat">
                  <Button size="lg">
                    Try Rzuma Free
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </RevealSection>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
                  <Compass className="h-3.5 w-3.5 text-background" />
                </div>
                <span className="font-semibold">Rzuma</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">Your AI travel companion. Plan trips in seconds, not hours.</p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Product</h4>
              <ul className="space-y-2">
                <li><Link to="/chat" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Plan a Trip</Link></li>
                <li><Link to="/my-trips" className="text-sm text-muted-foreground hover:text-foreground transition-colors">My Trips</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a></li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="font-semibold text-sm mb-3">Connect</h4>
              <div className="flex gap-3">
                <a href="#" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  <Twitter className="h-4 w-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6 text-center">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Rzuma. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
