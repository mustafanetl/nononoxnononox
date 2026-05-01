import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useCityImage } from "@/hooks/useCityImages";

type Dest = { name: string; country: string; tagline: string };

const destinations: Dest[] = [
  { name: "Paris", country: "France", tagline: "For long lunches and slow walks." },
  { name: "Tokyo", country: "Japan", tagline: "For neon, noodles, neighborhoods." },
  { name: "Bali", country: "Indonesia", tagline: "For warm water and quiet mornings." },
  { name: "Maldives", country: "Indian Ocean", tagline: "For doing absolutely nothing, well." },
  { name: "Barcelona", country: "Spain", tagline: "For tapas and tiled rooftops." },
  { name: "Dubai", country: "UAE", tagline: "For skylines and desert nights." },
];

const Card = ({ d, className = "" }: { d: Dest; className?: string }) => {
  const image = useCityImage(d.name);
  return (
    <Link
      to={`/chat?q=Plan a trip to ${d.name}`}
      className={`group relative block overflow-hidden rounded-lg border border-border bg-gradient-to-br from-muted/30 via-card to-card transition-colors ${className}`}
    >
      {image && (
        <img
          src={image}
          alt={`${d.name}, ${d.country}`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700"
        />
      )}
      {/* Readability gradient over photo */}
      {image && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      )}
      <div className="absolute top-4 right-4 sm:top-5 sm:right-5 opacity-60 group-hover:opacity-100 transition-opacity">
        <ArrowUpRight className={`h-5 w-5 ${image ? "text-white" : "text-foreground"}`} />
      </div>
      <div className="absolute inset-x-5 sm:inset-x-6 bottom-5 sm:bottom-6">
        <div className={`text-[9px] sm:text-[10px] uppercase tracking-[0.2em] ${image ? "text-white/70" : "text-muted-foreground"}`}>
          {d.country}
        </div>
        <div className={`text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mt-1 group-hover:underline underline-offset-[6px] decoration-2 ${image ? "text-white" : "text-foreground"}`}>
          {d.name}
        </div>
        <div className={`mt-2 text-xs sm:text-sm max-w-[18rem] ${image ? "text-white/80" : "text-muted-foreground"}`}>
          {d.tagline}
        </div>
      </div>
    </Link>
  );
};

const DestinationsMosaic = () => {
  return (
    <section className="container mx-auto px-4 py-20 md:py-24 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 md:mb-12 gap-4 md:gap-6">
          <div>
            <span className="inline-block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 md:mb-4">
              Where people go
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.05]">
              Start somewhere.
            </h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs md:text-right">
            Tap a city. We'll start the plan from there — you can change everything.
          </p>
        </div>

        {/* Mosaic */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {destinations.map((d) => (
            <Card key={d.name} d={d} className="aspect-[5/3] md:aspect-[4/3]" />
          ))}
        </div>
      </div>
    </section>
  );
};

export default DestinationsMosaic;
