import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, DollarSign, ExternalLink, Lightbulb, MapPin, PlusCircle, CheckCircle } from "lucide-react";
import { ActivityData } from "./ActivityCard";
import { useTripContext } from "@/contexts/TripContext";

const imageMap: Record<string, string> = {
  cruise: "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800&h=400&fit=crop",
  spa: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=400&fit=crop",
  temple: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&h=400&fit=crop",
  beach: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=400&fit=crop",
  hiking: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=400&fit=crop",
  market: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop",
  museum: "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&h=400&fit=crop",
  diving: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=400&fit=crop",
  safari: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&h=400&fit=crop",
  concert: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop",
  food: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop",
  waterfall: "https://images.unsplash.com/photo-1432405972618-c6b0cfba8673?w=800&h=400&fit=crop",
  yoga: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=400&fit=crop",
  shopping: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop",
  sunset: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&h=400&fit=crop",
};

const ActivityDetailModal = ({
  activity,
  open,
  onOpenChange,
}: {
  activity: ActivityData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { addItem, removeItem, isInTrip } = useTripContext();

  if (!activity) return null;

  const imgUrl = imageMap[activity.image] || imageMap.beach;
  const searchQuery = encodeURIComponent(activity.name);
  const inTrip = isInTrip("activity", activity.id);

  const toggleTrip = () => {
    if (inTrip) removeItem("activity", activity.id);
    else addItem({ type: "activity", data: activity });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div className="relative h-48">
          <img src={imgUrl} alt={activity.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h2 className="text-xl font-bold">{activity.name}</h2>
            <p className="text-sm opacity-80 capitalize">{activity.category}</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{activity.description}</p>

          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              {activity.duration}
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              <DollarSign className="h-4 w-4 text-primary" />
              {activity.currency}{activity.price} per person
            </span>
          </div>

          <div className="p-3 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Book in advance for the best prices. Check local reviews and availability before your trip.
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
              onClick={() => window.open(`https://www.getyourguide.com/s/?q=${searchQuery}`, "_blank")}
            >
              <MapPin className="h-4 w-4" />
              Book on GetYourGuide
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityDetailModal;
