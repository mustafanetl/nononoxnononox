import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Trash2, Upload, ChevronUp, ChevronDown, Star, Film,
  ArrowLeft, RefreshCw, Image as ImageIcon, MapPin, Ticket,
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

type MediaSource = "google";

type NavigationState =
  | { level: 1; source: MediaSource }
  | { level: 2; city: string; source: MediaSource }
  | { level: 3; city: string; venue: string | null; type: string; source: MediaSource };

// ─── Main Component ───────────────────────────────────────────────────────

const AdminMediaPanel = () => {
  const [allMedia, setAllMedia] = useState<MediaRow[]>([]);
  const [cityMedia, setCityMedia] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityLoading, setCityLoading] = useState(false);
  const [nav, setNav] = useState<NavigationState>({ level: 1, source: "google" });
  const [uploading, setUploading] = useState(false);

  // Fetch all destinations (just distinct cities + thumbnail per source)
  const fetchCities = useCallback(async () => {
    setLoading(true);

    const [googleRes, venueRes] = await Promise.all([
      // Google Places: get hero rows for city thumbnails
      supabase
        .from("destination_media" as any)
        .select("destination, url, thumb_url, source")
        .eq("type", "hero")
        .order("sort_order", { ascending: true })
        .limit(5000),
      // Venue pool (Google Maps scraped): get venue rows
      supabase
        .from("destination_media" as any)
        .select("destination, url, thumb_url, source, type")
        .eq("type", "venue")
        .order("sort_order", { ascending: true })
        .limit(5000),
    ]);

    const combined = [
      ...((googleRes.data as any[]) || []),
      ...((venueRes.data as any[]) || []),
    ];

    if (googleRes.error) console.warn("Google fetch error:", googleRes.error);
    if (venueRes.error) console.warn("Venue fetch error:", venueRes.error);

    setAllMedia(combined);
    setLoading(false);
  }, []);

  // Fetch all media for a specific city
  const fetchCityMedia = useCallback(async (city: string) => {
    setCityLoading(true);
    const { data, error } = await supabase
      .from("destination_media" as any)
      .select("*")
      .eq("destination", city)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to load city media");
    } else {
      setCityMedia((data as any) ?? []);
    }
    setCityLoading(false);
  }, []);

  useEffect(() => { fetchCities(); }, [fetchCities]);

  const navigateToCity = useCallback((city: string, source: MediaSource) => {
    setNav({ level: 2, city, source });
    fetchCityMedia(city);
  }, [fetchCityMedia]);

  // ─── Actions ──────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("destination_media" as any).delete().eq("id", id);
    if (error) {
      toast.error("Delete failed");
    } else {
      setCityMedia((prev) => prev.filter((m) => m.id !== id));
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
    setCityMedia((prev) => {
      const next = [...prev];
      const ci = next.findIndex((m) => m.id === current.id);
      const si = next.findIndex((m) => m.id === swap.id);
      if (ci >= 0 && si >= 0) {
        const t = next[ci].sort_order;
        next[ci] = { ...next[ci], sort_order: next[si].sort_order };
        next[si] = { ...next[si], sort_order: t };
      }
      return next;
    });
    toast.success("Reordered");
  };

  const handleSetHero = async (row: MediaRow) => {
    await supabase.from("destination_media" as any).update({ sort_order: 0 }).eq("id", row.id);
    toast.success("Set as primary");
    if (nav.level >= 2) fetchCityMedia((nav as any).city);
  };

  const handleUpload = async (file: File, destination: string, type: string, name: string | null) => {
    setUploading(true);
    try {
      const isVideo = file.type.startsWith("video/");
      const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
      const path = `${destination}/${type}/${name || "hero"}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("destination-media").upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("destination-media").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;
      const existing = cityMedia.filter((m) => m.destination === destination && m.type === type && m.name === name);
      const maxOrder = existing.length > 0 ? Math.max(...existing.map((m) => m.sort_order)) : -1;
      const { error: insertError } = await supabase.from("destination_media" as any).insert({
        destination, type, name, url: publicUrl, thumb_url: publicUrl,
        source: "admin", media_type: isVideo ? "video" : "photo", sort_order: maxOrder + 1, metadata: {},
      });
      if (insertError) throw insertError;
      toast.success("Uploaded");
      fetchCityMedia(destination);
    } catch (e: any) {
      toast.error(`Upload failed: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  // ─── Compute cities per source ────────────────────────────────────────

  const googleCities = (() => {
    const map: Record<string, string | null> = {};
    for (const row of allMedia) {
      const d = row.destination;
      if (!map[d]) map[d] = row.thumb_url || row.url || null;
      if (row.source === "admin") map[d] = row.thumb_url || row.url || map[d];
    }
    return Object.entries(map).map(([dest, img]) => ({ destination: dest, img })).sort((a, b) => a.destination.localeCompare(b.destination));
  })();

  // ─── Loading ──────────────────────────────────────────────────────────

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Top-level source tabs (always visible at level 1) */}
      {nav.level === 1 && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNav({ level: 1, source: "google" })}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  nav.source === "google" ? "bg-blue-600 text-white shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <MapPin className="h-4 w-4" /> Google Places ({googleCities.length})
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={fetchCities}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </div>

          <CitiesGrid cities={googleCities} source="google" onSelectCity={navigateToCity} />
        </>
      )}

      {nav.level === 2 && (
        cityLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <GoogleCityView
            media={cityMedia}
            city={nav.city}
            onBack={() => setNav({ level: 1, source: "google" })}
            onSelectVenue={(venue, type) => setNav({ level: 3, city: nav.city, venue, type, source: "google" })}
          />
        )
      )}

      {nav.level === 3 && (
        <PhotosView
          media={cityMedia}
          city={nav.city}
          venue={nav.venue}
          type={nav.type}
          source={nav.source}
          onBack={() => setNav({ level: 2, city: nav.city, source: nav.source })}
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


// ─── Level 1: Cities Grid (shared for both sources) ───────────────────────

const CitiesGrid = ({
  cities,
  source,
  onSelectCity,
}: {
  cities: { destination: string; img: string | null; count?: number }[];
  source: MediaSource;
  onSelectCity: (city: string, source: MediaSource) => void;
}) => {
  if (cities.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        {source === "google" ? "No Google Places media cached yet." : "No media cached yet."}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {cities.map((city) => (
        <button
          key={city.destination}
          type="button"
          onClick={() => onSelectCity(city.destination, source)}
          className="relative aspect-square rounded-xl overflow-hidden border border-border group focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {city.img ? (
            <img src={city.img} alt={city.destination} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${source === "google" ? "bg-gradient-to-br from-blue-800 to-blue-950" : "bg-gradient-to-br from-green-800 to-green-950"}`}>
              {source === "google" ? <MapPin className="h-8 w-8 text-white/40" /> : <Ticket className="h-8 w-8 text-white/40" />}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
            <span className="text-white font-semibold text-sm capitalize">{city.destination}</span>
            {city.count !== undefined && <span className="text-white/60 text-xs ml-1">({city.count})</span>}
          </div>
        </button>
      ))}
    </div>
  );
};

// ─── Level 2: Google Places City View ─────────────────────────────────────

const GoogleCityView = ({
  media,
  city,
  onBack,
  onSelectVenue,
}: {
  media: MediaRow[];
  city: string;
  onBack: () => void;
  onSelectVenue: (venue: string | null, type: string) => void;
}) => {
  const cityMedia = media.filter((m) => m.destination === city);
  const heroes = cityMedia.filter((m) => m.type === "hero");

  const venueMap = new Map<string, { type: string; items: MediaRow[] }>();
  for (const row of cityMedia) {
    if (row.type === "activity" || row.type === "hotel" || row.type === "venue") {
      if (row.sort_order < 0 || row.metadata?.verified === false || !row.url) continue;
      const name = row.name || "Unknown";
      const key = `${row.type}::${name}`;
      if (!venueMap.has(key)) venueMap.set(key, { type: row.type, items: [] });
      venueMap.get(key)!.items.push(row);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        <h2 className="text-lg font-semibold capitalize">{city}</h2>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">Google Places</Badge>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <button type="button" onClick={() => onSelectVenue(null, "hero")} className="relative aspect-square rounded-xl overflow-hidden border border-border group focus:outline-none focus:ring-2 focus:ring-ring">
          {heroes[0]?.thumb_url || heroes[0]?.url ? (
            <img src={heroes[0].thumb_url || heroes[0].url} alt="Hero" className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-600 to-amber-900 flex items-center justify-center"><Star className="h-8 w-8 text-white/60" /></div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <span className="text-white font-semibold text-sm">Hero Images ({heroes.length})</span>
          </div>
        </button>
        {[...venueMap.entries()].map(([key, { type, items }]) => {
          const name = key.split("::")[1];
          const thumb = items.sort((a, b) => a.sort_order - b.sort_order)[0];
          return (
            <button key={key} type="button" onClick={() => onSelectVenue(name, type)} className="relative aspect-square rounded-xl overflow-hidden border border-border group focus:outline-none focus:ring-2 focus:ring-ring">
              {thumb?.thumb_url || thumb?.url ? (
                <img src={thumb.thumb_url || thumb.url} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center"><ImageIcon className="h-8 w-8 text-white/60" /></div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <span className="text-white font-semibold text-xs truncate block">{name}</span>
                <span className="text-white/60 text-[10px] capitalize">{type} · {items.length}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};


// ─── Level 3: Photos/Detail View ──────────────────────────────────────────

const PhotosView = ({
  media,
  city,
  venue,
  type,
  source,
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
  type: string;
  source: MediaSource;
  onBack: () => void;
  onDelete: (id: string) => void;
  onReorder: (id: string, dir: "up" | "down", siblings: MediaRow[]) => void;
  onSetHero: (row: MediaRow) => void;
  onUpload: (file: File, dest: string, type: string, name: string | null) => void;
  uploading: boolean;
}) => {
  const googleItems = media.filter((m) => m.destination === city && m.type === type && m.name === venue).sort((a, b) => a.sort_order - b.sort_order);

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
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
          <div>
            <h2 className="text-lg font-semibold">{heading}</h2>
            <p className="text-xs text-muted-foreground capitalize">{city} · {type}</p>
          </div>
        </div>
        <label className="cursor-pointer">
          <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
          <Button variant="outline" size="sm" asChild disabled={uploading}>
            <span>{uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}Upload</span>
          </Button>
        </label>
      </div>

      {googleItems.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 italic">No media yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {googleItems.map((item, idx) => (
            <MediaThumbnail
              key={item.id}
              item={item}
              index={idx}
              total={googleItems.length}
              onDelete={() => onDelete(item.id)}
              onMoveUp={() => onReorder(item.id, "up", googleItems)}
              onMoveDown={() => onReorder(item.id, "down", googleItems)}
              onSetHero={() => onSetHero(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
};


// ─── Single Thumbnail (Google Places photos) ──────────────────────────────

const MediaThumbnail = ({
  item,
  index,
  total,
  onDelete,
  onMoveUp,
  onMoveDown,
  onSetHero,
}: {
  item: MediaRow;
  index: number;
  total: number;
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
        <video src={item.url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
      ) : (
        <img src={item.thumb_url || item.url} alt={item.name || item.destination} className="w-full h-full object-cover" loading="lazy" />
      )}
      <div className="absolute top-1 left-1 flex gap-1 flex-wrap">
        {isAdmin && <Badge className="text-[9px] px-1 py-0 bg-blue-600 text-white">Admin</Badge>}
        {isVideo && <Badge className="text-[9px] px-1 py-0 bg-purple-600 text-white"><Film className="h-2.5 w-2.5 mr-0.5" />Video</Badge>}
        {isHeroPosition && <Badge className="text-[9px] px-1 py-0 bg-amber-500 text-white"><Star className="h-2.5 w-2.5 mr-0.5" />Hero</Badge>}
      </div>
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20" onClick={onMoveUp} disabled={index === 0}><ChevronUp className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20" onClick={onMoveDown} disabled={index === total - 1}><ChevronDown className="h-3.5 w-3.5" /></Button>
        {!isHeroPosition && <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-400 hover:bg-white/20" onClick={onSetHero}><Star className="h-3.5 w-3.5" /></Button>}
        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:bg-white/20" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
};

export default AdminMediaPanel;
