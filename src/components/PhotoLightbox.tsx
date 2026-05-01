import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoLightboxProps {
  photos: string[];
  startIndex?: number;
  venueName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewDetails?: () => void;
}

const PhotoLightbox = ({
  photos,
  startIndex = 0,
  venueName,
  open,
  onOpenChange,
  onViewDetails,
}: PhotoLightboxProps) => {
  const [idx, setIdx] = useState(startIndex);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const thumbsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) setIdx(Math.min(Math.max(startIndex, 0), Math.max(photos.length - 1, 0)));
  }, [open, startIndex, photos.length]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIdx((i) => Math.min(i + 1, photos.length - 1));
      else if (e.key === "ArrowLeft") setIdx((i) => Math.max(i - 1, 0));
      else if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, photos.length, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const el = thumbsRef.current?.querySelector<HTMLElement>(`[data-thumb-index="${idx}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [idx, open]);

  if (!photos || photos.length === 0) return null;

  const next = () => setIdx((i) => Math.min(i + 1, photos.length - 1));
  const prev = () => setIdx((i) => Math.max(i - 1, 0));

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dy) > 80 && Math.abs(dy) > Math.abs(dx)) {
      onOpenChange(false);
    } else if (Math.abs(dx) > 50) {
      if (dx < 0) next();
      else prev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleViewDetails = () => {
    onOpenChange(false);
    setTimeout(() => onViewDetails?.(), 80);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-none w-screen h-[100dvh] p-0 bg-black border-0 rounded-none [&>button]:hidden"
      >
        <DialogTitle className="sr-only">{venueName ? `Photos of ${venueName}` : "Photo gallery"}</DialogTitle>
        <DialogDescription className="sr-only">Swipe or use arrow keys to navigate photos.</DialogDescription>
        <div
          className="relative w-full h-full flex flex-col"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Blurred ambient backdrop derived from the current photo — fills the void */}
          <div
            key={`bg-${idx}`}
            className="absolute inset-0 bg-center bg-cover scale-110 opacity-50 transition-opacity duration-500"
            style={{ backgroundImage: `url(${photos[idx]})`, filter: "blur(40px) saturate(1.2)" }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-black/55" aria-hidden />

          {/* Top bar */}
          <div className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-4 bg-gradient-to-b from-black/60 to-transparent">
            <div className="min-w-0 text-white">
              {venueName && (
                <h3 className="text-sm sm:text-base font-semibold truncate max-w-[60vw]">
                  {venueName}
                </h3>
              )}
              <p className="text-xs text-white/70 tabular-nums">
                {idx + 1} / {photos.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center text-white transition"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Main image */}
          <div className="relative z-10 flex-1 flex items-center justify-center px-3 sm:px-6 py-2 overflow-hidden">
            <div className="relative max-w-[min(96vw,1100px)] max-h-full w-full h-full flex items-center justify-center">
              <img
                key={idx}
                src={photos[idx]}
                alt={venueName ? `${venueName} – photo ${idx + 1}` : `Photo ${idx + 1}`}
                className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] select-none animate-in fade-in zoom-in-95 duration-300"
                draggable={false}
              />
            </div>

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  disabled={idx === 0}
                  className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 backdrop-blur items-center justify-center text-white transition"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  disabled={idx === photos.length - 1}
                  className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 backdrop-blur items-center justify-center text-white transition"
                  aria-label="Next"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {/* Bottom: thumbnails + CTA */}
          <div className="relative z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-6 pb-4 px-3 sm:px-6 space-y-3">
            {photos.length > 1 && (
              <div
                ref={thumbsRef}
                className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: "none" }}
              >
                {photos.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    data-thumb-index={i}
                    onClick={() => setIdx(i)}
                    className={`relative shrink-0 h-14 w-14 sm:h-16 sm:w-16 rounded-lg overflow-hidden transition ring-2 ${
                      i === idx ? "ring-white opacity-100 scale-105" : "ring-transparent opacity-60 hover:opacity-100"
                    }`}
                    aria-label={`Photo ${i + 1}`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {onViewDetails && (
              <div className="flex justify-center">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleViewDetails}
                  className="gap-1.5 bg-white text-black hover:bg-white/90"
                >
                  <Info className="h-3.5 w-3.5" />
                  View activity details
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoLightbox;