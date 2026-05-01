import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const CACHE_PREFIX = "city-images:v1:";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

type Cached = { images: string[]; ts: number };

function readCache(key: string): string[] | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed: Cached = JSON.parse(raw);
    if (!parsed?.images?.length) return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.images;
  } catch {
    return null;
  }
}

function writeCache(key: string, images: string[]) {
  try {
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ images, ts: Date.now() }),
    );
  } catch {
    /* ignore quota errors */
  }
}

/** Fetches Google Places hero photos for a destination (cached). */
export function useCityImage(destination: string | null | undefined) {
  const key = (destination || "").trim().toLowerCase();
  const [image, setImage] = useState<string | null>(() =>
    key ? readCache(key)?.[0] ?? null : null,
  );

  useEffect(() => {
    if (!key) return;
    const cached = readCache(key);
    if (cached?.length) {
      setImage(cached[0]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.functions.invoke("enrich-destination", {
          body: { destination, imageOnly: true },
        });
        const images: string[] = Array.isArray(data?.images) ? data.images : [];
        if (!cancelled && images.length) {
          writeCache(key, images);
          setImage(images[0]);
        }
      } catch {
        /* fail-soft: keep gradient fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key, destination]);

  return image;
}

/** Returns N photos for a destination (cached), padded with nulls. */
export function useCityImages(destination: string | null | undefined, count = 3) {
  const key = (destination || "").trim().toLowerCase();
  const [images, setImages] = useState<(string | null)[]>(() => {
    const cached = key ? readCache(key) : null;
    return Array.from({ length: count }, (_, i) => cached?.[i] ?? null);
  });

  useEffect(() => {
    if (!key) return;
    const cached = readCache(key);
    if (cached?.length) {
      setImages(Array.from({ length: count }, (_, i) => cached[i] ?? null));
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.functions.invoke("enrich-destination", {
          body: { destination, imageOnly: true },
        });
        const fetched: string[] = Array.isArray(data?.images) ? data.images : [];
        if (!cancelled && fetched.length) {
          writeCache(key, fetched);
          setImages(Array.from({ length: count }, (_, i) => fetched[i] ?? null));
        }
      } catch {
        /* fail-soft */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key, destination, count]);

  return images;
}