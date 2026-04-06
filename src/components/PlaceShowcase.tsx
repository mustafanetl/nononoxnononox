import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PlaceShowcaseProps {
  place: string;
  vibes?: string[];
}

interface PlaceImage {
  url: string;
  thumbUrl?: string;
}

const imageCache: Record<string, PlaceImage[]> = {};

const PlaceShowcase = ({ place, vibes }: PlaceShowcaseProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [images, setImages] = useState<PlaceImage[]>(imageCache[place] || []);
  const [loading, setLoading] = useState(!imageCache[place]);

  useEffect(() => {
    if (imageCache[place]) {
      setImages(imageCache[place]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const fetchImages = async () => {
      try {
        const res = await supabase.functions.invoke("enrich-destination", {
          body: { destination: place, imageOnly: true },
        });
        if (cancelled) return;
        const data = res.data;
        const fetched: PlaceImage[] = (data?.images || []).map((img: any) => ({
          url: img.url || img.thumbUrl,
          thumbUrl: img.thumbUrl || img.url,
        }));
        imageCache[place] = fetched;
        setImages(fetched);
      } catch {
        // silent fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchImages();
    return () => { cancelled = true; };
  }, [place]);

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
  }, [images]);

  if (!loading && images.length === 0) return null;

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

      {/* Loading skeleton */}
      {loading && (
        <div className="flex gap-3 px-3 pb-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shrink-0 rounded-lg bg-muted animate-pulse" style={{ width: "75%", maxWidth: 320, height: 160 }} />
          ))}
        </div>
      )}

      {/* Image carousel */}
      {!loading && images.length > 0 && (
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
            {images.map((img, idx) => (
              <div
                key={idx}
                className="relative shrink-0 snap-center rounded-lg overflow-hidden"
                style={{ width: images.length === 1 ? "100%" : "75%", maxWidth: 320 }}
              >
                <img
                  src={img.thumbUrl || img.url}
                  alt={place}
                  className="w-full h-40 object-cover"
                  loading="lazy"
                />
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
      )}
    </div>
  );
};

export default PlaceShowcase;
