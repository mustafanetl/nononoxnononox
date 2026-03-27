import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Compass, ArrowRight, MessageSquare, Sparkles, Map, User, Settings } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import HeroSection from "@/components/HeroSection";
import PricingSection from "@/components/PricingSection";
import { useAuth } from "@/hooks/useAuth";

const destinations = [
  { name: "Dubai", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&h=400&fit=crop" },
  { name: "Bali", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=400&fit=crop" },
  { name: "Tokyo", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop" },
  { name: "Paris", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop" },
  { name: "Maldives", image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600&h=400&fit=crop" },
  { name: "Barcelona", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&h=400&fit=crop" },
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
            <span className="font-semibold text-lg">Jolliday</span>
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
                      
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

        {/* How It Works */}
        <section id="how-it-works" className="container mx-auto px-4 py-16 border-t border-border">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">How Jolliday Works</h2>
          <p className="text-muted-foreground text-center mb-10">Three steps to your itinerary</p>
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

        {/* Pricing */}
        <PricingSection />

      </main>

      <footer className="border-t border-border py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
                  <Compass className="h-3.5 w-3.5 text-background" />
                </div>
                <span className="font-semibold">Jolliday</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Your AI travel companion. Plan trips in seconds, not hours.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-3">Product</h4>
              <ul className="space-y-2">
                <li><Link to="/chat" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Plan a Trip</Link></li>
                <li><Link to="/my-trips" className="text-sm text-muted-foreground hover:text-foreground transition-colors">My Trips</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-6 text-center">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Jolliday. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
