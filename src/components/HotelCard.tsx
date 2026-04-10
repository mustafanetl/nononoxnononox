import { Star, MapPin, GitCompare } from "lucide-react";
import { HotelData, useTripContext } from "@/contexts/TripContext";

const hotelImages: Record<string, string[]> = {
  luxury: [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=250&fit=crop",
  ],
  resort: [
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&h=250&fit=crop",
  ],
  boutique: [
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=250&fit=crop",
  ],
  beach: [
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=400&h=250&fit=crop",
  ],
  city: [
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1586611292717-f828b167408c?w=400&h=250&fit=crop",
  ],
  villa: [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=250&fit=crop",
  ],
  hostel: [
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=250&fit=crop",
  ],
  modern: [
    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=250&fit=crop",
  ],
  historic: [
    "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&h=250&fit=crop",
  ],
  eco: [
    "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&h=250&fit=crop",
  ],
  apartment: [
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=250&fit=crop",
  ],
};

const hashName = (name: string): number => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const defaultPool = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=250&fit=crop",
];

export const getHotelImage = (image: string, name = "") => {
  const pool = hotelImages[image];
  if (pool) return pool[hashName(name) % pool.length];
  return defaultPool[hashName(name) % defaultPool.length];
};

const HotelCard = ({ hotel, onClick }: { hotel: HotelData; onClick: () => void }) => {
  const imgUrl = hotel.realImage || getHotelImage(hotel.image, hotel.name);
  const { addToCompare, removeFromCompare, isInCompare } = useTripContext();
  const comparing = isInCompare("hotel", hotel.id);

  const toggleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (comparing) removeFromCompare("hotel", hotel.id);
    else addToCompare({ type: "hotel", data: hotel });
  };

  return (
    <div
      onClick={onClick}
      className="min-w-[260px] max-w-[260px] rounded-2xl border border-border bg-card overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
    >
      <div className="relative h-36">
        <img src={imgUrl} alt={hotel.name} className="w-full h-full object-cover" />
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <span className={`px-1.5 py-0.5 rounded-full backdrop-blur-sm text-[9px] font-medium text-white ${hotel.isLive ? "bg-green-500/90" : "bg-amber-500/90"}`}>
            {hotel.isLive ? "Live" : "Est."}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm text-[10px] font-bold">
            {hotel.priceRange
              ? `${hotel.currency}${hotel.priceRange.min}–${hotel.priceRange.max}/night`
              : `${hotel.currency}${hotel.pricePerNight}/night`}
          </span>
        </div>
        {hotel.rating && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-background/80 backdrop-blur-sm text-[10px] font-bold flex items-center gap-0.5">
            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
            {hotel.rating}
          </div>
        )}
      </div>
      <div className="p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm leading-tight flex-1">{hotel.name}</h3>
          <button onClick={toggleCompare} className={`p-1 rounded-md transition-colors ${comparing ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}>
            <GitCompare className="h-3 w-3" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: hotel.stars }).map((_, i) => (
            <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {hotel.location}
        </div>
      </div>
    </div>
  );
};

export default HotelCard;
