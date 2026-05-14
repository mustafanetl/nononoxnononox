import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Short client-side TTL — the server-side cache is the source of truth.
const CACHE_PREFIX = "jolliday-city-images-";
const CACHE_TTL_MS = 1000 * 60 * 60 * 2; // 2 hours (short — server cache is permanent)

type Cached = { images: string[]; videoUrl?: string | null; ts: number };

/** The edge function returns image objects: { url, thumbUrl, ... }. Normalize to URL strings. */
function extractUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const r = item as { url?: string; thumbUrl?: string };
        return r.thumbUrl || r.url || "";
      }
      return "";
    })
    .filter((u): u is string => typeof u === "string" && u.length > 0);
}

function readCache(key: string): Cached | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed: Cached = JSON.parse(raw);
    if (!parsed?.images?.length) return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(key: string, images: string[], videoUrl?: string | null) {
  try {
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ images, videoUrl: videoUrl || null, ts: Date.now() }),
    );
  } catch {
    /* ignore quota errors */
  }
}

function normalizeDestination(dest: string): string {
  return dest.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ");
}

/** Query the server-side destination_media table directly. */
async function fetchFromServerCache(destination: string): Promise<{ images: string[]; videoUrl: string | null } | null> {
  try {
    const norm = normalizeDestination(destination);
    const { data, error } = await supabase
      .from("destination_media" as any)
      .select("url, thumb_url, media_type, source, sort_order")
      .eq("destination", norm)
      .eq("type", "hero")
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) return null;

    // Admin images take priority
    const adminRows = (data as any[]).filter((r) => r.source === "admin");
    const effectiveRows = adminRows.length > 0 ? adminRows : (data as any[]);

    const images = effectiveRows
      .filter((r) => (r.media_type || "photo") === "photo")
      .map((r) => r.thumb_url || r.url)
      .filter(Boolean);

    const videoRow = effectiveRows.find((r) => r.media_type === "video");
    const videoUrl = videoRow?.url || null;

    if (images.length === 0 && !videoUrl) return null;
    return { images, videoUrl };
  } catch {
    return null;
  }
}

/** Fetches Google Places hero photos for a destination.
 *  Priority: server-side cache → edge function → null */
export function useCityImage(destination: string | null | undefined) {
  const key = (destination || "").trim().toLowerCase();
  const [image, setImage] = useState<string | null>(() => {
    const cached = key ? readCache(key) : null;
    return cached?.images?.[0] ?? null;
  });

  useEffect(() => {
    if (!key) return;
    const cached = readCache(key);
    if (cached?.images?.length) {
      setImage(cached.images[0]);
      return;
    }
    let cancelled = false;
    (async () => {
      // 1. Try server-side cache (destination_media table)
      const serverCache = await fetchFromServerCache(destination!);
      if (!cancelled && serverCache && serverCache.images.length > 0) {
        writeCache(key, serverCache.images, serverCache.videoUrl);
        setImage(serverCache.images[0]);
        return;
      }

      // 2. Fall back to edge function (which will also populate server cache)
      try {
        const { data } = await supabase.functions.invoke("enrich-destination", {
          body: { destination, imageOnly: true },
        });
        const images = extractUrls(data?.images);
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

/** Returns N photos for a destination (cached), padded with nulls.
 *  Also returns a videoUrl if one exists in the server cache. */
export function useCityImages(destination: string | null | undefined, count = 3) {
  const key = (destination || "").trim().toLowerCase();
  const [images, setImages] = useState<(string | null)[]>(() => {
    const cached = key ? readCache(key) : null;
    return Array.from({ length: count }, (_, i) => cached?.images?.[i] ?? null);
  });
  const [videoUrl, setVideoUrl] = useState<string | null>(() => {
    const cached = key ? readCache(key) : null;
    return cached?.videoUrl ?? null;
  });

  useEffect(() => {
    if (!key) return;
    const cached = readCache(key);
    if (cached?.images?.length) {
      setImages(Array.from({ length: count }, (_, i) => cached.images[i] ?? null));
      setVideoUrl(cached.videoUrl ?? null);
      return;
    }
    let cancelled = false;
    (async () => {
      // 1. Try server-side cache
      const serverCache = await fetchFromServerCache(destination!);
      if (!cancelled && serverCache && serverCache.images.length > 0) {
        writeCache(key, serverCache.images, serverCache.videoUrl);
        setImages(Array.from({ length: count }, (_, i) => serverCache.images[i] ?? null));
        setVideoUrl(serverCache.videoUrl);
        return;
      }

      // 2. Fall back to edge function
      try {
        const { data } = await supabase.functions.invoke("enrich-destination", {
          body: { destination, imageOnly: true },
        });
        const fetched = extractUrls(data?.images);
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

  return { images, videoUrl };
}

/** Hook to get the hero video URL for a destination (if one exists). */
export function useDestinationVideo(destination: string | null | undefined): string | null {
  const key = (destination || "").trim().toLowerCase();
  const [videoUrl, setVideoUrl] = useState<string | null>(() => {
    const cached = key ? readCache(key) : null;
    return cached?.videoUrl ?? null;
  });

  useEffect(() => {
    if (!key) return;
    const cached = readCache(key);
    if (cached?.videoUrl) {
      setVideoUrl(cached.videoUrl);
      return;
    }
    let cancelled = false;
    (async () => {
      const serverCache = await fetchFromServerCache(destination!);
      if (!cancelled && serverCache?.videoUrl) {
        setVideoUrl(serverCache.videoUrl);
      }
    })();
    return () => { cancelled = true; };
  }, [key, destination]);

  return videoUrl;
}