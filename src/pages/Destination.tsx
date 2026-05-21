/**
 * Destination landing page — SEO-optimized page for each supported city.
 * Route: /destinations/:city
 *
 * Provides unique, indexable content for each destination with:
 * - SEO title/description via Helmet
 * - Structured data (TouristDestination schema)
 * - Pre-filled CTA to start planning
 * - Key facts and trip suggestions
 */

import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Clock, Users, Sparkles, Plane, Calendar } from "lucide-react";
import Logo from "@/components/Logo";
import { useCityHeroImage } from "@/hooks/useCityHeroImage";

// Destination data for SEO content generation
const DESTINATIONS: Record<string, {
  name: string;
  country: string;
  continent: string;
  description: string;
  highlights: string[];
  bestFor: string[];
  idealDuration: string;
  bestMonths: string;
  currency: string;
  language: string;
  suggestions: string[];
}> = {
  amsterdam: { name: "Amsterdam", country: "Netherlands", continent: "Europe", description: "Canal-lined streets, world-class museums, and vibrant nightlife make Amsterdam one of Europe's most beloved cities. From the Van Gogh Museum to cozy brown cafés, every corner rewards exploration.", highlights: ["Rijksmuseum", "Anne Frank House", "Vondelpark", "Jordaan neighborhood", "Canal cruises"], bestFor: ["Couples", "Solo travelers", "Culture lovers", "Foodies"], idealDuration: "3-4 days", bestMonths: "Apr-Sep", currency: "EUR", language: "Dutch", suggestions: ["3 days in Amsterdam for a couple", "Amsterdam weekend food tour", "Amsterdam art and culture trip"] },
  barcelona: { name: "Barcelona", country: "Spain", continent: "Europe", description: "Where Gaudí's surreal architecture meets Mediterranean beaches and world-famous tapas. Barcelona delivers culture, nightlife, and sunshine in equal measure.", highlights: ["Sagrada Familia", "Park Güell", "La Boqueria", "Gothic Quarter", "Barceloneta Beach"], bestFor: ["Couples", "Friends", "Architecture fans", "Beach lovers"], idealDuration: "4-5 days", bestMonths: "May-Oct", currency: "EUR", language: "Spanish/Catalan", suggestions: ["5 days in Barcelona for 2", "Barcelona food and architecture trip", "Weekend in Barcelona, budget-friendly"] },
  berlin: { name: "Berlin", country: "Germany", continent: "Europe", description: "A city where history, art, and nightlife collide. Berlin's creative energy, affordable dining scene, and cultural depth make it a must-visit European capital.", highlights: ["Brandenburg Gate", "Museum Island", "East Side Gallery", "Kreuzberg", "Tiergarten"], bestFor: ["Solo travelers", "History buffs", "Nightlife lovers", "Budget travelers"], idealDuration: "3-5 days", bestMonths: "May-Sep", currency: "EUR", language: "German", suggestions: ["4 days in Berlin, culture and nightlife", "Berlin weekend for friends", "Berlin history and food trip"] },
  tokyo: { name: "Tokyo", country: "Japan", continent: "Asia", description: "Ancient temples beside neon-lit skyscrapers. Tokyo is a sensory overload of incredible food, cutting-edge technology, and centuries of tradition — all connected by the world's most punctual trains.", highlights: ["Shibuya Crossing", "Senso-ji Temple", "Tsukiji Market", "Akihabara", "Meiji Shrine"], bestFor: ["Solo travelers", "Couples", "Foodies", "Tech enthusiasts"], idealDuration: "5-7 days", bestMonths: "Mar-May, Oct-Nov", currency: "JPY", language: "Japanese", suggestions: ["7 days in Tokyo for a couple", "Tokyo food tour 5 days", "Tokyo and Kyoto combined trip"] },
  paris: { name: "Paris", country: "France", continent: "Europe", description: "The City of Light needs no introduction. World-class art, iconic landmarks, and the finest cuisine on Earth — Paris remains the ultimate romantic destination.", highlights: ["Eiffel Tower", "Louvre Museum", "Montmartre", "Le Marais", "Seine River cruise"], bestFor: ["Couples", "Art lovers", "Foodies", "Families"], idealDuration: "4-5 days", bestMonths: "Apr-Jun, Sep-Oct", currency: "EUR", language: "French", suggestions: ["Romantic 4 days in Paris", "Paris family trip with kids", "Paris art and food weekend"] },
  london: { name: "London", country: "United Kingdom", continent: "Europe", description: "History, theater, world cuisine, and royal pageantry — London packs more into one city than most countries offer in total. From the West End to Borough Market, there's always something happening.", highlights: ["Tower of London", "British Museum", "Camden Market", "Hyde Park", "Borough Market"], bestFor: ["Families", "History buffs", "Theater lovers", "Foodies"], idealDuration: "4-5 days", bestMonths: "May-Sep", currency: "GBP", language: "English", suggestions: ["5 days in London for a family", "London theater and food trip", "Weekend in London for couples"] },
  rome: { name: "Rome", country: "Italy", continent: "Europe", description: "Walk through millennia of history before sitting down to the best pasta of your life. Rome is a living museum with unbeatable food and infectious energy.", highlights: ["Colosseum", "Vatican Museums", "Trastevere", "Trevi Fountain", "Pantheon"], bestFor: ["Couples", "History buffs", "Foodies", "Families"], idealDuration: "4-5 days", bestMonths: "Apr-Jun, Sep-Oct", currency: "EUR", language: "Italian", suggestions: ["4 days in Rome for a couple", "Rome history and food trip", "Rome and Florence combined"] },
  bangkok: { name: "Bangkok", country: "Thailand", continent: "Asia", description: "Ornate temples, incredible street food, rooftop bars, and bustling markets — Bangkok is a feast for all senses and one of the best-value cities on Earth.", highlights: ["Grand Palace", "Chatuchak Market", "Wat Arun", "Khao San Road", "Chinatown"], bestFor: ["Budget travelers", "Foodies", "Solo travelers", "Couples"], idealDuration: "3-5 days", bestMonths: "Nov-Feb", currency: "THB", language: "Thai", suggestions: ["4 days in Bangkok for foodies", "Bangkok temple and market tour", "Bangkok and Chiang Mai combined"] },
  dubai: { name: "Dubai", country: "UAE", continent: "Middle East", description: "Futuristic architecture, luxury shopping, desert adventures, and beaches — Dubai offers an extraordinary blend of modern opulence and Arabian heritage.", highlights: ["Burj Khalifa", "Dubai Mall", "Desert Safari", "Dubai Marina", "Gold Souk"], bestFor: ["Luxury travelers", "Couples", "Families", "Shopping lovers"], idealDuration: "4-5 days", bestMonths: "Nov-Mar", currency: "AED", language: "Arabic/English", suggestions: ["5 days luxury trip to Dubai", "Dubai family vacation", "Dubai adventure and shopping"] },
  lisbon: { name: "Lisbon", country: "Portugal", continent: "Europe", description: "Tiled facades, hilltop miradouros, pastéis de nata, and Atlantic breezes. Lisbon's mix of old-world charm and modern creativity makes it one of Europe's coolest cities.", highlights: ["Alfama", "Belém Tower", "Time Out Market", "Tram 28", "LX Factory"], bestFor: ["Couples", "Budget travelers", "Foodies", "Solo travelers"], idealDuration: "3-4 days", bestMonths: "Apr-Oct", currency: "EUR", language: "Portuguese", suggestions: ["3 days in Lisbon for couples", "Lisbon food and culture weekend", "Lisbon and Porto combined trip"] },
  stockholm: { name: "Stockholm", country: "Sweden", continent: "Europe", description: "Spread across 14 islands, Stockholm offers stunning waterfront views, Nordic design, Michelin-starred restaurants, and the world's oldest open-air museum.", highlights: ["Gamla Stan", "Vasa Museum", "Djurgården", "Södermalm", "ABBA Museum"], bestFor: ["Couples", "Design lovers", "Foodies", "Culture seekers"], idealDuration: "3-4 days", bestMonths: "May-Sep", currency: "SEK", language: "Swedish", suggestions: ["3 days in Stockholm for a couple", "Stockholm design and food trip", "Stockholm summer weekend"] },
  singapore: { name: "Singapore", country: "Singapore", continent: "Asia", description: "A gleaming city-state where hawker centres serve Michelin-starred meals, futuristic gardens meet colonial architecture, and every culture blends into something unique.", highlights: ["Gardens by the Bay", "Marina Bay Sands", "Hawker Centres", "Sentosa", "Chinatown"], bestFor: ["Families", "Foodies", "Couples", "Luxury travelers"], idealDuration: "3-4 days", bestMonths: "Feb-Apr", currency: "SGD", language: "English/Mandarin/Malay/Tamil", suggestions: ["4 days in Singapore for families", "Singapore food tour", "Singapore luxury weekend"] },
  "new york": { name: "New York", country: "USA", continent: "North America", description: "The city that never sleeps delivers iconic landmarks, Broadway shows, world-class dining, and neighborhoods each with their own distinct character.", highlights: ["Central Park", "Times Square", "Brooklyn Bridge", "MoMA", "Greenwich Village"], bestFor: ["Couples", "Solo travelers", "Theater lovers", "Foodies"], idealDuration: "5-7 days", bestMonths: "Apr-Jun, Sep-Nov", currency: "USD", language: "English", suggestions: ["5 days in New York for a couple", "NYC Broadway and food trip", "New York long weekend"] },
  bali: { name: "Bali", country: "Indonesia", continent: "Asia", description: "Lush rice terraces, sacred temples, world-class surfing, and yoga retreats — Bali offers spiritual renewal and adventure in one of the world's most beautiful settings.", highlights: ["Ubud Rice Terraces", "Uluwatu Temple", "Seminyak Beach", "Tegallalang", "Mount Batur"], bestFor: ["Couples", "Solo travelers", "Honeymooners", "Wellness seekers"], idealDuration: "7-10 days", bestMonths: "Apr-Oct", currency: "IDR", language: "Indonesian/Balinese", suggestions: ["7 days honeymoon in Bali", "Bali wellness and culture trip", "Bali adventure trip for couples"] },
  marrakech: { name: "Marrakech", country: "Morocco", continent: "Africa", description: "Step into a sensory kaleidoscope of spice markets, ornate riads, and the Atlas Mountains on the horizon. Marrakech is North Africa's most intoxicating city.", highlights: ["Jemaa el-Fnaa", "Bahia Palace", "Majorelle Garden", "Medina Souks", "Atlas Mountains"], bestFor: ["Couples", "Culture lovers", "Adventure seekers", "Photographers"], idealDuration: "3-4 days", bestMonths: "Mar-May, Sep-Nov", currency: "MAD", language: "Arabic/French", suggestions: ["4 days in Marrakech for a couple", "Marrakech and Atlas Mountains trip", "Marrakech food and culture weekend"] },
};

// Generate a slug from city name
const citySlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

const Destination = () => {
  const { city } = useParams<{ city: string }>();
  const navigate = useNavigate();
  const cityKey = city?.toLowerCase().replace(/-/g, " ") || "";
  const dest = DESTINATIONS[cityKey];
  const { imageUrl: heroImg } = useCityHeroImage(dest?.name || city || "");

  // Set document title for SEO
  useEffect(() => {
    if (dest) {
      document.title = `Plan a Trip to ${dest.name} — AI Itinerary Generator | Jolliday`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", `Plan your ${dest.name} trip with AI. Get a complete day-by-day itinerary with flights, hotels, activities, and booking links in under 60 seconds. ${dest.description.slice(0, 100)}`);
    }
    return () => { document.title = "Jolliday — AI Trip Planner | Plan Any Trip in One Chat"; };
  }, [dest]);

  if (!dest) {
    // Fallback for cities not in our curated list — still show a generic page
    const displayCity = city?.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "This Destination";
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border px-4 py-3">
          <Link to="/"><Logo size="sm" /></Link>
        </header>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">Plan a Trip to {displayCity}</h1>
          <p className="text-lg text-muted-foreground mb-8">Let Jolliday AI create a complete itinerary for {displayCity} in under 60 seconds.</p>
          <Button size="lg" onClick={() => navigate(`/chat?q=Plan a trip to ${displayCity}`)} className="h-14 px-8 rounded-full text-lg font-bold gap-2">
            Plan my {displayCity} trip <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/"><Logo size="sm" /></Link>
          <Button size="sm" onClick={() => navigate(`/chat?q=${encodeURIComponent(dest.suggestions[0])}`)} className="gap-1.5 rounded-full">
            Plan this trip <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative h-[50vh] min-h-[360px] max-h-[500px] overflow-hidden">
        {heroImg ? (
          <img src={heroImg} alt={`${dest.name} travel`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-muted to-accent/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-10">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs uppercase tracking-[0.3em] text-foreground/70 mb-2 flex items-center gap-1.5">
              <MapPin className="h-3 w-3" /> {dest.country} · {dest.continent}
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground">
              Plan a Trip to {dest.name}
            </h1>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
        {/* Quick facts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          <div className="p-4 rounded-xl border border-border bg-card">
            <Clock className="h-4 w-4 text-primary mb-2" />
            <p className="text-xs text-muted-foreground">Ideal duration</p>
            <p className="font-semibold">{dest.idealDuration}</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card">
            <Calendar className="h-4 w-4 text-primary mb-2" />
            <p className="text-xs text-muted-foreground">Best time to visit</p>
            <p className="font-semibold">{dest.bestMonths}</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card">
            <Users className="h-4 w-4 text-primary mb-2" />
            <p className="text-xs text-muted-foreground">Best for</p>
            <p className="font-semibold">{dest.bestFor[0]}</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card">
            <Sparkles className="h-4 w-4 text-primary mb-2" />
            <p className="text-xs text-muted-foreground">Currency</p>
            <p className="font-semibold">{dest.currency}</p>
          </div>
        </div>

        {/* Description */}
        <div className="max-w-3xl mb-12">
          <h2 className="text-2xl font-bold mb-4">Why visit {dest.name}?</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">{dest.description}</p>
        </div>

        {/* Highlights */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Top attractions</h2>
          <div className="flex flex-wrap gap-2">
            {dest.highlights.map(h => (
              <span key={h} className="px-4 py-2 rounded-full border border-border bg-card text-sm font-medium">{h}</span>
            ))}
          </div>
        </div>

        {/* Best for */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Perfect for</h2>
          <div className="flex flex-wrap gap-2">
            {dest.bestFor.map(b => (
              <span key={b} className="px-4 py-2 rounded-full bg-primary/5 border border-primary/15 text-sm font-medium text-primary">{b}</span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-3xl bg-foreground text-background p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to plan your {dest.name} trip?</h2>
          <p className="text-background/70 mb-6 max-w-lg mx-auto">
            Tell Jolliday AI about your ideal trip and get a complete day-by-day itinerary with real prices and booking links in under 60 seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {dest.suggestions.map((s, i) => (
              <Button
                key={i}
                variant={i === 0 ? "default" : "outline"}
                size="lg"
                onClick={() => navigate(`/chat?q=${encodeURIComponent(s)}`)}
                className={`rounded-full gap-2 ${i === 0 ? "bg-white text-black hover:bg-white/90" : "border-white/30 text-white hover:bg-white/10"}`}
              >
                {i === 0 && <Plane className="h-4 w-4" />}
                {s}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Structured data for this destination */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "TouristDestination",
        "name": dest.name,
        "description": dest.description,
        "touristType": dest.bestFor,
        "containedInPlace": { "@type": "Country", "name": dest.country },
      })}} />
    </div>
  );
};

export default Destination;
