import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Compass, MapPinned, Utensils, Camera } from "lucide-react";

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

// 4-stage progression — gives the user a sense of forward motion.
const STAGES = [
  { label: "Reading your request", icon: Compass },
  { label: "Mapping the city", icon: MapPinned },
  { label: "Picking the best spots", icon: Camera },
  { label: "Sequencing your days", icon: Utensils },
];

const stageIndex = (pct: number): number => {
  if (pct < 18) return 0;
  if (pct < 45) return 1;
  if (pct < 78) return 2;
  return 3;
};

// Generic travel facts shown before destination arrives — keeps users engaged.
const GENERIC_FACTS = [
  "Travelers spend 23% less when they book mid-week flights.",
  "The best time to find local food is between lunch shifts, around 3pm.",
  "Walking 30 minutes a day on a trip burns roughly 1,000 extra calories.",
  "Most museums offer free entry on the first Sunday of the month.",
  "Sunset photos look best 20 minutes before the sun actually sets.",
  "Locals usually eat dinner an hour later than tourist menus suggest.",
  "Booking activities for the morning beats 80% of tour-bus crowds.",
  "Tap water is safe in 60+ countries — your guide will flag the rest.",
];

const STATUS_LINES = [
  "Sketching your days",
  "Reading thousands of reviews",
  "Sequencing stops by walking distance",
  "Picking dinner spots locals love",
  "Balancing pace and rest",
  "Checking opening hours",
  "Finding hidden corners",
  "Scoring the perfect breakfast",
];

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
  return "Stop";
};

const PlanCraftingMap = ({ originCity, destinationCity, activities, progress }: Props) => {
  const safeProgress = Math.max(0, Math.min(100, progress || 0));
  const pct = Math.round(safeProgress);
  const hasDestination = !!destinationCity?.trim();

  // Stable, monotonic activity slots — once a name appears it stays.
  const slotsRef = useRef<CraftActivity[]>([]);
  const [slots, setSlots] = useState<CraftActivity[]>([]);
  useEffect(() => {
    const incoming = activities.filter((a) => a.name?.trim()).slice(0, 5);
    const prev = slotsRef.current;
    const nextLength = Math.max(prev.length, incoming.length);
    const next: CraftActivity[] = Array.from(
      { length: nextLength },
      (_, i) => incoming[i] || prev[i] || { name: "" }
    );
    const changed =
      next.length !== prev.length ||
      next.some((s, i) => (s.name || "") !== (prev[i]?.name || ""));
    if (changed) {
      slotsRef.current = next;
      setSlots(next);
    }
  }, [activities]);

  const filledSlots = useMemo(() => slots.filter((s) => s.name?.trim()), [slots]);

  // Rotating header status line.
  const [statusIdx, setStatusIdx] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => {
      setStatusIdx((i) => (i + 1) % STATUS_LINES.length);
    }, 1800);
    return () => window.clearInterval(t);
  }, []);

  // Typewriter for destination — but always visible (uses placeholder when empty).
  const target = hasDestination ? destinationCity : "Finding your destination";
  const [typed, setTyped] = useState(target);
  const lastTargetRef = useRef("");
  useEffect(() => {
    if (target === lastTargetRef.current) return;
    lastTargetRef.current = target;
    setTyped("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(target.slice(0, i));
      if (i >= target.length) window.clearInterval(id);
    }, 45);
    return () => window.clearInterval(id);
  }, [target]);

  // Travel fact ticker — rotates every 3.2s.
  const [factIdx, setFactIdx] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => {
      setFactIdx((i) => (i + 1) % GENERIC_FACTS.length);
    }, 3200);
    return () => window.clearInterval(t);
  }, []);

  const currentStage = stageIndex(pct);

  return (
    <div className="w-full max-w-[640px] mx-auto animate-fade-in">
      <div className="relative rounded-3xl overflow-hidden border border-border bg-card shadow-[0_8px_40px_-12px_rgba(0,0,0,0.18)]">
        {/* Hero — soft monochrome gradient with subtle drifting orbs */}
        <div className="relative h-44 md:h-52 overflow-hidden bg-gradient-to-br from-foreground via-foreground to-foreground/85">
          {/* drifting orbs */}
          <div
            className="absolute -top-16 -left-10 w-64 h-64 rounded-full bg-background/10 blur-3xl"
            style={{ animation: "drift1 8s ease-in-out infinite" }}
          />
          <div
            className="absolute -bottom-20 -right-10 w-72 h-72 rounded-full bg-background/[0.07] blur-3xl"
            style={{ animation: "drift2 10s ease-in-out infinite" }}
          />
          {/* fine grid texture */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--background)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--background)) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          {/* top row: pill + percent */}
          <div className="relative z-10 flex items-center justify-between px-6 pt-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/10 backdrop-blur-sm border border-background/15 text-background/90">
              <Sparkles className="h-3 w-3" />
              <span className="text-[11px] font-medium tracking-wide">Crafting your trip</span>
            </div>
            <div className="font-display text-xs tabular-nums text-background/70 tracking-wider">
              {pct}%
            </div>
          </div>

          {/* destination */}
          <div className="relative z-10 px-6 pb-6 pt-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-background/50 mb-1.5">
              {originCity ? `From ${originCity}` : "Destination"}
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-background tracking-tight leading-tight">
              {typed || "\u00A0"}
              <span className="inline-block w-[2px] h-7 md:h-8 bg-background/80 ml-1 -mb-1 animate-pulse" />
            </h2>
          </div>

          {/* progress bar at bottom of hero */}
          <div className="absolute left-0 right-0 bottom-0 h-[3px] bg-background/10">
            <div
              className="h-full bg-background transition-[width] duration-700 ease-out"
              style={{ width: `${Math.max(2, pct)}%` }}
            />
          </div>
        </div>

        {/* Stage stepper */}
        <div className="px-6 md:px-7 pt-5 pb-3">
          <div className="flex items-center gap-2">
            {STAGES.map((stage, i) => {
              const Icon = stage.icon;
              const done = i < currentStage;
              const active = i === currentStage;
              return (
                <div key={i} className="flex-1 flex items-center gap-2 min-w-0">
                  <div
                    className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                      active
                        ? "bg-foreground text-background"
                        : done
                        ? "bg-foreground/80 text-background"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${active ? "animate-pulse" : ""}`} />
                  </div>
                  {i < STAGES.length - 1 && (
                    <div className="flex-1 h-[2px] bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-foreground transition-all duration-700 ${
                          done ? "w-full" : active ? "w-1/2" : "w-0"
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            <span className="font-display tabular-nums tracking-wider text-foreground/70">
              Step {currentStage + 1} of {STAGES.length}
            </span>
            <span className="mx-2 text-foreground/20">·</span>
            <span key={statusIdx} className="animate-fade-in">
              {STAGES[currentStage].label}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 md:px-7 pb-6 space-y-5">
          {/* Travel fact ticker — keeps users engaged before slots arrive */}
          <div className="relative px-4 py-3 rounded-xl bg-muted/40 border border-border overflow-hidden">
            <div className="flex items-start gap-2.5">
              <div className="shrink-0 mt-0.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-foreground text-background font-display text-[10px] font-semibold">
                  i
                </span>
              </div>
              <p
                key={factIdx}
                className="text-[13px] text-foreground/80 leading-relaxed animate-fade-in"
              >
                {GENERIC_FACTS[factIdx]}
              </p>
            </div>
          </div>

          {/* activity stream */}
          <div className="space-y-2.5">
            <div className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-medium">
              {filledSlots.length > 0 ? `${filledSlots.length} stops added` : "Stops loading"}
            </div>

            {filledSlots.length === 0 ? (
              <>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/40"
                  >
                    <div className="w-7 h-7 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 h-3 rounded-full bg-muted relative overflow-hidden">
                      <div
                        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
                        style={{
                          animation: `shimmer 1.6s ease-in-out infinite`,
                          animationDelay: `${i * 0.18}s`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </>
            ) : (
              filledSlots.map((slot, i) => (
                <div
                  key={`${i}-${slot.name}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-background hover:bg-muted/40 transition-colors animate-fade-in"
                  style={{ animationDelay: `${Math.min(i * 60, 240)}ms`, animationFillMode: "both" }}
                >
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-foreground text-background font-display text-[11px] font-semibold tabular-nums shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate">
                      {slot.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground tracking-wide uppercase mt-0.5">
                      {guessCategory(slot.name)}
                    </div>
                  </div>
                  <div className="text-[11px] text-foreground/60 font-medium shrink-0">
                    Added
                  </div>
                </div>
              ))
            )}

            {/* Phantom "next stop" loader if we have at least one filled and not done */}
            {filledSlots.length > 0 && filledSlots.length < 5 && safeProgress < 95 && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-border bg-muted/20 animate-fade-in">
                <div className="w-7 h-7 rounded-full bg-muted shrink-0 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="h-3 w-2/3 rounded-full bg-muted relative overflow-hidden">
                    <div
                      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/15 to-transparent"
                      style={{ animation: "shimmer 1.4s ease-in-out infinite" }}
                    />
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground shrink-0">Finding…</div>
              </div>
            )}
          </div>
        </div>

        {/* Local keyframes */}
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes drift1 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(20px, 10px) scale(1.08); }
          }
          @keyframes drift2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-15px, -12px) scale(1.05); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default PlanCraftingMap;
