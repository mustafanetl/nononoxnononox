import { useEffect, useMemo, useRef, useState } from "react";
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

/**
 * PlanCraftingMap
 *
 * A clean, full-width animated map showing a plane flying from city A to
 * city B, drawing a smooth glowing trail behind it. Nothing else — no
 * lists, no stats, no text clutter. Just the map, the arc, and the plane.
 *
 * The plane position is driven by `progress` (0–100). The trail is drawn
 * via an SVG path with animated stroke-dashoffset so it reveals smoothly
 * behind the plane as it moves.
 */
const PlanCraftingMap = ({
  originCity,
  destinationCity,
  destinationPhoto,
  progress,
}: Props) => {
  const from = originCity?.trim() || "You";
  const to = destinationCity?.trim() || "Destination";

  // Background city image
  const stockHero = useCityHeroImage(destinationCity);
  const bgImg = destinationPhoto || stockHero;

  // Plane position along the bezier (0 → 1)
  const t = Math.min(0.97, Math.max(0.03, progress / 100));

  // Bezier points
  const P0 = { x: 80, y: 260 };
  const CP = { x: 400, y: 30 };
  const P1 = { x: 720, y: 220 };

  const inv = 1 - t;
  const px = inv * inv * P0.x + 2 * inv * t * CP.x + t * t * P1.x;
  const py = inv * inv * P0.y + 2 * inv * t * CP.y + t * t * P1.y;

  // Tangent for rotation
  const dx = 2 * inv * (CP.x - P0.x) + 2 * t * (P1.x - CP.x);
  const dy = 2 * inv * (CP.y - P0.y) + 2 * t * (P1.y - CP.y);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  const pathD = `M ${P0.x} ${P0.y} Q ${CP.x} ${CP.y} ${P1.x} ${P1.y}`;

  return (
    <div className="w-full max-w-lg mx-auto animate-fade-in">
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border aspect-[16/10]">
        {/* Background — blurred city photo */}
        {bgImg && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${bgImg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(6px) brightness(0.55) saturate(1.3)",
              transform: "scale(1.1)",
            }}
          />
        )}
        {!bgImg && (
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(234,50%,20%)] to-[hsl(234,40%,10%)]" />
        )}

        {/* Subtle overlay for depth */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* SVG flight animation */}
        <svg
          viewBox="0 0 800 340"
          className="relative w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="trail-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="60%" stopColor="rgba(255,255,255,0.7)" />
              <stop offset="100%" stopColor="white" />
            </linearGradient>
            <filter id="plane-glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="pin-shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.4)" />
            </filter>
          </defs>

          {/* Ghost arc — full path, very subtle */}
          <path
            d={pathD}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="2"
            strokeDasharray="8 12"
            strokeLinecap="round"
          />

          {/* Revealed trail — glowing line drawn behind the plane */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#trail-grad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            pathLength={100}
            style={{
              strokeDasharray: 100,
              strokeDashoffset: 100 - t * 100,
              transition: "stroke-dashoffset 1s cubic-bezier(0.25, 1, 0.5, 1)",
            }}
          />

          {/* Origin pin */}
          <g filter="url(#pin-shadow)">
            <circle cx={P0.x} cy={P0.y} r="14" fill="white" />
            <circle cx={P0.x} cy={P0.y} r="6" fill="hsl(234 62% 47%)" />
          </g>
          <text
            x={P0.x}
            y={P0.y + 32}
            textAnchor="middle"
            fill="white"
            style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-display)" }}
          >
            {from.length > 12 ? from.slice(0, 11) + "…" : from}
          </text>

          {/* Destination pin with pulse */}
          <circle cx={P1.x} cy={P1.y} r="18" fill="white" opacity="0.2">
            <animate attributeName="r" values="18;32;18" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
          <g filter="url(#pin-shadow)">
            <circle cx={P1.x} cy={P1.y} r="14" fill="white" />
            <circle cx={P1.x} cy={P1.y} r="6" fill="hsl(234 62% 47%)" />
          </g>
          <text
            x={P1.x}
            y={P1.y + 32}
            textAnchor="middle"
            fill="white"
            style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-display)" }}
          >
            {to.length > 14 ? to.slice(0, 13) + "…" : to}
          </text>

          {/* ✈ Plane */}
          <g
            transform={`translate(${px}, ${py}) rotate(${angle})`}
            style={{ transition: "transform 1s cubic-bezier(0.25, 1, 0.5, 1)" }}
            filter="url(#plane-glow)"
          >
            <circle r="16" fill="white" opacity="0.9" />
            <g transform="translate(-10, -10)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19.5 2.5 18 1 16 1 14.5 2.5L11 6 2.8 4.2c-.5-.1-.9.1-1.1.5-.2.4-.1.8.3 1.1L8 10l-2 3H3l-1 1 3 2 2 3 1-1v-3l3-2 4.2 6c.3.4.7.5 1.1.3.4-.2.6-.6.5-1.1Z"
                  fill="hsl(234 62% 47%)"
                />
              </svg>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default PlanCraftingMap;
