import { useEffect, useMemo, useState } from "react";
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
 * Animated "trip being plotted on a map" loader.
 * Phase 1 (progress 0–30): flight line draws from origin → destination, plane glides along it,
 *                          destination circle pops in.
 * Phase 2 (progress 30–90): activity circles drop in one by one, each connected by a line.
 * Phase 3 (progress 90–100): full route settles, soft pulse on destination.
 */
const PlanCraftingMap = ({
  originCity,
  destinationCity,
  activities,
  destinationPhoto,
  progress,
}: Props) => {
  // Limit to 5 activities for the visual
  const acts = useMemo(() => activities.slice(0, 5), [activities]);

  // Layout in a 600x260 viewBox
  const VB_W = 600;
  const VB_H = 260;
  const origin = { x: 70, y: 90 };
  const destination = { x: 300, y: 90 };

  // Spread activities in an arc below/around destination
  const activityPoints = useMemo(() => {
    const baseX = 360;
    const baseY = 160;
    const stepX = 55;
    return acts.map((_, i) => ({
      x: baseX + i * stepX,
      y: baseY + (i % 2 === 0 ? 0 : -40),
    }));
  }, [acts]);

  // Phase derived from progress
  const flightDrawn = progress >= 8;
  const destinationDropped = progress >= 22;
  const visibleActivityCount = Math.min(
    acts.length,
    Math.max(0, Math.floor((progress - 30) / Math.max(1, 60 / Math.max(1, acts.length))))
  );

  // Caption
  const caption = useMemo(() => {
    if (progress < 22) return `Plotting your route to ${destinationCity || "your destination"}…`;
    if (visibleActivityCount === 0) return `Arrived in ${destinationCity}…`;
    const current = acts[Math.max(0, visibleActivityCount - 1)];
    if (progress >= 90) return "Almost ready…";
    return current
      ? `Pinning ${current.name} (${visibleActivityCount} of ${acts.length || 1})`
      : "Curating your stops…";
  }, [progress, visibleActivityCount, acts, destinationCity]);

  return (
    <div className="w-full max-w-2xl mx-auto py-8 animate-fade-in">
      <div className="relative rounded-2xl border border-border bg-card overflow-hidden">
        {/* Subtle map-paper background */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)",
            backgroundSize: "16px 16px",
          }}
        />

        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="relative w-full h-[220px] sm:h-[260px]"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Decorative coastline-like curves for "map" feel */}
          <path
            d="M 0 200 C 120 180, 220 220, 340 195 S 560 180, 600 205"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            strokeDasharray="3 5"
          />
          <path
            d="M 0 60 C 100 70, 200 50, 320 65 S 520 80, 600 55"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            strokeDasharray="3 5"
          />

          {/* Flight leg path: gentle arc origin → destination */}
          <FlightArc
            from={origin}
            to={destination}
            active={progress > 0}
          />

          {/* Activity connecting lines (origin = destination, then sequential) */}
          {activityPoints.slice(0, visibleActivityCount).map((pt, i) => {
            const prev = i === 0 ? destination : activityPoints[i - 1];
            return <DrawingLine key={`line-${i}`} from={prev} to={pt} />;
          })}

          {/* Origin marker */}
          <g>
            <circle cx={origin.x} cy={origin.y} r="6" fill="hsl(var(--foreground))" />
            <circle cx={origin.x} cy={origin.y} r="11" fill="none" stroke="hsl(var(--foreground))" strokeOpacity="0.25" strokeWidth="1" />
            <text
              x={origin.x}
              y={origin.y + 26}
              textAnchor="middle"
              fontSize="11"
              fill="hsl(var(--muted-foreground))"
              fontWeight={600}
            >
              {originCity || "Home"}
            </text>
          </g>
        </svg>

        {/* Photo circles overlaid via percentage positions */}
        {/* Destination */}
        {destinationDropped && (
          <PhotoPin
            xPct={(destination.x / VB_W) * 100}
            yPct={(destination.y / VB_H) * 100}
            label={destinationCity || "Destination"}
            photo={destinationPhoto}
            primary
          />
        )}

        {/* Activities */}
        {activityPoints.slice(0, visibleActivityCount).map((pt, i) => (
          <PhotoPin
            key={`pin-${i}-${acts[i]?.name}`}
            xPct={(pt.x / VB_W) * 100}
            yPct={(pt.y / VB_H) * 100}
            label={acts[i]?.name || ""}
            photo={acts[i]?.photo}
          />
        ))}

        {/* Plane that travels with the flight */}
        {progress > 0 && progress < 35 && (
          <FlyingPlane
            from={origin}
            to={destination}
            vbW={VB_W}
            vbH={VB_H}
          />
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
  const midY = Math.min(from.y, to.y) - 50;
  const d = `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
  return (
    <path
      d={d}
      fill="none"
      stroke="hsl(var(--foreground))"
      strokeWidth="1.75"
      strokeDasharray="6 5"
      strokeLinecap="round"
      style={{
        strokeDashoffset: active ? 0 : 400,
        transition: "stroke-dashoffset 3.2s ease-out",
      }}
      // initial offset large so dasharray "draws" in
      // (re-render with active=true triggers transition)
      // Note: SVG props don't read inline pathLength — we approximate.
      // Set initial via a data attribute trick by mounting at offset 400.
      // Modern browsers handle the transition correctly on prop change.
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
  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke="hsl(var(--foreground))"
      strokeOpacity="0.55"
      strokeWidth="1.25"
      strokeDasharray="4 4"
      style={{
        strokeDashoffset: drawn ? 0 : 200,
        transition: "stroke-dashoffset 0.9s ease-out",
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
  }, [from.x, from.y, to.x, to.y]);

  // Quadratic bezier point
  const midX = (from.x + to.x) / 2;
  const midY = Math.min(from.y, to.y) - 50;
  const x = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * midX + t * t * to.x;
  const y = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * midY + t * t * to.y;

  // Tangent for rotation
  const dx = 2 * (1 - t) * (midX - from.x) + 2 * t * (to.x - midX);
  const dy = 2 * (1 - t) * (midY - from.y) + 2 * t * (to.y - midY);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  const xPct = (x / vbW) * 100;
  const yPct = (y / vbH) * 100;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${xPct}%`,
        top: `${yPct}%`,
        transform: `translate(-50%, -50%) rotate(${angle}deg)`,
      }}
    >
      <div className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center shadow-md">
        <Plane className="h-3.5 w-3.5" />
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
  const size = primary ? 64 : 48;
  return (
    <div
      className="absolute pointer-events-none animate-scale-in"
      style={{
        left: `${xPct}%`,
        top: `${yPct}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div className="flex flex-col items-center">
        <div
          className={`rounded-full overflow-hidden ring-2 ring-background shadow-lg flex items-center justify-center bg-muted ${
            primary ? "ring-foreground/80" : ""
          }`}
          style={{ width: size, height: size }}
        >
          {photo ? (
            <img
              src={photo}
              alt={label}
              className="w-full h-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-foreground font-semibold text-xs bg-gradient-to-br from-muted to-secondary">
              {primary ? <MapPin className="h-5 w-5" /> : initials(label)}
            </div>
          )}
        </div>
        <span
          className="mt-1 px-1.5 py-0.5 text-[10px] font-medium text-foreground bg-background/85 backdrop-blur-sm rounded-md max-w-[110px] truncate shadow-sm border border-border/60"
          title={label}
        >
          {label}
        </span>
      </div>
    </div>
  );
};

export default PlanCraftingMap;