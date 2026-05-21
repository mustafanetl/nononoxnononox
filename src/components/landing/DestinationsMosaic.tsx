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
      <div className="container mx-auto px-4 sm:px-6 py-20 md:py-28 lg:py-36 max-w-6xl">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-xs sm:text-sm font-semibold text-primary tracking-[0.15em] uppercase mb-3">
            Popular Destinations
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Where to go next
          </h2>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Tap any destination to start planning. You can customize everything
            from there.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {destinations.map((d) => (
            <Link
              key={d.name}
              to={`/destinations/${d.name.toLowerCase()}`}
              className="group relative rounded-2xl overflow-hidden bg-white border border-border hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="aspect-[4/3] overflow-hidden relative">
                <img
                  src={d.image}
                  alt={`${d.name}, ${d.country}`}
                  loading="lazy"
                  className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-foreground truncate">
                      {d.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                      {d.tag}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                    <ArrowRight className="h-4 w-4 text-primary group-hover:text-white group-hover:translate-x-0.5 transition-all" />
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
