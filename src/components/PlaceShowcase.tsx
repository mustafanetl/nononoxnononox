import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { getPlaceImages, getPlaceImageLabels } from "@/utils/cityImages";

interface PlaceShowcaseProps {
  place: string;
  vibes?: string[];
}

const PlaceShowcase = ({ place, vibes }: PlaceShowcaseProps) => {
  const images = getPlaceImages(place);
  const labels = getPlaceImageLabels(place);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const newIdx = dir === "left" ? Math.max(0, activeIdx - 1) : Math.min(images.length - 1, activeIdx + 1);
    setActiveIdx(newIdx);
    const child = scrollRef.current.children[newIdx] as HTMLElement;
    child?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const scrollLeft = el.scrollLeft;
      const childWidth = el.children[0]?.clientWidth || 200;
      setActiveIdx(Math.round(scrollLeft / (childWidth + 12)));
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  if (images.length === 0) return null;

  return (
    <div className="mt-3 mb-2 rounded-xl overflow-hidden border border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        <span className="text-sm font-medium capitalize">{place}</span>
        {vibes && vibes.length > 0 && (
          <div className="flex gap-1 ml-auto">
            {vibes.map((v) => (
              <span key={v} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{v}</span>
            ))}
          </div>
        )}
      </div>

      {/* Image carousel */}
      <div className="relative">
        {images.length > 1 && activeIdx > 0 && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-background/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center shadow-md hover:bg-background transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}
        {images.length > 1 && activeIdx < images.length - 1 && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-background/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center shadow-md hover:bg-background transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-3 pb-3 snap-x snap-mandatory"
        >
          {images.map((src, idx) => (
            <div
              key={idx}
              className="relative shrink-0 snap-center rounded-lg overflow-hidden"
              style={{ width: images.length === 1 ? "100%" : "75%", maxWidth: 320 }}
            >
              <img
                src={src}
                alt={labels[idx] || place}
                className="w-full h-40 object-cover"
                loading="lazy"
              />
              {labels[idx] && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-2.5 py-1.5">
                  <span className="text-white text-xs font-medium">{labels[idx]}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Dots */}
        {images.length > 1 && (
          <div className="flex justify-center gap-1 pb-2">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === activeIdx ? "bg-primary" : "bg-muted-foreground/30"}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaceShowcase;
