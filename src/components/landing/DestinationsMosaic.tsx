import { Link } from "react-router-dom";

type Dest = { name: string; country: string; image: string; size: "lg" | "sm" };

const destinations: Dest[] = [
  { name: "Paris", country: "France", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1000&h=800&fit=crop", size: "lg" },
  { name: "Tokyo", country: "Japan", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=800&fit=crop", size: "sm" },
  { name: "Bali", country: "Indonesia", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=800&fit=crop", size: "sm" },
  { name: "Maldives", country: "Indian Ocean", image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1000&h=800&fit=crop", size: "lg" },
  { name: "Barcelona", country: "Spain", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&h=800&fit=crop", size: "sm" },
  { name: "Dubai", country: "UAE", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=800&fit=crop", size: "sm" },
];

const Card = ({ d, className = "" }: { d: Dest; className?: string }) => (
  <Link
    to={`/chat?q=Plan a trip to ${d.name}`}
    className={`group relative block overflow-hidden bg-muted ${className}`}
  >
    <img
      src={d.image}
      alt={d.name}
      loading="lazy"
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
    <div className="absolute inset-x-6 bottom-6 text-white">
      <div className="text-[10px] uppercase tracking-[0.2em] opacity-80">{d.country}</div>
      <div className="text-3xl md:text-5xl font-bold tracking-tight mt-1 group-hover:underline underline-offset-[6px] decoration-2">
        {d.name}
      </div>
    </div>
  </Link>
);

const DestinationsMosaic = () => {
  return (
    <section className="container mx-auto px-4 py-24 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-12 gap-6">
          <div>
            <span className="inline-block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
              Where people go
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.05]">
              Start somewhere.
            </h2>
          </div>
          <p className="hidden md:block text-sm text-muted-foreground max-w-xs text-right">
            Tap a city. We'll start the plan from there — you can change everything.
          </p>
        </div>

        {/* Mosaic */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <Card d={destinations[0]} className="col-span-2 md:col-span-2 aspect-[16/10]" />
          <Card d={destinations[1]} className="col-span-2 md:col-span-1 aspect-[4/5] md:aspect-auto" />

          <Card d={destinations[2]} className="col-span-1 aspect-square" />
          <Card d={destinations[3]} className="col-span-2 md:col-span-2 aspect-[16/10]" />

          <Card d={destinations[4]} className="col-span-1 aspect-square" />
          <Card d={destinations[5]} className="col-span-1 md:col-span-2 aspect-[2/1] md:aspect-[16/9]" />
        </div>
      </div>
    </section>
  );
};

export default DestinationsMosaic;