import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, MapPin, ExternalLink, Lightbulb, PlusCircle, CheckCircle, Hotel, CheckCircle2 } from "lucide-react";
import { HotelData } from "@/contexts/TripContext";
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

  const hasImage = !!hotel.realImage;
  const searchQuery = encodeURIComponent(hotel.name + " " + hotel.location);
  const inTrip = isInTrip("hotel", hotel.id);
  const isVerified = (hotel as any).verified;

  const toggleTrip = () => {
    if (inTrip) removeItem("hotel", hotel.id);
    else addItem({ type: "hotel", data: hotel });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogTitle className="sr-only">{hotel.name}</DialogTitle>
        <DialogDescription className="sr-only">Hotel details and booking link.</DialogDescription>
        <div className="relative h-48">
          {hasImage ? (
            <img src={hotel.realImage} alt={hotel.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-muted to-accent/20 flex items-center justify-center">
              <Hotel className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold">{hotel.name}</h2>
              {isVerified && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/90 text-[10px] font-medium flex items-center gap-0.5">
                  <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex">
                {Array.from({ length: hotel.stars }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm opacity-80 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {(hotel as any).verifiedAddress || hotel.location}
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{hotel.description}</p>

          <div className="text-2xl font-bold">
            ~{hotel.currency}{hotel.pricePerNight}<span className="text-sm font-normal text-muted-foreground"> / night</span>
          </div>

          {hotel.rating && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold">{hotel.rating}</span>
              <span className="text-muted-foreground">/ 5</span>
            </div>
          )}

          {!isVerified && (
            <div className="p-3 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  This is an AI suggestion. Verify availability and compare prices across booking platforms.
                </p>
              </div>
            </div>
          )}

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
