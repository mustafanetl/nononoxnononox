import { useEffect, useMemo, useRef, useState } from "react";
import { Plane, MapPin } from "lucide-react";

export type CraftActivity = { name: string; photo?: string };

type Props = {
  originCity: string;
  destinationCity: string;
  activities: CraftActivity[];
  destinationPhoto?: string;
  /** 0–100 — drives sequencing. */
  progress: number;
};

/**
 * Animated "trip being plotted on a world map" loader.
 * - Phase 1: flight arc draws from origin to destination, plane glides along it.
 * - Phase 2: activity photo pins drop in one by one, each connected by a drawn line.
 * - Phase 3: full route settles.
 *
 * Stability rules to avoid flicker:
 * - Activity slots are reserved up-front based on the highest count seen so far,
 *   so already-shown pins never disappear when the streamed list changes length.
 * - Pin keys are based on slot index (not name), so swapping a name in-place doesn't
 *   cause a remount/replay of the line-draw animation.
 */
const PlanCraftingMap = ({
  originCity,
  destinationCity,
  activities,
  destinationPhoto,
  progress,
}: Props) => {
  // ----- Stable slot count -----
  // Once we've shown N activity pins, never go below N for this crafting cycle.
  const maxSeenRef = useRef(0);
  const stableLen = Math.max(maxSeenRef.current, Math.min(activities.length, 5));
  if (stableLen > maxSeenRef.current) maxSeenRef.current = stableLen;

  // Pad activities to stableLen so layout is fixed; later names just fill in.
  const acts: CraftActivity[] = useMemo(() => {
    const out: CraftActivity[] = [];
    for (let i = 0; i < stableLen; i++) {
      out.push(activities[i] || { name: "" });
    }
    return out;
  }, [activities, stableLen]);

  // ----- Layout -----
  const VB_W = 800;
  const VB_H = 360;
  const origin = { x: 130, y: 150 };
  const destination = { x: 430, y: 150 };

  // Spread activity slots in a controlled cluster around the destination.
  // Pre-computed offsets so positions are stable regardless of count.
  const slotOffsets = useMemo(
    () => [
      { dx: 110, dy: 70 },
      { dx: 180, dy: -40 },
      { dx: 70, dy: -90 },
      { dx: 220, dy: 110 },
      { dx: -30, dy: 110 },
    ],
    []
  );

  const activityPoints = useMemo(
    () =>
      acts.map((_, i) => ({
        x: destination.x + slotOffsets[i].dx,
        y: destination.y + slotOffsets[i].dy,
      })),
    [acts, slotOffsets, destination.x, destination.y]
  );

  // ----- Phase progression (monotonic, never backs up) -----
  const destinationDropped = progress >= 22;
  const totalSlots = Math.max(1, acts.length);
  // Activities revealed evenly between progress 30 and 88.
  const rawVisible = Math.floor(((progress - 30) / 58) * totalSlots);
  const computedVisible = Math.max(0, Math.min(totalSlots, rawVisible));
  const visibleRef = useRef(0);
  if (computedVisible > visibleRef.current) visibleRef.current = computedVisible;
  // Reset when destination resets (new crafting cycle)
  useEffect(() => {
    if (progress < 5) {
      visibleRef.current = 0;
      maxSeenRef.current = 0;
    }
  }, [progress]);
  const visibleActivityCount = visibleRef.current;

  // ----- Caption -----
  const caption = useMemo(() => {
    if (progress < 22) return `Plotting your route to ${destinationCity || "your destination"}…`;
    if (progress >= 90) return "Almost ready…";
    if (visibleActivityCount === 0) return `Arrived in ${destinationCity || "your destination"}…`;
    const current = acts[Math.max(0, visibleActivityCount - 1)];
    const name = current?.name?.trim();
    return name
      ? `Pinning ${name} (${visibleActivityCount} of ${totalSlots})`
      : `Pinning your stops (${visibleActivityCount} of ${totalSlots})`;
  }, [progress, visibleActivityCount, acts, destinationCity, totalSlots]);

  return (
    <div className="w-full max-w-2xl mx-auto py-8 animate-fade-in">
      <div className="relative rounded-2xl border border-border bg-[hsl(var(--card))] overflow-hidden shadow-sm">
        {/* Map paper background */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/40 via-card to-secondary/30" />

        {/* Grid overlay (latitude/longitude feel) */}
        <svg
          aria-hidden
          className="absolute inset-0 w-full h-full opacity-[0.18]"
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="none"
        >
          {[...Array(9)].map((_, i) => (
            <line
              key={`v-${i}`}
              x1={(VB_W / 8) * i}
              y1={0}
              x2={(VB_W / 8) * i}
              y2={VB_H}
              stroke="hsl(var(--foreground))"
              strokeWidth="0.5"
            />
          ))}
          {[...Array(7)].map((_, i) => (
            <line
              key={`h-${i}`}
              x1={0}
              y1={(VB_H / 6) * i}
              x2={VB_W}
              y2={(VB_H / 6) * i}
              stroke="hsl(var(--foreground))"
              strokeWidth="0.5"
            />
          ))}
        </svg>

        {/* World continents silhouette — stylised, evokes a map */}
        <svg
          aria-hidden
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 800 360"
          preserveAspectRatio="xMidYMid slice"
        >
          <g fill="hsl(var(--muted-foreground))" fillOpacity="0.18">
            {/* North America */}
            <path d="M40,80 C70,60 130,55 170,70 C210,80 230,110 215,140 C205,165 175,180 140,180 C110,180 80,170 60,150 C40,130 30,100 40,80 Z" />
            {/* South America */}
            <path d="M180,200 C200,195 220,210 225,240 C230,275 215,310 195,325 C180,335 165,325 165,300 C165,270 170,225 180,200 Z" />
            {/* Europe */}
            <path d="M340,75 C370,65 410,70 425,90 C435,110 420,130 395,135 C370,140 345,130 335,110 C328,95 330,82 340,75 Z" />
            {/* Africa */}
            <path d="M360,150 C395,145 430,160 440,195 C448,230 430,275 400,295 C375,310 355,295 350,265 C345,225 348,180 360,150 Z" />
            {/* Asia */}
            <path d="M450,70 C520,55 620,65 690,90 C730,105 740,135 710,155 C670,175 600,180 540,170 C490,160 450,140 445,110 C443,95 445,80 450,70 Z" />
            {/* Australia */}
            <path d="M620,250 C660,245 700,255 715,275 C725,295 710,315 680,320 C645,325 615,315 605,295 C598,278 605,258 620,250 Z" />
          </g>
        </svg>

        {/* Animation SVG layer */}
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="relative w-full h-[260px] sm:h-[320px]"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Flight arc */}
          <FlightArc from={origin} to={destination} active={progress > 0} />

          {/* Activity connecting lines */}
          {activityPoints.slice(0, visibleActivityCount).map((pt, i) => {
            const prev = i === 0 ? destination : activityPoints[i - 1];
            return <DrawingLine key={`line-${i}`} from={prev} to={pt} />;
          })}

          {/* Origin marker */}
          <g>
            <circle cx={origin.x} cy={origin.y} r="14" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="2" />
            <circle cx={origin.x} cy={origin.y} r="6" fill="hsl(var(--foreground))" />
            <text
              x={origin.x}
              y={origin.y + 32}
              textAnchor="middle"
              fontSize="12"
              fill="hsl(var(--foreground))"
              fontWeight={600}
            >
              {originCity || "Home"}
            </text>
          </g>
        </svg>

        {/* Photo pin overlays — outside the SVG so we can use real <img> */}
        {destinationDropped && (
          <PhotoPin
            xPct={(destination.x / VB_W) * 100}
            yPct={(destination.y / VB_H) * 100}
            label={destinationCity || "Destination"}
            photo={destinationPhoto}
            primary
          />
        )}
        {activityPoints.slice(0, visibleActivityCount).map((pt, i) => (
          <PhotoPin
            key={`pin-${i}`}
            xPct={(pt.x / VB_W) * 100}
            yPct={(pt.y / VB_H) * 100}
            label={acts[i]?.name || `Stop ${i + 1}`}
            photo={acts[i]?.photo}
          />
        ))}

        {/* Plane glyph */}
        {progress > 0 && progress < 30 && (
          <FlyingPlane from={origin} to={destination} vbW={VB_W} vbH={VB_H} />
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground mt-4 font-medium">
        {caption}
      </p>
    </div>
  );
};

/* ---------- Sub-components ---------- */

const FlightArc = ({
  from,
  to,
  active,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  active: boolean;
}) => {
  const midX = (from.x + to.x) / 2;
  const midY = Math.min(from.y, to.y) - 70;
  const d = `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
  // Approximate path length
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) + 80;
  return (
    <path
      d={d}
      fill="none"
      stroke="hsl(var(--foreground))"
      strokeWidth="2"
      strokeDasharray={`6 6`}
      strokeLinecap="round"
      pathLength={100}
      style={{
        strokeDasharray: "100",
        strokeDashoffset: active ? 0 : 100,
        transition: "stroke-dashoffset 3.2s ease-out",
      }}
    />
  );
};

const DrawingLine = ({
  from,
  to,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
}) => {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 30);
    return () => clearTimeout(t);
  }, []);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke="hsl(var(--foreground))"
      strokeOpacity="0.7"
      strokeWidth="1.75"
      strokeDasharray={`${len}`}
      strokeLinecap="round"
      style={{
        strokeDashoffset: drawn ? 0 : len,
        transition: "stroke-dashoffset 0.7s ease-out",
      }}
    />
  );
};

const FlyingPlane = ({
  from,
  to,
  vbW,
  vbH,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  vbW: number;
  vbH: number;
}) => {
  const [t, setT] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const dur = 3200;
    let raf = 0;
    const tick = () => {
      const elapsed = Date.now() - start;
      const k = Math.min(1, elapsed / dur);
      setT(k);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // Intentionally no deps — single play per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const midX = (from.x + to.x) / 2;
  const midY = Math.min(from.y, to.y) - 70;
  const x = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * midX + t * t * to.x;
  const y = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * midY + t * t * to.y;

  const dx = 2 * (1 - t) * (midX - from.x) + 2 * t * (to.x - midX);
  const dy = 2 * (1 - t) * (midY - from.y) + 2 * t * (to.y - midY);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  const xPct = (x / vbW) * 100;
  const yPct = (y / vbH) * 100;

  return (
    <div
      className="absolute pointer-events-none z-20"
      style={{
        left: `${xPct}%`,
        top: `${yPct}%`,
        transform: `translate(-50%, -50%) rotate(${angle}deg)`,
      }}
    >
      <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg ring-2 ring-background">
        <Plane className="h-4 w-4" />
      </div>
    </div>
  );
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "•";

const PhotoPin = ({
  xPct,
  yPct,
  label,
  photo,
  primary = false,
}: {
  xPct: number;
  yPct: number;
  label: string;
  photo?: string;
  primary?: boolean;
}) => {
  const size = primary ? 72 : 52;
  const [imgError, setImgError] = useState(false);
  return (
    <div
      className="absolute pointer-events-none animate-scale-in z-10"
      style={{
        left: `${xPct}%`,
        top: `${yPct}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div className="flex flex-col items-center">
        <div
          className={`rounded-full overflow-hidden ring-[3px] shadow-xl flex items-center justify-center bg-muted ${
            primary ? "ring-foreground" : "ring-background"
          }`}
          style={{ width: size, height: size }}
        >
          {photo && !imgError ? (
            <img
              src={photo}
              alt={label}
              className="w-full h-full object-cover"
              loading="eager"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-foreground font-semibold text-xs bg-gradient-to-br from-secondary to-muted">
              {primary ? <MapPin className="h-6 w-6" /> : initials(label)}
            </div>
          )}
        </div>
        {label && (
          <span
            className="mt-1.5 px-2 py-0.5 text-[10px] font-semibold text-foreground bg-background/95 backdrop-blur-sm rounded-md max-w-[120px] truncate shadow-md border border-border"
            title={label}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

export default PlanCraftingMap;