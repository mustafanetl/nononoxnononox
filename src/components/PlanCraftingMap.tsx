import { useEffect, useMemo, useRef, useState } from "react";
import { Plane } from "lucide-react";
import { LogoMark } from "@/components/Logo";

export type CraftActivity = { name: string; photo?: string };
export type CraftGeo = { lat: number; lng: number };

type Props = {
  originCity: string;
  destinationCity: string;
  activities: CraftActivity[];
  destinationPhoto?: string;
  destinationGeo?: CraftGeo;
  progress: number;
};

/* ─────────────────────────────────────────────────────────────
   PlanCraftingMap
   A cinematic "your plan is being built" moment.

   Replaces the old static loader with an actual animated map:
   • Gradient sky canvas with soft dot grid & noise
   • Dashed quadratic-bezier arc from origin → destination,
     revealed progressively via stroke-dashoffset
   • Plane icon sliding along the arc based on progress
   • Destination pulse pin + cluster of dropping activity pins
     that land as the AI streams venue names
   • Rotating stage labels under the title
   • Live progress bar + activity stream list

   Origin is optional. When empty, the arc & origin pin are
   hidden and the destination & pin cluster center the canvas.
   ───────────────────────────────────────────────────────────── */

// SVG viewBox dimensions
const VB_W = 420;
const VB_H = 260;

// Arc control points
const ORIGIN = { x: 60, y: 150 };
const DEST = { x: 360, y: 130 };
const CONTROL = { x: 210, y: 40 };

// Deterministic jitter for activity pins around destination
const PIN_OFFSETS: { dx: number; dy: number }[] = [
  { dx: -34, dy: -44 },
  { dx: 22, dy: -36 },
  { dx: -12, dy: 28 },
  { dx: 36, dy: 12 },
  { dx: -28, dy: -12 },
  { dx: 10, dy: 42 },
  { dx: -44, dy: 6 },
];

const STAGES = [
  "Scoping the vibe",
  "Picking neighborhoods",
  "Sequencing the days",
  "Pricing it out",
  "Polishing the plan",
];

const quadBezier = (t: number) => {
  const inv = 1 - t;
  const x = inv * inv * ORIGIN.x + 2 * inv * t * CONTROL.x + t * t * DEST.x;
  const y = inv * inv * ORIGIN.y + 2 * inv * t * CONTROL.y + t * t * DEST.y;
  const dx = 2 * inv * (CONTROL.x - ORIGIN.x) + 2 * t * (DEST.x - CONTROL.x);
  const dy = 2 * inv * (CONTROL.y - ORIGIN.y) + 2 * t * (DEST.y - CONTROL.y);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return { x, y, angle };
};

const PlanCraftingMap = ({
  originCity,
  destinationCity,
  activities,
  progress,
}: Props) => {
  const hasOrigin = !!originCity?.trim();
  const hasDestination = !!destinationCity?.trim();
  const filled = useMemo(
    () => activities.filter((a) => a.name?.trim()),
    [activities],
  );

  // Typewriter effect for destination
  const targetDest = hasDestination ? destinationCity : "Your trip";
  const [typed, setTyped] = useState("");
  const lastTargetRef = useRef<string>("");
  useEffect(() => {
    if (targetDest === lastTargetRef.current) return;
    lastTargetRef.current = targetDest;
    setTyped("");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(targetDest.slice(0, i));
      if (i >= targetDest.length) clearInterval(id);
    }, 42);
    return () => clearInterval(id);
  }, [targetDest]);

  // Rotating stage label
  const [stageIdx, setStageIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStageIdx((i) => (i + 1) % STAGES.length), 2400);
    return () => clearInterval(id);
  }, []);

  // Progress → plane position (0..0.96 so it doesn't disappear into dest)
  const t = Math.min(0.96, Math.max(0, progress / 100));
  const plane = quadBezier(t);

  // How many pins are "dropped" — based on both streamed names and progress
  const pinsByProgress = Math.min(
    PIN_OFFSETS.length,
    Math.max(0, Math.ceil((progress - 20) / 12)),
  );
  const pinsTarget = Math.max(filled.length, pinsByProgress);

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <div className="rounded-3xl border border-border bg-white shadow-xl overflow-hidden">
        {/* ─── Header: destination + stage ─── */}
        <div
          className="relative px-6 pt-6 pb-5 overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 38%))",
          }}
        >
          {/* Drifting orb */}
          <div
            className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl"
            style={{ animation: "craft-drift 7s ease-in-out infinite" }}
          />
          <div
            className="absolute -bottom-20 -left-10 w-40 h-40 rounded-full bg-white/5 blur-2xl"
            style={{ animation: "craft-drift2 9s ease-in-out infinite" }}
          />

          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-md bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <LogoMark size={14} color="white" className="animate-spin" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-white/85 font-semibold">
                  Crafting your plan
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight leading-tight truncate">
                {hasOrigin ? (
                  <span className="text-white/70 font-medium">
                    {originCity} <span className="mx-1 opacity-70">→</span>{" "}
                  </span>
                ) : null}
                <span>{typed || "\u00A0"}</span>
                <span className="inline-block w-0.5 h-5 bg-white/70 ml-0.5 animate-pulse align-middle" />
              </h2>
              <p
                key={stageIdx}
                className="mt-1 text-xs text-white/80 animate-stage-fade"
              >
                {STAGES[stageIdx]}…
              </p>
            </div>

            <div
              className="shrink-0 text-right"
              aria-label={`${Math.round(progress)}% complete`}
            >
              <div className="text-2xl font-bold text-white tabular-nums leading-none">
                {Math.round(progress)}
                <span className="text-sm opacity-70">%</span>
              </div>
              <div className="mt-1 text-[9px] uppercase tracking-[0.25em] text-white/70">
                built
              </div>
            </div>
          </div>
        </div>

        {/* ─── Map canvas ─── */}
        <div
          className="relative"
          style={{
            background:
              "linear-gradient(180deg, hsl(234 62% 97%) 0%, hsl(234 40% 92%) 70%, hsl(234 30% 94%) 100%)",
          }}
        >
          {/* Subtle dot grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-60"
            style={{
              backgroundImage:
                "radial-gradient(hsl(234 30% 70% / 0.35) 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          />
          {/* Soft noise */}
          <div className="absolute inset-0 pointer-events-none noise-overlay opacity-30" />

          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="relative block w-full h-auto"
            role="img"
            aria-label="Trip route map"
          >
            <defs>
              <linearGradient id="arcStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(234, 62%, 47%)" stopOpacity="0.55" />
                <stop offset="100%" stopColor="hsl(234, 62%, 47%)" stopOpacity="1" />
              </linearGradient>
              <filter id="pinShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2" />
              </filter>
            </defs>

            {/* Flight arc (origin known) */}
            {hasOrigin && (
              <>
                <path
                  d={`M ${ORIGIN.x} ${ORIGIN.y} Q ${CONTROL.x} ${CONTROL.y} ${DEST.x} ${DEST.y}`}
                  fill="none"
                  stroke="url(#arcStroke)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="5 6"
                  pathLength={100}
                  style={{
                    strokeDashoffset: 100 - Math.min(100, progress * 1.05),
                    transition: "stroke-dashoffset 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                />
                {/* Origin pin */}
                <g transform={`translate(${ORIGIN.x}, ${ORIGIN.y})`}>
                  <circle r="14" fill="white" opacity="0.5" />
                  <circle r="7" fill="white" stroke="hsl(234 62% 47%)" strokeWidth="2" />
                  <circle r="2.5" fill="hsl(234 62% 47%)" />
                </g>
                <text
                  x={ORIGIN.x}
                  y={ORIGIN.y + 30}
                  textAnchor="middle"
                  className="fill-foreground"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {originCity.length > 14 ? originCity.slice(0, 13) + "…" : originCity}
                </text>

                {/* Plane sliding along the arc */}
                <g
                  transform={`translate(${plane.x}, ${plane.y}) rotate(${plane.angle})`}
                  style={{ transition: "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)" }}
                >
                  <circle r="11" fill="white" opacity="0.95" filter="url(#pinShadow)" />
                  <g transform="translate(-7, -7)">
                    {/* inline plane icon */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19.5 2.5 18 1 16 1 14.5 2.5L11 6 2.8 4.2c-.5-.1-.9.1-1.1.5-.2.4-.1.8.3 1.1L8 10l-2 3H3l-1 1 3 2 2 3 1-1v-3l3-2 4.2 6c.3.4.7.5 1.1.3.4-.2.6-.6.5-1.1Z"
                        fill="hsl(234 62% 47%)"
                      />
                    </svg>
                  </g>
                </g>
              </>
            )}

            {/* Pulse ring around destination */}
            <g transform={`translate(${DEST.x}, ${DEST.y})`}>
              <circle r="10" fill="hsl(234 62% 47%)" opacity="0.15">
                <animate
                  attributeName="r"
                  values="10;22;10"
                  dur="2.2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.3;0;0.3"
                  dur="2.2s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle r="9" fill="white" stroke="hsl(234 62% 47%)" strokeWidth="2.5" />
              <circle r="3.5" fill="hsl(234 62% 47%)" />
            </g>

            {/* Destination label */}
            <text
              x={DEST.x}
              y={DEST.y - 18}
              textAnchor="middle"
              className="fill-foreground"
              style={{
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "var(--font-display)",
              }}
            >
              {destinationCity.length > 18
                ? destinationCity.slice(0, 17) + "…"
                : destinationCity}
            </text>

            {/* Activity pins dropping around the destination */}
            {PIN_OFFSETS.map((off, i) => {
              const isActive = i < pinsTarget;
              const label = filled[i]?.name;
              const cx = DEST.x + off.dx;
              const cy = DEST.y + off.dy;
              return (
                <g
                  key={i}
                  className={isActive ? "craft-pin-in" : undefined}
                  style={{
                    opacity: isActive ? 1 : 0,
                    animationDelay: `${i * 110}ms`,
                    transformOrigin: `${cx}px ${cy}px`,
                  }}
                >
                  {/* connector line back to destination */}
                  <line
                    x1={DEST.x}
                    y1={DEST.y}
                    x2={cx}
                    y2={cy}
                    stroke="hsl(234 62% 47%)"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                    opacity="0.35"
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r="8"
                    fill="white"
                    stroke="hsl(234 62% 47%)"
                    strokeWidth="1.5"
                    filter="url(#pinShadow)"
                  />
                  <text
                    x={cx}
                    y={cy + 3.5}
                    textAnchor="middle"
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      fill: "hsl(234 62% 47%)",
                    }}
                  >
                    {i + 1}
                  </text>
                  {label && i < 3 && (
                    <text
                      x={cx}
                      y={cy + 22}
                      textAnchor="middle"
                      className="fill-muted-foreground"
                      style={{
                        fontSize: 9,
                        fontWeight: 500,
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      {label.length > 16 ? label.slice(0, 15) + "…" : label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Progress bar overlay */}
          <div className="absolute bottom-2.5 left-4 right-4">
            <div className="h-1.5 rounded-full bg-foreground/10 overflow-hidden backdrop-blur-sm">
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={{
                  width: `${Math.min(100, Math.max(4, progress))}%`,
                  background:
                    "linear-gradient(90deg, hsl(234 62% 52%), hsl(234 62% 72%))",
                }}
              />
            </div>
          </div>
        </div>

        {/* ─── Activity stream ─── */}
        <div className="px-5 py-4 bg-white">
          {filled.length === 0 ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl bg-muted/40"
                >
                  <div className="w-6 h-6 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 h-3 rounded-full bg-muted relative overflow-hidden">
                    <div
                      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/5 to-transparent"
                      style={{
                        animation: "craft-shimmer 1.5s ease-in-out infinite",
                        animationDelay: `${i * 180}ms`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {filled.slice(0, 6).map((slot, i) => (
                <div
                  key={`${i}-${slot.name}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl border border-border bg-white animate-fade-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
                    }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-sm font-medium text-foreground truncate">
                    {slot.name}
                  </span>
                </div>
              ))}

              {progress < 92 && (
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl border border-dashed border-border bg-muted/20 animate-fade-in">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Finding more…
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Scoped keyframes */}
      <style>{`
        @keyframes craft-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes craft-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(18px, 10px) scale(1.08); }
        }
        @keyframes craft-drift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-14px, -12px) scale(1.12); }
        }
        @keyframes craft-pin-drop {
          0%   { opacity: 0; transform: translateY(-12px) scale(0.6); }
          60%  { opacity: 1; transform: translateY(2px)   scale(1.06); }
          100% { opacity: 1; transform: translateY(0)     scale(1); }
        }
        .craft-pin-in {
          animation: craft-pin-drop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
      `}</style>
    </div>
  );
};

export default PlanCraftingMap;
