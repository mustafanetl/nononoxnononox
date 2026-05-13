import { useEffect, useMemo, useRef, useState } from "react";
import { LogoMark } from "@/components/Logo";
import { useCityHeroImage } from "@/hooks/useCityHeroImage";

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
   PlanCraftingMap — "Your plan is being built"

   A full-bleed animated world map with a plane flying from
   origin → destination, drawing a smooth trail behind it.
   The plane moves along a great-circle-style arc, and the
   trail is revealed progressively tied to the crafting progress.

   Below the map: activity stream list with shimmer placeholders
   that animate in as venue names arrive from the AI.
   ───────────────────────────────────────────────────────────── */

const STAGES = [
  "Locking in the vibe",
  "Scouting neighborhoods",
  "Picking iconic stops",
  "Sequencing the days",
  "Booking the details",
  "Polishing the plan",
];

const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

const PlanCraftingMap = ({
  originCity,
  destinationCity,
  activities,
  destinationPhoto,
  progress,
}: Props) => {
  const hasOrigin = !!originCity?.trim();
  const hasDestination = !!destinationCity?.trim();
  const filled = useMemo(
    () => activities.filter((a) => a.name?.trim()),
    [activities],
  );

  // City hero for ambient background
  const stockHero = useCityHeroImage(destinationCity);
  const heroImg = destinationPhoto || stockHero;

  // Typewriter for destination name
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
    const id = setInterval(() => setStageIdx((i) => (i + 1) % STAGES.length), 2000);
    return () => clearInterval(id);
  }, []);

  // Normalized progress for the plane (0 → 1)
  const t = Math.min(1, Math.max(0, progress / 100));

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <div className="rounded-3xl border border-border bg-white shadow-xl overflow-hidden">
        {/* ─── Header ─── */}
        <div
          className="relative px-5 pt-5 pb-4 overflow-hidden text-white"
          style={{
            background:
              "linear-gradient(135deg, hsl(234 62% 48%) 0%, hsl(234 62% 34%) 100%)",
          }}
        >
          <div
            className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl"
            style={{ animation: "craft-drift 7s ease-in-out infinite" }}
          />
          <div
            className="absolute -bottom-24 -left-12 w-44 h-44 rounded-full bg-white/5 blur-2xl"
            style={{ animation: "craft-drift2 9s ease-in-out infinite" }}
          />

          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-md bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <LogoMark size={14} color="white" className="animate-spin" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-white/85 font-semibold">
                  Crafting your plan
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight leading-tight truncate">
                {hasOrigin && (
                  <span className="text-white/70 font-medium">
                    {truncate(originCity, 14)}{" "}
                    <span className="mx-1 opacity-70">→</span>{" "}
                  </span>
                )}
                <span>{typed || "\u00A0"}</span>
                <span className="inline-block w-0.5 h-5 bg-white/70 ml-0.5 animate-pulse align-middle" />
              </h2>
              <p
                key={stageIdx}
                className="mt-1 text-xs text-white/85 animate-stage-fade font-medium"
              >
                {STAGES[stageIdx]}…
              </p>
            </div>

            <div className="shrink-0 text-right" aria-label={`${Math.round(progress)}% complete`}>
              <div className="text-2xl font-bold tabular-nums leading-none">
                {Math.round(progress)}
                <span className="text-sm opacity-70">%</span>
              </div>
              <div className="mt-1 text-[9px] uppercase tracking-[0.25em] text-white/70">
                built
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative mt-3 h-1 rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-out"
              style={{
                width: `${Math.min(100, Math.max(4, progress))}%`,
                background: "linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.75) 100%)",
                boxShadow: "0 0 12px rgba(255,255,255,0.6)",
              }}
            />
          </div>
        </div>

        {/* ─── Map with flying plane ─── */}
        <div className="relative h-52 sm:h-60 overflow-hidden bg-[hsl(234,30%,96%)]">
          {/* Ambient city photo */}
          {heroImg && (
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none opacity-25"
              style={{
                backgroundImage: `url(${heroImg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(3px) saturate(1.2)",
                animation: "craft-zoom 20s ease-in-out infinite alternate",
              }}
            />
          )}
          {/* White wash for readability */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.88) 100%)",
            }}
          />
          {/* Dot grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-50"
            style={{
              backgroundImage: "radial-gradient(hsl(234 30% 70% / 0.4) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />

          {/* SVG flight path */}
          <svg
            viewBox="0 0 480 220"
            className="relative block w-full h-full"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={`Flight from ${originCity} to ${destinationCity}`}
            style={{ fontFamily: "var(--font-display), 'Plus Jakarta Sans', 'Inter', sans-serif" }}
          >
            <defs>
              <linearGradient id="trailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(234, 62%, 55%)" stopOpacity="0.3" />
                <stop offset="80%" stopColor="hsl(234, 62%, 50%)" stopOpacity="0.9" />
                <stop offset="100%" stopColor="hsl(234, 62%, 47%)" stopOpacity="1" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Ghost path (full arc, very faint) */}
            {hasOrigin && (
              <path
                d="M 60 155 Q 240 20 420 135"
                fill="none"
                stroke="hsl(234 62% 47% / 0.12)"
                strokeWidth="2"
                strokeDasharray="6 8"
                strokeLinecap="round"
              />
            )}

            {/* Revealed trail — drawn behind the plane as it flies */}
            {hasOrigin && (
              <path
                d="M 60 155 Q 240 20 420 135"
                fill="none"
                stroke="url(#trailGrad)"
                strokeWidth="3"
                strokeLinecap="round"
                pathLength={100}
                filter="url(#glow)"
                style={{
                  strokeDasharray: 100,
                  strokeDashoffset: Math.max(0, 100 - t * 100),
                  transition: "stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
            )}

            {/* Origin pin */}
            {hasOrigin && (
              <g className="craft-pin-in" style={{ animationDelay: "0ms" }}>
                <circle cx="60" cy="155" r="16" fill="white" opacity="0.6" />
                <circle cx="60" cy="155" r="8" fill="white" stroke="hsl(234 62% 47%)" strokeWidth="2.5" />
                <circle cx="60" cy="155" r="3" fill="hsl(234 62% 47%)" />
                <text x="60" y="182" textAnchor="middle" style={{ fontSize: 11, fontWeight: 700, fill: "hsl(234 62% 30%)" }}>
                  {truncate(originCity, 14)}
                </text>
              </g>
            )}

            {/* Destination pin with pulse */}
            <g className="craft-pin-in" style={{ animationDelay: "200ms" }}>
              {/* Pulse rings */}
              <circle cx="420" cy="135" r="12" fill="hsl(234 62% 47%)" opacity="0.2">
                <animate attributeName="r" values="12;28;12" dur="2.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0;0.3" dur="2.2s" repeatCount="indefinite" />
              </circle>
              <circle cx="420" cy="135" r="12" fill="hsl(234 62% 47%)" opacity="0.1">
                <animate attributeName="r" values="12;22;12" dur="2.2s" begin="0.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0;0.2" dur="2.2s" begin="0.4s" repeatCount="indefinite" />
              </circle>
              <circle cx="420" cy="135" r="10" fill="white" stroke="hsl(234 62% 47%)" strokeWidth="3" />
              <circle cx="420" cy="135" r="4" fill="hsl(234 62% 47%)" />
              <text x="420" y="115" textAnchor="middle" style={{ fontSize: 12, fontWeight: 800, fill: "hsl(234 62% 30%)" }}>
                {truncate(destinationCity, 16)}
              </text>
            </g>

            {/* ✈ Plane — flies along the arc */}
            {hasOrigin && (
              <g style={{ transition: "transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)" }}>
                <PlaneOnArc t={t} />
              </g>
            )}
          </svg>
        </div>

        {/* ─── Activity stream ─── */}
        <div className="px-5 py-4 bg-white">
          {filled.length === 0 ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl bg-muted/40 animate-fade-in"
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                  <div className="w-6 h-6 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 h-3 rounded-full bg-muted relative overflow-hidden">
                    <div
                      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
                      style={{
                        animation: "craft-shimmer 1.4s ease-in-out infinite",
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
                      background: "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
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
                  <span className="text-xs text-muted-foreground">Finding more…</span>
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
        @keyframes craft-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.08); }
        }
        @keyframes craft-pin-drop {
          0%   { opacity: 0; transform: translateY(-14px) scale(0.5); }
          60%  { opacity: 1; transform: translateY(2px)   scale(1.05); }
          100% { opacity: 1; transform: translateY(0)     scale(1); }
        }
        .craft-pin-in {
          animation: craft-pin-drop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
      `}</style>
    </div>
  );
};

/* ─── Plane component that follows the quadratic bezier arc ─── */
function PlaneOnArc({ t }: { t: number }) {
  // Quadratic bezier: P0(60,155) C(240,20) P1(420,135)
  const P0 = { x: 60, y: 155 };
  const C = { x: 240, y: 20 };
  const P1 = { x: 420, y: 135 };

  const inv = 1 - t;
  const x = inv * inv * P0.x + 2 * inv * t * C.x + t * t * P1.x;
  const y = inv * inv * P0.y + 2 * inv * t * C.y + t * t * P1.y;

  // Tangent for rotation
  const dx = 2 * inv * (C.x - P0.x) + 2 * t * (P1.x - C.x);
  const dy = 2 * inv * (C.y - P0.y) + 2 * t * (P1.y - C.y);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${angle})`}
      style={{ transition: "transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)" }}
    >
      {/* Glow behind the plane */}
      <circle r="14" fill="hsl(234 62% 47%)" opacity="0.15" />
      <circle r="10" fill="white" filter="url(#glow)" />
      {/* Plane icon */}
      <g transform="translate(-8, -8)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19.5 2.5 18 1 16 1 14.5 2.5L11 6 2.8 4.2c-.5-.1-.9.1-1.1.5-.2.4-.1.8.3 1.1L8 10l-2 3H3l-1 1 3 2 2 3 1-1v-3l3-2 4.2 6c.3.4.7.5 1.1.3.4-.2.6-.6.5-1.1Z"
            fill="hsl(234 62% 47%)"
          />
        </svg>
      </g>
    </g>
  );
}

export default PlanCraftingMap;
