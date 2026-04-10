import { Star, MapPin, GitCompare, Hotel } from "lucide-react";
import { HotelData, useTripContext } from "@/contexts/TripContext";

const HotelCard = ({ hotel, onClick }: { hotel: HotelData; onClick: () => void }) => {
  const hasImage = !!hotel.realImage;
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
        {hasImage ? (
          <img src={hotel.realImage} alt={hotel.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-muted to-accent/20 flex items-center justify-center">
            <Hotel className="h-10 w-10 text-muted-foreground/50" />
          </div>
        )}
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
