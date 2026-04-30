import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, DollarSign, Lightbulb, PlusCircle, CheckCircle, Camera, MapPin, Star, CheckCircle2, ChevronLeft, ChevronRight, Shuffle, Loader2, ArrowLeft } from "lucide-react";
import { ActivityData } from "./ActivityCard";
import { useTripContext } from "@/contexts/TripContext";
import { useEffect, useState } from "react";
import { createDistinctPhotoGallery } from "@/utils/photoGallery";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ActivityDetailModal = ({
  activity,
  open,
  onOpenChange,
  destination,
  onReplace,
}: {
  activity: ActivityData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  destination?: string;
  onReplace?: (newActivity: ActivityData) => void;
}) => {
  const { addItem, removeItem, isInTrip } = useTripContext();

  const [photoIdx, setPhotoIdx] = useState(0);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [alternatives, setAlternatives] = useState<ActivityData[]>([]);
  const [loadingAlts, setLoadingAlts] = useState(false);

  useEffect(() => {
    setPhotoIdx(0);
    setShowAlternatives(false);
    setAlternatives([]);
  }, [activity?.id]);

  if (!activity) return null;

  const photos = createDistinctPhotoGallery({
    primary: activity.realPhoto,
    sources: [activity.realPhotos],
    limit: 4,
  });
  const hasImage = photos.length > 0;
  const inTrip = isInTrip("activity", activity.id);

  const toggleTrip = () => {
    if (inTrip) removeItem("activity", activity.id);
    else addItem({ type: "activity", data: activity });
  };

  const fetchAlternatives = async () => {
    if (!destination) {
      toast.error("Can't find alternatives without a destination");
      return;
    }
    setLoadingAlts(true);
    setShowAlternatives(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-activity-alternatives", {
        body: { activity, destination },
      });
      if (error) throw error;
      const sugg = (data?.suggestions || []) as ActivityData[];
      if (sugg.length === 0) {
        toast.error("Couldn't find good alternatives — try again");
        setShowAlternatives(false);
      } else {
        setAlternatives(sugg);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load alternatives");
      setShowAlternatives(false);
    } finally {
      setLoadingAlts(false);
    }
  };

  const pickAlternative = (alt: ActivityData) => {
    if (!onReplace) return;
    onReplace(alt);
    toast.success(`Swapped in ${alt.name}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {showAlternatives ? (
          <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAlternatives(false)} className="gap-1 -ml-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <h3 className="font-semibold text-sm">Alternatives to {activity.name}</h3>
            </div>
            {loadingAlts ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Finding similar spots…</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alternatives.map((alt) => (
                  <div key={alt.id} className="rounded-xl border border-border overflow-hidden hover:shadow-md transition-all">
                    {alt.realPhoto ? (
                      <img src={alt.realPhoto} alt={alt.name} className="w-full h-32 object-cover" />
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <Camera className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm leading-tight">{alt.name}</h4>
                        {alt.verifiedRating && (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground shrink-0">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {alt.verifiedRating}
                          </span>
                        )}
                      </div>
                      {alt.why && <p className="text-xs italic text-muted-foreground">"{alt.why}"</p>}
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        {alt.neighborhood && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{alt.neighborhood}</span>}
                        <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{alt.duration}</span>
                        <span className="font-semibold text-foreground">~{alt.currency}{alt.price}</span>
                      </div>
                      <Button size="sm" className="w-full mt-1" onClick={() => pickAlternative(alt)} disabled={!onReplace}>
                        Use this instead
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
        <>
        <div className="relative h-48">
          {hasImage ? (
            <img src={photos[photoIdx]} alt={activity.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-muted to-accent/20 flex items-center justify-center">
              <Camera className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setPhotoIdx((i) => Math.max(0, i - 1))}
                disabled={photoIdx === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 disabled:opacity-30 backdrop-blur flex items-center justify-center text-white transition"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPhotoIdx((i) => Math.min(photos.length - 1, i + 1))}
                disabled={photoIdx === photos.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 disabled:opacity-30 backdrop-blur flex items-center justify-center text-white transition"
                aria-label="Next photo"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur text-[10px] font-medium text-white tabular-nums">
                {photoIdx + 1} / {photos.length}
              </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPhotoIdx(i)}
                    className={`h-1.5 rounded-full transition-all ${i === photoIdx ? "w-4 bg-white" : "w-1.5 bg-white/50"}`}
                    aria-label={`Photo ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold">{activity.name}</h2>
              {activity.verified && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/90 text-[10px] font-medium flex items-center gap-0.5">
                  <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                </span>
              )}
            </div>
            <p className="text-sm opacity-80 capitalize">{activity.category}</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{activity.description}</p>

          {activity.why && (
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-xs text-foreground italic">"{activity.why}"</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3 text-sm">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              {activity.duration}
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              <DollarSign className="h-4 w-4 text-primary" />
              ~{activity.currency}{activity.price} per person
            </span>
            {activity.verifiedRating && (
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {activity.verifiedRating}
              </span>
            )}
          </div>

          {(activity.verifiedAddress || activity.neighborhood) && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {activity.verifiedAddress || activity.neighborhood}
            </div>
          )}

          {activity.hours && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {activity.hours}
            </div>
          )}

          {!activity.verified && (
            <div className="p-3 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  This is an AI suggestion. Verify details and check availability before booking.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {onReplace && (
              <Button
                variant="default"
                className="w-full gap-2"
                onClick={fetchAlternatives}
              >
                <Shuffle className="h-4 w-4" /> Swap with another option
              </Button>
            )}
            <Button
              variant={inTrip ? "secondary" : "outline"}
              className="gap-2 w-full"
              onClick={toggleTrip}
            >
              {inTrip ? <CheckCircle className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
              {inTrip ? "Added" : "Add to Trip"}
            </Button>
          </div>
        </div>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ActivityDetailModal;
