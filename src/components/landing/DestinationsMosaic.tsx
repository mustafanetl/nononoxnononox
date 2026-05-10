import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

type Dest = { name: string; country: string; tag: string; image: string };

const destinations: Dest[] = [
  {
    name: "Paris",
    country: "France",
    tag: "Couples · City Break",
    image:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Tokyo",
    country: "Japan",
    tag: "Culture · Food",
    image:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Bali",
    country: "Indonesia",
    tag: "Honeymoon · Beach",
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Maldives",
    country: "Indian Ocean",
    tag: "Luxury · Relaxation",
    image:
      "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Barcelona",
    country: "Spain",
    tag: "Family · Adventure",
    image:
      "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Dubai",
    country: "UAE",
    tag: "Shopping · Luxury",
    image:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80&auto=format&fit=crop",
  },
];

const DestinationsMosaic = () => {
  return (
    <section className="bg-[hsl(0_0%_98%)]">
      <div className="container mx-auto px-4 py-20 md:py-32 lg:py-40 max-w-5xl">
        <div className="text-center mb-14 md:mb-16">
          <p className="text-sm font-semibold text-primary tracking-wide uppercase mb-3">
            Popular Destinations
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            Where to go next
          </h2>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto">
            Tap a destination to start planning. You can customize everything
            later.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {destinations.map((d) => (
            <Link
              key={d.name}
              to={`/chat?q=Plan a trip to ${d.name}`}
              className="group relative rounded-2xl overflow-hidden border border-border bg-white hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={d.image}
                  alt={`${d.name}, ${d.country}`}
                  loading="lazy"
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {d.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {d.tag}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                    <ArrowRight className="h-3.5 w-3.5 text-primary group-hover:text-white transition-colors" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DestinationsMosaic;
