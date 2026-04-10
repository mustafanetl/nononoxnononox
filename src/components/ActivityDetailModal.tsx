import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, DollarSign, Lightbulb, PlusCircle, CheckCircle, Camera } from "lucide-react";
import { ActivityData } from "./ActivityCard";
import { useTripContext } from "@/contexts/TripContext";

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

  const hasImage = !!activity.realPhoto;
  const inTrip = isInTrip("activity", activity.id);

  const toggleTrip = () => {
    if (inTrip) removeItem("activity", activity.id);
    else addItem({ type: "activity", data: activity });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div className="relative h-48">
          {hasImage ? (
            <img src={activity.realPhoto} alt={activity.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-muted to-accent/20 flex items-center justify-center">
              <Camera className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
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
              className="gap-2 flex-1"
              onClick={toggleTrip}
            >
              {inTrip ? <CheckCircle className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
              {inTrip ? "Added" : "Add to Trip"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityDetailModal;
