import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Compass, ArrowRight, Star, Twitter, Instagram, MessageSquare, Sparkles, Map, BadgeCheck, User } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import HeroSection from "@/components/HeroSection";
import PricingSection from "@/components/PricingSection";
import { useAuth } from "@/hooks/useAuth";

const destinations = [
  { name: "Dubai", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&h=400&fit=crop", tag: "Luxury & Adventure" },
  { name: "Bali", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=400&fit=crop", tag: "Honeymoon Paradise" },
  { name: "Tokyo", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop", tag: "Culture & Tech" },
  { name: "Paris", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop", tag: "Romance & Art" },
  { name: "Maldives", image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600&h=400&fit=crop", tag: "Beach Escape" },
  { name: "Barcelona", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&h=400&fit=crop", tag: "Food & Nightlife" },
];

const testimonials = [
  { quote: "Planned our entire Bali honeymoon in one conversation. Every restaurant and activity was spot on.", name: "Sarah & Mike", trip: "Bali · 10 days", initials: "SM", verified: true },
  { quote: "Found flights $200 cheaper than what I found on my own. The budget breakdown saved me hours.", name: "James L.", trip: "Tokyo · 7 days", initials: "JL", verified: true },
  { quote: "First family trip abroad and every detail was handled — even kid-friendly activities.", name: "Priya K.", trip: "Dubai · 5 days", initials: "PK", verified: true },
];

const steps = [
  { num: "1", icon: MessageSquare, title: "Tell us where", desc: "Type any destination — or let us inspire you." },
  { num: "2", icon: Sparkles, title: "Answer a few questions", desc: "Dates, budget, vibe — we personalize everything." },
  { num: "3", icon: Map, title: "Get your full itinerary", desc: "Flights, hotels, activities — ready in seconds." },
];

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
                <Link to="/chat">
                  <Button size="sm">
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
                  <Button size="sm">
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
        {/* Hero */}
        <HeroSection />

        {/* Popular Destinations */}
        <section className="container mx-auto px-4 py-16 border-t border-border">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">Popular Destinations</h2>
            <p className="text-muted-foreground text-center mb-10">Click any destination to start planning instantly</p>
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
                {destinations.slice(0, 2).map((d) => (
                  <Link
                    key={d.name}
                    to={`/chat?q=Plan a trip to ${d.name}`}
                    className="group relative rounded-2xl overflow-hidden aspect-[16/9] border border-border hover:border-foreground/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    <img src={d.image} alt={d.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white font-bold text-lg md:text-xl">{d.name}</h3>
                      <p className="text-white/70 text-sm">{d.tag}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {destinations.slice(2).map((d) => (
                  <Link
                    key={d.name}
                    to={`/chat?q=Plan a trip to ${d.name}`}
                    className="group relative rounded-2xl overflow-hidden aspect-[4/3] border border-border hover:border-foreground/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    <img src={d.image} alt={d.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-bold text-base">{d.name}</h3>
                      <p className="text-white/70 text-xs">{d.tag}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </RevealSection>

        {/* How It Works */}
        <RevealSection>
          <section id="how-it-works" className="container mx-auto px-4 py-16 border-t border-border">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">How Rzuma Works</h2>
            <p className="text-muted-foreground text-center mb-10">Your perfect trip in 3 simple steps</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {steps.map((step) => (
                <div key={step.num} className="relative text-center p-6 rounded-2xl border border-border bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mx-auto mb-4">
                    {step.num}
                  </div>
                  <step.icon className="h-6 w-6 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
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
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm">{t.name}</p>
                        {t.verified && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
                      </div>
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
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
              <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-bold mb-3">
                  Your next trip is 60 seconds away
                </h2>
                <p className="text-muted-foreground mb-6">
                  Plan smarter, travel better.
                </p>
                <Link to="/chat">
                  <Button size="lg" className="text-base px-8 py-6">
                    Try Rzuma Free
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground mt-3">
                  Free for 3 days · No credit card required
                </p>
              </div>
            </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
                  <Compass className="h-3.5 w-3.5 text-background" />
                </div>
                <span className="font-semibold">Rzuma</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Your AI travel companion. Plan trips in seconds, not hours.
              </p>
            </div>

            <div className="flex gap-12">
              <div>
                <h4 className="font-semibold text-sm mb-3">Product</h4>
                <ul className="space-y-2">
                  <li><Link to="/chat" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Plan a Trip</Link></li>
                  <li><Link to="/my-trips" className="text-sm text-muted-foreground hover:text-foreground transition-colors">My Trips</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-3">Connect</h4>
                <div className="flex gap-3">
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                    <Twitter className="h-4 w-4" />
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                    <Instagram className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6 text-center">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Rzuma. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
