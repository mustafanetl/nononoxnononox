import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Trash2, Upload, ChevronUp, ChevronDown, Star, Film,
  ArrowLeft, RefreshCw, Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────

type MediaRow = {
  id: string;
  destination: string;
  type: string;
  name: string | null;
  url: string;
  thumb_url: string | null;
  source: string;
  media_type: string;
  sort_order: number;
  metadata: any;
  created_at: string;
};

type NavigationState =
  | { level: 1 }
  | { level: 2; city: string }
  | { level: 3; city: string; venue: string | null; type: "hero" | "activity" | "hotel" };

// ─── Main Component ───────────────────────────────────────────────────────

const AdminMediaPanel = () => {
  const [media, setMedia] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [nav, setNav] = useState<NavigationState>({ level: 1 });
  const [uploading, setUploading] = useState(false);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("destination_media" as any)
      .select("*")
      .order("destination", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(5000);

    if (error) {
      toast.error("Failed to load media");
      console.error(error);
    } else {
      setMedia((data as any) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  // ─── Actions ──────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("destination_media" as any).delete().eq("id", id);
    if (error) {
      toast.error("Delete failed");
    } else {
      setMedia((prev) => prev.filter((m) => m.id !== id));
      toast.success("Deleted");
    }
  };

  const handleReorder = async (id: string, direction: "up" | "down", siblings: MediaRow[]) => {
    const idx = siblings.findIndex((m) => m.id === id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;

    const current = siblings[idx];
    const swap = siblings[swapIdx];

    await Promise.all([
      supabase.from("destination_media" as any).update({ sort_order: swap.sort_order }).eq("id", current.id),
      supabase.from("destination_media" as any).update({ sort_order: current.sort_order }).eq("id", swap.id),
    ]);

    setMedia((prev) => {
      const next = [...prev];
      const ci = next.findIndex((m) => m.id === current.id);
      const si = next.findIndex((m) => m.id === swap.id);
      if (ci >= 0 && si >= 0) {
        const tempOrder = next[ci].sort_order;
        next[ci] = { ...next[ci], sort_order: next[si].sort_order };
        next[si] = { ...next[si], sort_order: tempOrder };
      }
      return next;
    });
    toast.success("Reordered");
  };

  const handleSetHero = async (row: MediaRow) => {
    const siblings = media
      .filter((m) => m.destination === row.destination && m.type === row.type && m.name === row.name)
      .sort((a, b) => a.sort_order - b.sort_order);

    await supabase.from("destination_media" as any).update({ sort_order: 0 }).eq("id", row.id);
    for (const sib of siblings) {
      if (sib.id !== row.id) {
        const newOrder = sib.sort_order >= 0 ? sib.sort_order + 1 : 1;
        await supabase.from("destination_media" as any).update({ sort_order: newOrder }).eq("id", sib.id);
      }
    }
    toast.success("Set as hero image");
    fetchMedia();
  };

  const handleUpload = async (
    file: File,
    destination: string,
    type: "hero" | "activity" | "hotel",
    name: string | null
  ) => {
    setUploading(true);
    try {
      const isVideo = file.type.startsWith("video/");
      const mediaType = isVideo ? "video" : "photo";
      const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
      const path = `${destination}/${type}/${name || "hero"}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("destination-media")
        .upload(path, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("destination-media")
        .getPublicUrl(path);

      const publicUrl = urlData.publicUrl;

      const existing = media.filter(
        (m) => m.destination === destination && m.type === type && m.name === name
      );
      const maxOrder = existing.length > 0 ? Math.max(...existing.map((m) => m.sort_order)) : -1;

      const { error: insertError } = await supabase.from("destination_media" as any).insert({
        destination,
        type,
        name,
        url: publicUrl,
        thumb_url: publicUrl,
        source: "admin",
        media_type: mediaType,
        sort_order: maxOrder + 1,
        metadata: { width: 1200, height: 800 },
      });

      if (insertError) throw insertError;

      toast.success(`Uploaded ${mediaType}`);
      fetchMedia();
    } catch (e: any) {
      toast.error(`Upload failed: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  // ─── Loading State ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // ─── Render by Level ──────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary">{new Set(media.map((m) => m.destination)).size} destinations</Badge>
        <Button variant="outline" size="sm" onClick={fetchMedia}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {nav.level === 1 && (
        <CitiesGrid media={media} onSelectCity={(city) => setNav({ level: 2, city })} />
      )}

      {nav.level === 2 && (
        <VenuesGrid
          media={media}
          city={nav.city}
          onBack={() => setNav({ level: 1 })}
          onSelectVenue={(venue, type) => setNav({ level: 3, city: nav.city, venue, type })}
        />
      )}

      {nav.level === 3 && (
        <PhotosGrid
          media={media}
          city={nav.city}
          venue={nav.venue}
          type={nav.type}
          onBack={() => setNav({ level: 2, city: nav.city })}
          onDelete={handleDelete}
          onReorder={handleReorder}
          onSetHero={handleSetHero}
          onUpload={handleUpload}
          uploading={uploading}
        />
      )}
    </div>
  );
};

// ─── Level 1: Cities Grid ─────────────────────────────────────────────────

const CitiesGrid = ({
  media,
  onSelectCity,
}: {
  media: MediaRow[];
  onSelectCity: (city: string) => void;
}) => {
  const cities = [...new Set(media.map((m) => m.destination))].sort();

  if (cities.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No destinations with cached media found.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {cities.map((city) => {
        const heroRow = media.find((m) => m.destination === city && m.type === "hero");
        const heroUrl = heroRow?.thumb_url || heroRow?.url;

        return (
          <button
            key={city}
            type="button"
            onClick={() => onSelectCity(city)}
            className="relative aspect-square rounded-xl overflow-hidden border border-border group focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {heroUrl ? (
              <img
                src={heroUrl}
                alt={city}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900" />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
              <span className="text-white font-semibold text-sm capitalize">{city}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

// ─── Level 2: Venues Grid ─────────────────────────────────────────────────

const VenuesGrid = ({
  media,
  city,
  onBack,
  onSelectVenue,
}: {
  media: MediaRow[];
  city: string;
  onBack: () => void;
  onSelectVenue: (venue: string | null, type: "hero" | "activity" | "hotel") => void;
}) => {
  const cityMedia = media.filter((m) => m.destination === city);
  const heroes = cityMedia.filter((m) => m.type === "hero");

  // Collect unique venues (activities + hotels) — exclude rejected (sort_order < 0 or verified=false)
  const venueMap = new Map<string, { type: "activity" | "hotel"; items: MediaRow[] }>();
  for (const row of cityMedia) {
    if (row.type === "activity" || row.type === "hotel") {
      // Skip rejected venues (rows with sort_order = -1 or metadata.verified = false)
      if (row.sort_order < 0) continue;
      if (row.metadata?.verified === false) continue;
      // Skip rows with no actual URL (verification-only rows)
      if (!row.url) continue;

      const venueName = row.name || "Unknown";
      const key = `${row.type}::${venueName}`;
      if (!venueMap.has(key)) {
        venueMap.set(key, { type: row.type, items: [] });
      }
      venueMap.get(key)!.items.push(row);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h2 className="text-lg font-semibold capitalize">{city}</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Hero Images card */}
        <button
          type="button"
          onClick={() => onSelectVenue(null, "hero")}
          className="relative aspect-square rounded-xl overflow-hidden border border-border group focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {heroes.length > 0 && (heroes[0].thumb_url || heroes[0].url) ? (
            <img
              src={heroes[0].thumb_url || heroes[0].url}
              alt="Hero Images"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-600 to-amber-900 flex items-center justify-center">
              <Star className="h-8 w-8 text-white/60" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
            <span className="text-white font-semibold text-sm">Hero Images</span>
            <span className="text-white/70 text-xs ml-1">({heroes.length})</span>
          </div>
        </button>

        {/* Venue cards */}
        {[...venueMap.entries()].map(([key, { type, items }]) => {
          const venueName = key.split("::")[1];
          const firstItem = items.sort((a, b) => a.sort_order - b.sort_order)[0];
          const thumbUrl = firstItem?.thumb_url || firstItem?.url;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectVenue(venueName, type)}
              className="relative aspect-square rounded-xl overflow-hidden border border-border group focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {thumbUrl ? (
                <img
                  src={thumbUrl}
                  alt={venueName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-white/60" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
                <span className="text-white font-semibold text-sm truncate block">{venueName}</span>
                <span className="text-white/70 text-xs capitalize">{type} · {items.length} photos</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Level 3: Photos Grid ─────────────────────────────────────────────────

const PhotosGrid = ({
  media,
  city,
  venue,
  type,
  onBack,
  onDelete,
  onReorder,
  onSetHero,
  onUpload,
  uploading,
}: {
  media: MediaRow[];
  city: string;
  venue: string | null;
  type: "hero" | "activity" | "hotel";
  onBack: () => void;
  onDelete: (id: string) => void;
  onReorder: (id: string, dir: "up" | "down", siblings: MediaRow[]) => void;
  onSetHero: (row: MediaRow) => void;
  onUpload: (file: File, dest: string, type: "hero" | "activity" | "hotel", name: string | null) => void;
  uploading: boolean;
}) => {
  const items = media
    .filter((m) => m.destination === city && m.type === type && m.name === venue)
    .sort((a, b) => a.sort_order - b.sort_order);

  const heading = venue || "Hero Images";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file, city, type, venue);
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <h2 className="text-lg font-semibold">{heading}</h2>
            <p className="text-xs text-muted-foreground capitalize">{city} · {type}</p>
          </div>
        </div>
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <Button variant="outline" size="sm" asChild disabled={uploading}>
            <span>
              {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
              Upload
            </span>
          </Button>
        </label>
      </div>

      {items.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 italic">No media yet. Upload to get started.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {items.map((item, idx) => (
            <MediaThumbnail
              key={item.id}
              item={item}
              index={idx}
              total={items.length}
              siblings={items}
              onDelete={() => onDelete(item.id)}
              onMoveUp={() => onReorder(item.id, "up", items)}
              onMoveDown={() => onReorder(item.id, "down", items)}
              onSetHero={() => onSetHero(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Single Thumbnail ─────────────────────────────────────────────────────

const MediaThumbnail = ({
  item,
  index,
  total,
  siblings,
  onDelete,
  onMoveUp,
  onMoveDown,
  onSetHero,
}: {
  item: MediaRow;
  index: number;
  total: number;
  siblings: MediaRow[];
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSetHero: () => void;
}) => {
  const isVideo = item.media_type === "video";
  const isAdmin = item.source === "admin";
  const isHeroPosition = item.sort_order === 0;

  return (
    <div className="group relative rounded-lg overflow-hidden border border-border bg-muted/30 aspect-square">
      {isVideo ? (
        <video
          src={item.url}
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="metadata"
        />
      ) : (
        <img
          src={item.thumb_url || item.url}
          alt={item.name || item.destination}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}

      {/* Badges */}
      <div className="absolute top-1 left-1 flex gap-1 flex-wrap">
        {isAdmin && (
          <Badge className="text-[9px] px-1 py-0 bg-blue-600 text-white">Admin</Badge>
        )}
        {isVideo && (
          <Badge className="text-[9px] px-1 py-0 bg-purple-600 text-white">
            <Film className="h-2.5 w-2.5 mr-0.5" />Video
          </Badge>
        )}
        {isHeroPosition && (
          <Badge className="text-[9px] px-1 py-0 bg-amber-500 text-white">
            <Star className="h-2.5 w-2.5 mr-0.5" />Hero
          </Badge>
        )}
      </div>

      {/* Actions overlay on hover */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-white hover:bg-white/20"
          onClick={onMoveUp}
          disabled={index === 0}
          title="Move up"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-white hover:bg-white/20"
          onClick={onMoveDown}
          disabled={index === total - 1}
          title="Move down"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
        {!isHeroPosition && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-amber-400 hover:bg-white/20"
            onClick={onSetHero}
            title="Set as hero (sort_order 0)"
          >
            <Star className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-red-400 hover:bg-white/20"
          onClick={onDelete}
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default AdminMediaPanel;
