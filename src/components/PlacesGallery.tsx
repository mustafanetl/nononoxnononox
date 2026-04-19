import { useEffect, useState } from "react";
import { MapPin, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface PlaceItem {
  name: string;
  location: string;
  why?: string;
  category?: string;
}

interface PlacesGalleryProps {
  places: PlaceItem[];
}

interface EnrichedPlace extends PlaceItem {
  photo?: string;
  verified: boolean;
  loading: boolean;
}

// Module-level cache keyed by name+location
const photoCache: Record<string, { photo?: string; verified: boolean }> = {};

const PlacesGallery = ({ places }: PlacesGalleryProps) => {
  const [enriched, setEnriched] = useState<EnrichedPlace[]>(() =>
    places.map((p) => {
      const key = `${p.name}|${p.location}`;
      const cached = photoCache[key];
      return cached
        ? { ...p, photo: cached.photo, verified: cached.verified, loading: false }
        : { ...p, verified: false, loading: true };
    })
  );

  useEffect(() => {
    let cancelled = false;
    const toFetch = places
      .map((p, idx) => ({ p, idx, key: `${p.name}|${p.location}` }))
      .filter(({ key }) => !photoCache[key]);

    if (toFetch.length === 0) return;

    // Fire all in parallel (capped to 10 by AI prompt)
    Promise.all(
      toFetch.map(async ({ p, idx, key }) => {
        try {
          const query = `${p.name}, ${p.location}`;
          const { data } = await supabase.functions.invoke("enrich-destination", {
            body: { destination: query, imageOnly: true },
          });
          const img = data?.images?.[0];
          const photo = img?.thumbUrl || img?.url;
          const result = { photo, verified: !!photo };
          photoCache[key] = result;
          return { idx, ...result };
        } catch {
          photoCache[key] = { verified: false };
          return { idx, verified: false, photo: undefined };
        }
      })
    ).then((results) => {
      if (cancelled) return;
      setEnriched((prev) => {
        const next = [...prev];
        for (const r of results) {
          next[r.idx] = { ...next[r.idx], photo: r.photo, verified: r.verified, loading: false };
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [places]);

  if (places.length === 0) return null;

  // Hide items where photo lookup finished but no real photo was found.
  const visible = enriched.filter((p) => p.loading || p.photo);

  if (!visible.some((p) => p.loading) && visible.length === 0) {
    return (
      <div className="mt-4 p-4 rounded-xl border border-border bg-muted/30 text-center">
        <p className="text-sm text-muted-foreground">
          Couldn't find verified photos for these — try a more specific query.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {visible.map((p, idx) => (
        <article
          key={`${p.name}-${idx}`}
          className="group rounded-xl overflow-hidden border border-border bg-card hover:shadow-md transition-shadow"
        >
          <div className="relative aspect-[16/10] bg-muted overflow-hidden">
            {p.loading ? (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted/60 to-muted" />
            ) : (
              <img
                src={p.photo}
                alt={p.name}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            )}
            {p.verified && !p.loading && (
              <div className="absolute top-2 left-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-medium backdrop-blur-sm">
                  <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                </span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <h3 className="text-white font-semibold text-sm leading-tight">{p.name}</h3>
              <p className="text-white/80 text-[11px] flex items-center gap-1 mt-0.5">
                <MapPin className="h-2.5 w-2.5" /> {p.location}
              </p>
            </div>
          </div>
          {p.why && (
            <div className="p-3">
              <p className="text-xs text-muted-foreground leading-relaxed">{p.why}</p>
            </div>
          )}
        </article>
      ))}
    </div>
  );
};

export default PlacesGallery;
