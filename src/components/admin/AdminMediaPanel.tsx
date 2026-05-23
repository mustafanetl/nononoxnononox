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

type MediaSource = "google" | "getyourguide";

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

    // Two parallel queries: one for Google/venue cities, one for GYG cities
    const [googleRes, venueRes, gygRes] = await Promise.all([
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
      // GYG: get all gyg_activity rows for city list + counts
      supabase
        .from("destination_media" as any)
        .select("destination, url, thumb_url, source, type")
        .eq("type", "gyg_activity")
        .order("sort_order", { ascending: true })
        .limit(5000),
    ]);

    const combined = [
      ...((googleRes.data as any[]) || []),
      ...((venueRes.data as any[]) || []),
      ...((gygRes.data as any[]) || []),
    ];

    if (googleRes.error) console.warn("Google fetch error:", googleRes.error);
    if (venueRes.error) console.warn("Venue fetch error:", venueRes.error);
    if (gygRes.error) console.warn("GYG fetch error:", gygRes.error);

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
      if ((row as any).type === "gyg_activity" || row.source === "getyourguide") continue;
      const d = row.destination;
      if (!map[d]) map[d] = row.thumb_url || row.url || null;
      if (row.source === "admin") map[d] = row.thumb_url || row.url || map[d];
    }
    return Object.entries(map).map(([dest, img]) => ({ destination: dest, img })).sort((a, b) => a.destination.localeCompare(b.destination));
  })();

  const gygCities = (() => {
    const map: Record<string, { img: string | null; count: number }> = {};
    for (const row of allMedia) {
      // Only GYG rows
      if ((row as any).type !== "gyg_activity" && row.source !== "getyourguide") continue;
      const d = row.destination;
      if (!map[d]) map[d] = { img: null, count: 0 };
      map[d].count++;
      if (!map[d].img) map[d].img = row.thumb_url || row.url || null;
    }
    return Object.entries(map).map(([dest, v]) => ({ destination: dest, img: v.img, count: v.count })).sort((a, b) => a.destination.localeCompare(b.destination));
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
              <button
                type="button"
                onClick={() => setNav({ level: 1, source: "getyourguide" })}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  nav.source === "getyourguide" ? "bg-green-600 text-white shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Ticket className="h-4 w-4" /> GetYourGuide ({gygCities.length})
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={fetchCities}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </div>

          {nav.source === "google" ? (
            <CitiesGrid cities={googleCities} source="google" onSelectCity={navigateToCity} />
          ) : (
            <CitiesGrid cities={gygCities} source="getyourguide" onSelectCity={navigateToCity} />
          )}
        </>
      )}

      {nav.level === 2 && (
        cityLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : nav.source === "google" ? (
          <GoogleCityView
            media={cityMedia}
            city={nav.city}
            onBack={() => setNav({ level: 1, source: "google" })}
            onSelectVenue={(venue, type) => setNav({ level: 3, city: nav.city, venue, type, source: "google" })}
          />
        ) : (
          <GygCityView
            media={cityMedia}
            city={nav.city}
            onBack={() => setNav({ level: 1, source: "getyourguide" })}
            onSelectActivity={(name) => setNav({ level: 3, city: nav.city, venue: name, type: "gyg_activity", source: "getyourguide" })}
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
        {source === "google" ? "No Google Places media cached yet." : "No GetYourGuide activities scraped yet."}
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
  const cityMedia = media.filter((m) => m.destination === city && m.type !== "gyg_activity" && m.source !== "getyourguide");
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


// ─── Level 2: GetYourGuide City View ──────────────────────────────────────

const GygCityView = ({
  media,
  city,
  onBack,
  onSelectActivity,
}: {
  media: MediaRow[];
  city: string;
  onBack: () => void;
  onSelectActivity: (name: string) => void;
}) => {
  const gygItems = media
    .filter((m) => m.destination === city && (m.type === "gyg_activity" || m.source === "getyourguide"))
    .sort((a, b) => {
      // Sort by priority (P1 first), then by rating
      const pa = a.metadata?.priority || 5;
      const pb = b.metadata?.priority || 5;
      if (pa !== pb) return pa - pb;
      const ra = Number(a.metadata?.rating) || 0;
      const rb = Number(b.metadata?.rating) || 0;
      return rb - ra;
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        <h2 className="text-lg font-semibold capitalize">{city}</h2>
        <Badge variant="secondary" className="bg-green-100 text-green-800">GetYourGuide · {gygItems.length} activities</Badge>
      </div>

      {gygItems.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 italic">
          No activities scraped yet.<br />
          <code className="text-xs bg-muted px-2 py-1 rounded mt-2 inline-block">python scripts/scrape_getyourguide.py --city {city}</code>
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {gygItems.map((item) => {
            const meta = item.metadata || {};
            const photos: string[] = meta.photos || [];
            const photoCount = photos.length || (item.url ? 1 : 0);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => item.name && onSelectActivity(item.name)}
                className="relative rounded-xl overflow-hidden border border-border group focus:outline-none focus:ring-2 focus:ring-ring text-left"
              >
                {/* Image */}
                <div className="aspect-video relative">
                  {item.thumb_url || item.url ? (
                    <img src={item.thumb_url || item.url} alt={item.name || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center">
                      <Ticket className="h-8 w-8 text-white/40" />
                    </div>
                  )}
                  {/* Priority badge */}
                  {meta.priority && meta.priority <= 2 && (
                    <Badge className="absolute top-2 left-2 text-[9px] px-1.5 py-0 bg-amber-500 text-white">
                      {meta.priority === 1 ? "⭐ Must-see" : "👍 Top rated"}
                    </Badge>
                  )}
                  {/* Photo count */}
                  {photoCount > 1 && (
                    <Badge className="absolute top-2 right-2 text-[9px] px-1.5 py-0 bg-black/60 text-white">
                      <ImageIcon className="h-2.5 w-2.5 mr-0.5" />{photoCount}
                    </Badge>
                  )}
                </div>
                {/* Info */}
                <div className="p-3 space-y-1">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {meta.price && (
                      <span className="text-green-600 font-medium">
                        {meta.currency === "GBP" ? "£" : meta.currency === "USD" ? "$" : "€"}{Number(meta.price).toFixed(0)}
                      </span>
                    )}
                    {meta.rating && <span className="text-amber-600">★ {Number(meta.rating).toFixed(1)}</span>}
                    {meta.duration && <span>{meta.duration}</span>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {meta.category && <Badge variant="outline" className="text-[9px] px-1.5 py-0">{meta.category}</Badge>}
                    {meta.free_cancellation && <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-green-300 text-green-700">Free cancel</Badge>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
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
  // For GYG activities, photos are stored in metadata.photos array (single row)
  // For Google Places, photos are separate rows
  const isGyg = source === "getyourguide" || type === "gyg_activity";

  const gygRow = isGyg
    ? media.find((m) => m.destination === city && m.name === venue && (m.type === "gyg_activity" || m.source === "getyourguide"))
    : null;

  const googleItems = !isGyg
    ? media.filter((m) => m.destination === city && m.type === type && m.name === venue).sort((a, b) => a.sort_order - b.sort_order)
    : [];

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
            <p className="text-xs text-muted-foreground capitalize">{city} · {isGyg ? "GetYourGuide" : type}</p>
          </div>
        </div>
        {!isGyg && (
          <label className="cursor-pointer">
            <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
            <Button variant="outline" size="sm" asChild disabled={uploading}>
              <span>{uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}Upload</span>
            </Button>
          </label>
        )}
      </div>

      {isGyg && gygRow ? (
        <GygActivityDetail row={gygRow} onDelete={() => onDelete(gygRow.id)} />
      ) : googleItems.length === 0 ? (
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

// ─── GYG Activity Detail (shows all photos + metadata) ────────────────────

const GygActivityDetail = ({ row, onDelete }: { row: MediaRow; onDelete: () => void }) => {
  const meta = row.metadata || {};
  const photos: string[] = meta.photos || [];
  // Include main url if not in photos array
  const allPhotos = photos.length > 0 ? photos : (row.url ? [row.url] : []);

  return (
    <div className="space-y-4">
      {/* Photos grid */}
      {allPhotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {allPhotos.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border">
              <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
              {i === 0 && <Badge className="absolute top-1 left-1 text-[9px] px-1 py-0 bg-amber-500 text-white">Main</Badge>}
            </div>
          ))}
        </div>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        {meta.price && <InfoCard label="Price" value={`${meta.currency === "GBP" ? "£" : "€"}${meta.price}`} />}
        {meta.rating && <InfoCard label="Rating" value={`★ ${Number(meta.rating).toFixed(1)} (${meta.review_count || "?"} reviews)`} />}
        {meta.duration && <InfoCard label="Duration" value={meta.duration} />}
        {meta.category && <InfoCard label="Category" value={meta.category} />}
        {meta.neighborhood && <InfoCard label="Location" value={meta.neighborhood} />}
        {meta.meeting_point && <InfoCard label="Meeting Point" value={meta.meeting_point} />}
        {meta.priority && <InfoCard label="Priority" value={`P${meta.priority}`} />}
        {meta.tour_type && <InfoCard label="Tour Type" value={meta.tour_type} />}
        {meta.languages && <InfoCard label="Languages" value={meta.languages} />}
        <InfoCard label="Free Cancellation" value={meta.free_cancellation ? "✓ Yes" : "✗ No"} />
        <InfoCard label="Book Ahead" value={meta.bookAhead ? "✓ Yes" : "Not required"} />
      </div>

      {/* Description */}
      {meta.description && (
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1 font-medium">Description</p>
          <p className="text-sm">{meta.description}</p>
        </div>
      )}

      {/* Highlights */}
      {meta.highlights?.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1 font-medium">Highlights</p>
          <ul className="text-sm space-y-0.5">{meta.highlights.map((h: string, i: number) => <li key={i}>• {h}</li>)}</ul>
        </div>
      )}

      {/* Links */}
      <div className="flex gap-2 flex-wrap">
        {meta.activity_url && (
          <a href={meta.activity_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">View on GYG →</a>
        )}
        {meta.affiliate_url && (
          <a href={meta.affiliate_url} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline">Affiliate link →</a>
        )}
      </div>

      {/* Delete */}
      <Button variant="destructive" size="sm" onClick={onDelete}>
        <Trash2 className="h-3 w-3 mr-1" /> Delete Activity
      </Button>
    </div>
  );
};

const InfoCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-muted/30 rounded-lg p-2.5 border border-border/50">
    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
    <p className="text-sm font-medium mt-0.5 truncate">{value}</p>
  </div>
);


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
