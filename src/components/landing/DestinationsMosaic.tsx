import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

type Dest = { name: string; country: string; tag: string; image: string };

const destinations: Dest[] = [
  {
    name: "Paris",
    country: "France",
    tag: "Couples · City Break",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Tokyo",
    country: "Japan",
    tag: "Culture · Food",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Bali",
    country: "Indonesia",
    tag: "Honeymoon · Beach",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Maldives",
    country: "Indian Ocean",
    tag: "Luxury · Relaxation",
    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Barcelona",
    country: "Spain",
    tag: "Family · Adventure",
    image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80&auto=format&fit=crop",
  },
  {
    name: "Dubai",
    country: "UAE",
    tag: "Shopping · Luxury",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80&auto=format&fit=crop",
  },
];

const DestinationsMosaic = () => {
  return (
    <section className="bg-[#0a0a0f]">
      <div className="container mx-auto px-5 sm:px-8 py-24 md:py-32 lg:py-40 max-w-6xl">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-xs sm:text-sm font-semibold text-indigo-400 tracking-[0.2em] uppercase mb-4">
            Get Inspired
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] text-white leading-[1.05]">
            Popular destinations
          </h2>
          <p className="mt-5 text-base sm:text-lg text-white/40 max-w-lg mx-auto">
            Tap any destination to start planning. Customize everything from there.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {destinations.map((d) => (
            <Link
              key={d.name}
              to={`/chat?q=${encodeURIComponent(`5 days in ${d.name}`)}`}
              className="group relative rounded-2xl overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-300"
            >
              <div className="aspect-[4/3] overflow-hidden relative">
                <img
                  src={d.image}
                  alt={`${d.name}, ${d.country}`}
                  loading="lazy"
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-xl font-bold text-white">
                    {d.name}
                  </h3>
                  <p className="text-sm text-white/60 mt-0.5">
                    {d.tag}
                  </p>
                </div>

                {/* Arrow */}
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="h-4 w-4 text-white" />
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
