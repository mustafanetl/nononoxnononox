import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Trash2, Upload, ChevronUp, ChevronDown, Star, Film, Image as ImageIcon,
  Search, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

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

type DestinationGroup = {
  destination: string;
  heroes: MediaRow[];
  activities: Record<string, MediaRow[]>;
  hotels: Record<string, MediaRow[]>;
};

const AdminMediaPanel = () => {
  const [media, setMedia] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("destination_media" as any)
      .select("*")
      .order("destination", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to load media");
      console.error(error);
    } else {
      setMedia((data as any) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  // Group media by destination
  const grouped: DestinationGroup[] = (() => {
    const map: Record<string, DestinationGroup> = {};
    for (const row of media) {
      if (!map[row.destination]) {
        map[row.destination] = { destination: row.destination, heroes: [], activities: {}, hotels: {} };
      }
      const g = map[row.destination];
      if (row.type === "hero") {
        g.heroes.push(row);
      } else if (row.type === "activity") {
        const name = row.name || "Unknown";
        if (!g.activities[name]) g.activities[name] = [];
        g.activities[name].push(row);
      } else if (row.type === "hotel") {
        const name = row.name || "Unknown";
        if (!g.hotels[name]) g.hotels[name] = [];
        g.hotels[name].push(row);
      }
    }
    return Object.values(map);
  })();

  const filtered = search.trim()
    ? grouped.filter((g) => g.destination.includes(search.trim().toLowerCase()))
    : grouped;

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

    // Swap sort_order values
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
    // Set this image as sort_order 0 (hero), push others down
    const siblings = media.filter(
      (m) => m.destination === row.destination && m.type === row.type && m.name === row.name
    ).sort((a, b) => a.sort_order - b.sort_order);

    const updates = siblings.map((m, i) => ({
      id: m.id,
      sort_order: m.id === row.id ? 0 : (m.sort_order <= row.sort_order ? i + 1 : i),
    }));

    // Simple approach: set target to 0, increment others
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
    const uploadKey = `${destination}-${type}-${name || "hero"}`;
    setUploading(uploadKey);

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

      // Get current max sort_order for this group
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
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search destinations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={fetchMedia}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
        <Badge variant="secondary">{grouped.length} destinations</Badge>
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No destinations with cached media found.</p>
      )}

      {filtered.map((group) => (
        <DestinationSection
          key={group.destination}
          group={group}
          onDelete={handleDelete}
          onReorder={handleReorder}
          onSetHero={handleSetHero}
          onUpload={handleUpload}
          uploading={uploading}
        />
      ))}
    </div>
  );
};

// ─── Destination Section ───────────────────────────────────────────────────

const DestinationSection = ({
  group,
  onDelete,
  onReorder,
  onSetHero,
  onUpload,
  uploading,
}: {
  group: DestinationGroup;
  onDelete: (id: string) => void;
  onReorder: (id: string, dir: "up" | "down", siblings: MediaRow[]) => void;
  onSetHero: (row: MediaRow) => void;
  onUpload: (file: File, dest: string, type: "hero" | "activity" | "hotel", name: string | null) => void;
  uploading: string | null;
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
      >
        <div>
          <h3 className="font-semibold capitalize">{group.destination}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {group.heroes.length} hero · {Object.keys(group.activities).length} activities · {Object.keys(group.hotels).length} hotels
          </p>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-5 border-t">
          {/* Hero images */}
          <MediaGroup
            label="Hero Images"
            items={group.heroes}
            destination={group.destination}
            type="hero"
            name={null}
            onDelete={onDelete}
            onReorder={onReorder}
            onSetHero={onSetHero}
            onUpload={onUpload}
            uploading={uploading}
          />

          {/* Activities */}
          {Object.entries(group.activities).map(([name, items]) => (
            <MediaGroup
              key={`act-${name}`}
              label={`Activity: ${name}`}
              items={items}
              destination={group.destination}
              type="activity"
              name={name}
              onDelete={onDelete}
              onReorder={onReorder}
              onSetHero={onSetHero}
              onUpload={onUpload}
              uploading={uploading}
            />
          ))}

          {/* Hotels */}
          {Object.entries(group.hotels).map(([name, items]) => (
            <MediaGroup
              key={`hotel-${name}`}
              label={`Hotel: ${name}`}
              items={items}
              destination={group.destination}
              type="hotel"
              name={name}
              onDelete={onDelete}
              onReorder={onReorder}
              onSetHero={onSetHero}
              onUpload={onUpload}
              uploading={uploading}
            />
          ))}
        </div>
      )}
    </Card>
  );
};

// ─── Media Group (photos/videos for one venue) ────────────────────────────

const MediaGroup = ({
  label,
  items,
  destination,
  type,
  name,
  onDelete,
  onReorder,
  onSetHero,
  onUpload,
  uploading,
}: {
  label: string;
  items: MediaRow[];
  destination: string;
  type: "hero" | "activity" | "hotel";
  name: string | null;
  onDelete: (id: string) => void;
  onReorder: (id: string, dir: "up" | "down", siblings: MediaRow[]) => void;
  onSetHero: (row: MediaRow) => void;
  onUpload: (file: File, dest: string, type: "hero" | "activity" | "hotel", name: string | null) => void;
  uploading: string | null;
}) => {
  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
  const uploadKey = `${destination}-${type}-${name || "hero"}`;
  const isUploading = uploading === uploadKey;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file, destination, type, name);
    e.target.value = "";
  };

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium">{label}</h4>
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <Button variant="outline" size="sm" asChild disabled={isUploading}>
            <span>
              {isUploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
              Upload
            </span>
          </Button>
        </label>
      </div>

      {sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No media yet</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {sorted.map((item, idx) => (
            <MediaThumbnail
              key={item.id}
              item={item}
              index={idx}
              total={sorted.length}
              onDelete={() => onDelete(item.id)}
              onMoveUp={() => onReorder(item.id, "up", sorted)}
              onMoveDown={() => onReorder(item.id, "down", sorted)}
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
  const isHeroPosition = index === 0;

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
      <div className="absolute top-1 left-1 flex gap-1">
        {isAdmin && (
          <Badge className="text-[9px] px-1 py-0 bg-blue-600 text-white">Admin</Badge>
        )}
        {isVideo && (
          <Badge className="text-[9px] px-1 py-0 bg-purple-600 text-white">
            <Film className="h-2.5 w-2.5 mr-0.5" />Video
          </Badge>
        )}
        {isHeroPosition && !isVideo && (
          <Badge className="text-[9px] px-1 py-0 bg-amber-500 text-white">
            <Star className="h-2.5 w-2.5 mr-0.5" />Hero
          </Badge>
        )}
      </div>

      {/* Actions overlay */}
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
        {!isHeroPosition && !isVideo && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-amber-400 hover:bg-white/20"
            onClick={onSetHero}
            title="Set as hero"
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
