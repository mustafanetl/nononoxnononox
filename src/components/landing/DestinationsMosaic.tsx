import { Link } from "react-router-dom";

type Dest = { name: string; country: string; image: string };

const destinations: Dest[] = [
  {
    name: "Paris",
    country: "France",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Tokyo",
    country: "Japan",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Bali",
    country: "Indonesia",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Maldives",
    country: "Indian Ocean",
    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Barcelona",
    country: "Spain",
    image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Dubai",
    country: "UAE",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80&auto=format&fit=crop",
  },
];

const DestinationsMosaic = () => {
  return (
    <section className="bg-background">
      <div className="container mx-auto px-4 py-20 md:py-24 max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Popular destinations
          </h2>
          <p className="mt-3 text-muted-foreground">
            Tap a city to start planning. You can change everything later.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {destinations.map((d) => (
            <Link
              key={d.name}
              to={`/chat?q=Plan a trip to ${d.name}`}
              className="group relative aspect-[4/3] rounded-xl overflow-hidden"
            >
              <img
                src={d.image}
                alt={`${d.name}, ${d.country}`}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-x-4 bottom-4">
                <div className="text-[10px] uppercase tracking-[0.15em] text-white/70">
                  {d.country}
                </div>
                <div className="text-lg md:text-xl font-bold text-white">
                  {d.name}
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
