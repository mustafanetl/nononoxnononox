import { useEffect, useMemo, useRef, useState } from "react";

export type CraftActivity = { name: string; photo?: string };
export type CraftGeo = { lat: number; lng: number };

type Props = {
  originCity: string;
  destinationCity: string;
  activities: CraftActivity[];
  destinationPhoto?: string;
  destinationGeo?: CraftGeo;
  progress: number; // 0–100
};

// Best-effort 3-letter code from a city name (no real airport DB needed —
// this is a visual flourish, not booking data).
const cityCode = (name: string): string => {
  const cleaned = (name || "").trim().replace(/[^a-zA-Z\s]/g, "");
  if (!cleaned) return "•••";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0] + (parts[1][1] || parts[0][1] || "X"))
      .toUpperCase();
  }
  const w = parts[0];
  if (w.length >= 3) return (w[0] + w[Math.floor(w.length / 2)] + w[w.length - 1]).toUpperCase();
  return w.toUpperCase().padEnd(3, "X");
};

// Lightweight category guess from activity name — purely cosmetic.
const guessCategory = (name: string): string => {
  const n = name.toLowerCase();
  if (/(restaurant|sushi|ramen|cafe|bar|dinner|lunch|brunch|bistro|tavern|pizz|trattoria|izakaya|omakase|bakery|coffee|tea)/.test(n)) return "Dining";
  if (/(museum|gallery|temple|shrine|cathedral|church|palace|castle|monument|memorial|opera|theater|theatre)/.test(n)) return "Culture";
  if (/(park|garden|beach|hike|trail|mountain|lake|forest|nature|valley|cliff|waterfall|island)/.test(n)) return "Nature";
  if (/(market|shop|boutique|mall|district|street|store)/.test(n)) return "Shopping";
  if (/(spa|wellness|hammam|onsen|thermal|massage)/.test(n)) return "Wellness";
  if (/(tour|cruise|boat|kayak|bike|cycling|excursion|day trip)/.test(n)) return "Tour";
  if (/(viewpoint|overlook|tower|observation|skyline|rooftop)/.test(n)) return "Vista";
  if (/(bar|club|nightlife|lounge|live music|jazz)/.test(n)) return "Nightlife";
  return "Explore";
};

// Marquee text shown in the manifest header — rotates while streaming.
const STATUS_LINES = [
  "Mapping streets",
  "Cross-referencing reviews",
  "Sequencing days by geography",
  "Estimating walking distances",
  "Filtering for opening hours",
  "Checking neighbourhood vibes",
  "Curating dinner picks",
  "Balancing pace and rest",
];

const PlanCraftingMap = ({ originCity, destinationCity, activities, progress }: Props) => {
  const safeProgress = Math.max(0, Math.min(100, progress || 0));

  // Stabilise the activity list so labels never disappear once they appear
  // (otherwise re-renders during streaming flash empty rows).
  const slotsRef = useRef<CraftActivity[]>([]);
  const [slots, setSlots] = useState<CraftActivity[]>([]);
  useEffect(() => {
    if (safeProgress < 5) {
      slotsRef.current = [];
      setSlots([]);
      return;
    }
    const incoming = activities.filter((a) => a.name?.trim()).slice(0, 5);
    const prev = slotsRef.current;
    const nextLength = Math.max(prev.length, incoming.length);
    const next: CraftActivity[] = Array.from({ length: nextLength }, (_, i) => incoming[i] || prev[i] || { name: "" });
    // Only update when content actually changes — prevents flicker.
    const changed =
      next.length !== prev.length ||
      next.some((s, i) => (s.name || "") !== (prev[i]?.name || ""));
    if (changed) {
      slotsRef.current = next;
      setSlots(next);
    }
  }, [activities, safeProgress]);

  const filledCount = slots.filter((s) => s.name?.trim()).length;
  // The "syncing" row is the next empty slot (or the last filled if all done).
  const syncingIndex = useMemo(() => {
    const idx = slots.findIndex((s) => !s.name?.trim());
    if (idx === -1) return slots.length; // all filled
    return idx;
  }, [slots]);

  // Rotating status line for the header — soft tick every 1.6s.
  const [statusIdx, setStatusIdx] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => {
      setStatusIdx((i) => (i + 1) % STATUS_LINES.length);
    }, 1600);
    return () => window.clearInterval(t);
  }, []);

  const originCode = cityCode(originCity);
  const destCode = cityCode(destinationCity);
  const seqId = useMemo(() => {
    // Stable per-render-session sequence number, looks like a manifest ID.
    const n = Math.floor(100 + Math.random() * 800);
    const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    return `${n}-${letter}`;
  }, []);
  const pct = Math.round(safeProgress);

  return (
    <div className="w-full max-w-[640px] mx-auto animate-fade-in">
      <div className="border border-foreground p-6 md:p-8 relative bg-background overflow-hidden">
        {/* corner ticks */}
        <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-foreground" />
        <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-foreground" />
        <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-foreground" />
        <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-foreground" />

        {/* Header */}
        <div className="flex justify-between items-end border-b border-foreground pb-4 mb-8">
          <div className="font-display text-[10px] uppercase tracking-[0.2em] text-foreground/70">
            Jolliday Manifest
          </div>
          <div className="font-display text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 text-foreground">
            <span className="size-1.5 bg-foreground rounded-full animate-pulse" />
            <span key={statusIdx} className="animate-fade-in">{STATUS_LINES[statusIdx]}</span>
          </div>
        </div>

        {/* Route block */}
        <div className="flex items-end justify-between mb-10 gap-4">
          <div className="min-w-0">
            <div className="font-display text-[10px] uppercase tracking-[0.15em] text-foreground/50 mb-1">
              Origin
            </div>
            <div className="font-display text-4xl md:text-5xl tracking-tighter leading-none mb-2 tabular-nums">
              {originCode}
            </div>
            <div className="text-sm text-foreground/70 tracking-tight truncate">
              {originCity || "Home"}
            </div>
          </div>

          <div className="flex-1 px-4 md:px-8 flex flex-col items-center justify-end pb-1 min-w-0">
            <div className="font-display text-[9px] uppercase tracking-[0.2em] text-foreground/40 mb-3">
              Vector Route
            </div>
            <div className="w-full h-[1px] bg-foreground/20 relative flex items-center">
              <div className="absolute left-0 w-1.5 h-1.5 bg-foreground rounded-full -translate-y-[1px]" />
              <div className="absolute right-0 w-1.5 h-1.5 bg-foreground/20 rounded-full -translate-y-[1px]" />
              <div
                className="h-[1px] bg-foreground relative transition-[width] duration-700 ease-out"
                style={{ width: `${Math.max(4, Math.min(96, pct))}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-background border border-foreground rounded-full" />
              </div>
            </div>
          </div>

          <div className="text-right min-w-0">
            <div className="font-display text-[10px] uppercase tracking-[0.15em] text-foreground/50 mb-1">
              Destination
            </div>
            <div className="font-display text-4xl md:text-5xl tracking-tighter leading-none mb-2 tabular-nums">
              {destCode}
            </div>
            <div className="text-sm text-foreground/70 tracking-tight truncate">
              {destinationCity || "your destination"}
            </div>
          </div>
        </div>

        {/* Manifest table */}
        <div className="border-t-2 border-foreground pt-6 mb-8">
          <div className="font-display text-[10px] uppercase tracking-[0.15em] text-foreground mb-6">
            Manifest Details
          </div>

          <div className="grid grid-cols-[auto_72px_1fr_auto] gap-x-4 md:gap-x-6 gap-y-4 items-baseline w-full">
            {/* headers */}
            <div className="font-display text-[9px] uppercase tracking-widest text-foreground/40 pb-2 border-b border-foreground/10">Seq</div>
            <div className="font-display text-[9px] uppercase tracking-widest text-foreground/40 pb-2 border-b border-foreground/10">Class</div>
            <div className="font-display text-[9px] uppercase tracking-widest text-foreground/40 pb-2 border-b border-foreground/10">Parameter</div>
            <div className="font-display text-[9px] uppercase tracking-widest text-foreground/40 pb-2 border-b border-foreground/10 text-right">Status</div>

            {Array.from({ length: Math.max(4, slots.length) }).map((_, i) => {
              const slot = slots[i];
              const filled = !!slot?.name?.trim();
              const isSyncing = !filled && i === syncingIndex && safeProgress < 95;
              const isPending = !filled && !isSyncing;
              const cat = filled ? guessCategory(slot!.name) : isSyncing ? "Curating" : "Explore";
              const status = filled ? "Locked" : isSyncing ? "Syncing" : "Await";

              return (
                <div key={i} className="contents">
                  <div className={`font-display tabular-nums text-sm ${isPending ? "text-foreground/20" : "text-foreground"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className={`font-display text-[10px] uppercase tracking-wider ${isPending ? "text-foreground/20" : isSyncing ? "text-foreground" : "text-foreground/70"}`}>
                    {cat}
                  </div>
                  <div className="text-sm min-w-0">
                    {filled ? (
                      <span className="block truncate text-foreground/85">{slot!.name}</span>
                    ) : isSyncing ? (
                      <span className="inline-flex items-center gap-2 text-foreground">
                        <span className="inline-block h-3 w-3/4 max-w-[260px] bg-foreground/10 rounded-sm relative overflow-hidden">
                          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/20 to-transparent animate-[shimmer_1.6s_ease-in-out_infinite]" />
                        </span>
                        <span className="w-[1.5px] h-3 bg-foreground animate-pulse" />
                      </span>
                    ) : (
                      <span className="block h-[10px] w-1/2 bg-foreground/5 rounded-sm" />
                    )}
                  </div>
                  <div className={`font-display text-[10px] uppercase tracking-widest text-right ${isPending ? "text-foreground/20" : isSyncing ? "text-foreground animate-pulse" : "text-foreground/50"}`}>
                    {status}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-foreground/20 pt-4 flex justify-between items-end">
          <div className="flex gap-[2px] h-5 items-end opacity-40" aria-hidden>
            {[1, 0.4, 0.7, 0.3, 1, 0.5, 0.3, 0.8, 0.4, 1, 0.5, 0.3].map((h, i) => (
              <div key={i} className="bg-foreground" style={{ width: i % 3 === 0 ? 3 : 1, height: `${h * 100}%` }} />
            ))}
          </div>
          <div className="font-display text-[10px] tabular-nums tracking-widest text-foreground/60 uppercase">
            SEQ {seqId} // {pct}% · {filledCount}/{Math.max(4, slots.length)} locked
          </div>
        </div>
      </div>

      {/* keyframes — scoped via tailwind arbitrary animation already supported */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default PlanCraftingMap;
