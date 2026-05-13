import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Clock,
  DollarSign,
  MapPin,
  Star,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Loader2,
  ArrowLeft,
  Sparkles,
  X,
  Camera,
} from "lucide-react";
import { ActivityData } from "./ActivityCard";
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
  excludeNames,
}: {
  activity: ActivityData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  destination?: string;
  onReplace?: (newActivity: ActivityData) => void;
  excludeNames?: string[];
}) => {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [alternatives, setAlternatives] = useState<ActivityData[]>([]);
  const [loadingAlts, setLoadingAlts] = useState(false);
  const [swapRequest, setSwapRequest] = useState("");
  const [lastSwapRequest, setLastSwapRequest] = useState("");

  useEffect(() => {
    setPhotoIdx(0);
    setShowAlternatives(false);
    setAlternatives([]);
    setSwapRequest("");
    setLastSwapRequest("");
  }, [activity?.id]);

  if (!activity) return null;

  const photos = createDistinctPhotoGallery({
    primary: activity.realPhoto,
    sources: [activity.realPhotos],
    limit: 6,
  });
  const hasImage = photos.length > 0;

  const fetchAlternatives = async () => {
    if (!destination) {
      toast.error("Can't find alternatives without a destination");
      return;
    }
    const userRequest = swapRequest.trim();
    setLoadingAlts(true);
    setShowAlternatives(true);
    setLastSwapRequest(userRequest);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-activity-alternatives", {
        body: {
          activity,
          destination,
          excludeNames: excludeNames || [],
          userRequest: userRequest || undefined,
        },
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

  const handleClose = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">{activity.name}</DialogTitle>
        <DialogDescription className="sr-only">Activity details and options.</DialogDescription>

        {showAlternatives ? (
          <div className="flex flex-col max-h-[85vh]">
            {/* Header for alternatives view */}
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-background">
              <div className="flex items-center gap-2 min-w-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAlternatives(false)}
                  className="gap-1 -ml-2 shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <h3 className="font-semibold text-sm truncate">
                  {lastSwapRequest
                    ? `"${lastSwapRequest}" alternatives`
                    : `Alternatives to ${activity.name}`}
                </h3>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8 shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingAlts ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Finding similar spots…</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alternatives.map((alt) => (
                    <div
                      key={alt.id}
                      className="rounded-2xl border border-border overflow-hidden hover:shadow-md transition-all"
                    >
                      {alt.realPhoto ? (
                        <img
                          src={alt.realPhoto}
                          alt={alt.name}
                          className="w-full h-36 object-cover"
                        />
                      ) : (
                        <div className="w-full h-36 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
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
                        {alt.why && (
                          <p className="text-xs italic text-muted-foreground line-clamp-2">
                            "{alt.why}"
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                          {alt.neighborhood && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />
                              {alt.neighborhood}
                            </span>
                          )}
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" />
                            {alt.duration}
                          </span>
                          <span className="font-semibold text-foreground">
                            ~{alt.currency}
                            {alt.price}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          className="w-full mt-1"
                          onClick={() => pickAlternative(alt)}
                          disabled={!onReplace}
                        >
                          Use this instead
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col max-h-[85vh]">
            {/* Photo gallery */}
            <div className="relative shrink-0 bg-muted">
              {/* Close button — always visible */}
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur flex items-center justify-center text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative aspect-[16/10] bg-gradient-to-br from-primary/15 via-muted to-accent/15">
                {hasImage ? (
                  <img
                    src={photos[photoIdx]}
                    alt={activity.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}

                {photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setPhotoIdx((i) => Math.max(0, i - 1))}
                      disabled={photoIdx === 0}
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 disabled:opacity-30 backdrop-blur flex items-center justify-center text-white transition"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoIdx((i) => Math.min(photos.length - 1, i + 1))}
                      disabled={photoIdx === photos.length - 1}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 disabled:opacity-30 backdrop-blur flex items-center justify-center text-white transition"
                      aria-label="Next photo"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-[10px] font-medium text-white tabular-nums">
                      {photoIdx + 1} / {photos.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail strip */}
              {photos.length > 1 && (
                <div className="px-3 py-2 flex gap-1.5 overflow-x-auto scrollbar-hide bg-background border-t border-border">
                  {photos.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPhotoIdx(i)}
                      className={`shrink-0 h-12 w-16 rounded-md overflow-hidden border-2 transition-all ${
                        i === photoIdx
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-5 space-y-4">
              {/* Title + verified badge */}
              <div>
                <div className="flex items-start gap-2 flex-wrap">
                  <h2 className="text-xl font-bold leading-tight flex-1 min-w-0">
                    {activity.name}
                  </h2>
                  {activity.verified && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold flex items-center gap-1 shrink-0 mt-1">
                      <CheckCircle2 className="h-3 w-3" /> Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground capitalize mt-0.5">
                  {activity.category}
                </p>
              </div>

              {/* Quick stats row */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  {activity.duration}
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-foreground">
                  <DollarSign className="h-4 w-4 text-primary" />
                  ~{activity.currency}
                  {activity.price}
                </span>
                {activity.verifiedRating && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {activity.verifiedRating}
                  </span>
                )}
              </div>

              {/* Address / hours */}
              {(activity.verifiedAddress || activity.neighborhood) && (
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{activity.verifiedAddress || activity.neighborhood}</span>
                </div>
              )}
              {activity.hours && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {activity.hours}
                </div>
              )}

              {/* Description */}
              {activity.description && (
                <p className="text-sm leading-relaxed text-foreground/80">
                  {activity.description}
                </p>
              )}

              {/* Why pick */}
              {activity.why && (
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-xs text-foreground italic">"{activity.why}"</p>
                </div>
              )}

              {/* Swap controls */}
              {onReplace && (
                <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3 mt-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Want something different?
                  </label>
                  <input
                    type="text"
                    value={swapRequest}
                    onChange={(e) => setSwapRequest(e.target.value)}
                    placeholder="e.g. skydiving, vegan restaurant, art gallery"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && swapRequest.trim()) {
                        e.preventDefault();
                        fetchAlternatives();
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      className="flex-1 gap-2"
                      onClick={fetchAlternatives}
                      disabled={!swapRequest.trim()}
                    >
                      <Sparkles className="h-4 w-4" /> Find match
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => {
                        setSwapRequest("");
                        fetchAlternatives();
                      }}
                    >
                      <Shuffle className="h-4 w-4" /> Swap anyway
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ActivityDetailModal;
