import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Compass, ArrowRight, Plane, MapPin, Sparkles, Hotel, Calendar } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const destinations = [
  { name: "Dubai", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&h=400&fit=crop", tag: "Luxury & Adventure" },
  { name: "Bali", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=400&fit=crop", tag: "Honeymoon Paradise" },
  { name: "Tokyo", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop", tag: "Culture & Tech" },
  { name: "Paris", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop", tag: "Romance & Art" },
  { name: "Maldives", image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600&h=400&fit=crop", tag: "Beach Escape" },
  { name: "Barcelona", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&h=400&fit=crop", tag: "Food & Nightlife" },
];

const testimonials = [
  { quote: "Rzuma planned our entire honeymoon in minutes. The activity suggestions were perfect!", name: "Sarah & Mike", trip: "Bali Honeymoon" },
  { quote: "Found flights $200 cheaper than what I found manually. The budget tracker is genius.", name: "James L.", trip: "Tokyo Solo Trip" },
  { quote: "My family loved every activity suggestion. It felt like having a personal travel agent.", name: "Priya K.", trip: "Dubai Family Vacation" },
];

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

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/chat">
              <Button size="sm">
                Start Planning
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="pt-20">
        <section className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-muted rounded-full px-4 py-2 text-sm mb-6">
              <Sparkles className="h-4 w-4" />
              AI-Powered Full Trip Planning
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Plan your perfect trip with AI
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Tell Rzuma your occasion and destination. Get flights, hotels, activities, 
              and day-by-day itineraries — all in one conversation.
            </p>

            <Link to="/chat">
              <Button size="lg" className="text-base px-8">
                Start Planning
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Popular Destinations */}
        <section className="container mx-auto px-4 py-16 border-t border-border">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">Popular Destinations</h2>
          <p className="text-muted-foreground text-center mb-10">Click any destination to start planning instantly</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {destinations.map((d) => (
              <Link
                key={d.name}
                to={`/chat?q=Plan a trip to ${d.name}`}
                className="group relative rounded-2xl overflow-hidden aspect-[4/3] border border-border hover:border-foreground/20 transition-all hover:shadow-xl"
              >
                <img src={d.image} alt={d.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-white font-bold text-lg">{d.name}</h3>
                  <p className="text-white/70 text-xs">{d.tag}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-16 border-t border-border">
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Plane, title: "Cheapest Flights", desc: "Compare airlines and find the best deals instantly." },
              { icon: Hotel, title: "Hotel Picks", desc: "Curated hotel recommendations for every budget." },
              { icon: MapPin, title: "Activities", desc: "Occasion-tailored experiences from dining to adventure." },
              { icon: Calendar, title: "Itineraries", desc: "Day-by-day plans so you don't miss a thing." },
            ].map((f) => (
              <div key={f.title} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="container mx-auto px-4 py-16 border-t border-border">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">What Travelers Say</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <div key={i} className="p-6 rounded-2xl border border-border bg-card">
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.trip}</p>
                </div>
              </div>
            ))}
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
