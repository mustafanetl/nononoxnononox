import { Star, MapPin } from "lucide-react";
import { HotelData } from "@/contexts/TripContext";

const hotelImages: Record<string, string> = {
  luxury: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop",
  resort: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=250&fit=crop",
  boutique: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=250&fit=crop",
  beach: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=250&fit=crop",
  city: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=250&fit=crop",
  villa: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=250&fit=crop",
  hostel: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=250&fit=crop",
  default: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop",
};

export const getHotelImage = (image: string) => hotelImages[image] || hotelImages.default;

const HotelCard = ({ hotel, onClick }: { hotel: HotelData; onClick: () => void }) => {
  const imgUrl = getHotelImage(hotel.image);

  return (
    <div
      onClick={onClick}
      className="min-w-[260px] max-w-[260px] rounded-2xl border border-border bg-card overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
    >
      <div className="relative h-36">
        <img src={imgUrl} alt={hotel.name} className="w-full h-full object-cover" />
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm text-[10px] font-bold">
          {hotel.currency}{hotel.pricePerNight}/night
        </div>
      </div>
      <div className="p-3 space-y-1.5">
        <h3 className="font-semibold text-sm leading-tight">{hotel.name}</h3>
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
