import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, MapPin, ExternalLink, Lightbulb, PlusCircle, CheckCircle } from "lucide-react";
import { HotelData } from "@/contexts/TripContext";
import { getHotelImage } from "./HotelCard";
import { useTripContext } from "@/contexts/TripContext";

const HotelDetailModal = ({
  hotel,
  open,
  onOpenChange,
}: {
  hotel: HotelData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { addItem, removeItem, isInTrip } = useTripContext();

  if (!hotel) return null;

  const imgUrl = hotel.realImage || getHotelImage(hotel.image);
  const searchQuery = encodeURIComponent(hotel.name + " " + hotel.location);
  const inTrip = isInTrip("hotel", hotel.id);

  const toggleTrip = () => {
    if (inTrip) removeItem("hotel", hotel.id);
    else addItem({ type: "hotel", data: hotel });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div className="relative h-48">
          <img src={imgUrl} alt={hotel.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h2 className="text-xl font-bold">{hotel.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex">
                {Array.from({ length: hotel.stars }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm opacity-80 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {hotel.location}
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{hotel.description}</p>

          {hotel.isLive && (
            <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live prices
            </div>
          )}

          <div className="text-2xl font-bold">
            {hotel.priceRange
              ? <>{hotel.currency}{hotel.priceRange.min}–{hotel.priceRange.max}<span className="text-sm font-normal text-muted-foreground"> / night</span></>
              : <>{hotel.currency}{hotel.pricePerNight}<span className="text-sm font-normal text-muted-foreground"> / night</span></>
            }
          </div>

          {hotel.rating && (
            <div className="flex items-center gap-1 text-sm">
              <span className="font-semibold">{hotel.rating}</span>
              <span className="text-muted-foreground">/ 5 rating</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Prices may vary by season. Check availability and compare prices across booking platforms.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={inTrip ? "secondary" : "outline"}
              className="gap-2"
              onClick={toggleTrip}
            >
              {inTrip ? <CheckCircle className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
              {inTrip ? "Added" : "Add to Trip"}
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={() => window.open(`https://www.booking.com/searchresults.html?ss=${searchQuery}`, "_blank")}
            >
              Book on Booking.com
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HotelDetailModal;
