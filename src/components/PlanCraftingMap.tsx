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
 * A small, clean card with a real map background showing a plane flying
 * from origin → destination with a smooth glowing trail.
 */
const PlanCraftingMap = ({
  originCity,
  destinationCity,
  destinationPhoto,
  progress,
}: Props) => {
  const from = (originCity || "").trim() || "You";
  const to = (destinationCity || "").trim() || "Destination";

  // Background — prefer a city photo, fall back to a static world map tile
  const stockHero = useCityHeroImage(destinationCity || "");
  const bgImg = destinationPhoto || stockHero;

  // Plane position along the bezier (0 → 1), clamped
  const safeProgress = typeof progress === "number" ? progress : 10;
  const t = Math.min(0.95, Math.max(0.05, safeProgress / 100));

  // Bezier control points
  const P0 = { x: 70, y: 200 };
  const CP = { x: 350, y: 30 };
  const P1 = { x: 630, y: 170 };

  const inv = 1 - t;
  const px = inv * inv * P0.x + 2 * inv * t * CP.x + t * t * P1.x;
  const py = inv * inv * P0.y + 2 * inv * t * CP.y + t * t * P1.y;
  const dx = 2 * inv * (CP.x - P0.x) + 2 * t * (P1.x - CP.x);
  const dy = 2 * inv * (CP.y - P0.y) + 2 * t * (P1.y - CP.y);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  const pathD = `M ${P0.x} ${P0.y} Q ${CP.x} ${CP.y} ${P1.x} ${P1.y}`;

  return (
    <div className="w-full max-w-sm mx-auto animate-fade-in">
      <div className="relative rounded-2xl overflow-hidden shadow-lg border border-border aspect-[16/9]">
        {/* Real map background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: bgImg
              ? `url(${bgImg})`
              : "url(https://basemaps.cartocdn.com/light_all/3/4/2.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.5) saturate(1.2)",
          }}
        />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />

        {/* SVG flight path */}
        <svg
          viewBox="0 0 700 260"
          className="relative w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          <defs>
            <linearGradient id="tg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
              <stop offset="70%" stopColor="rgba(255,255,255,0.8)" />
              <stop offset="100%" stopColor="white" />
            </linearGradient>
            <filter id="gl">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Faint full arc */}
          <path d={pathD} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="6 10" strokeLinecap="round" />

          {/* Revealed trail */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#tg)"
            strokeWidth="3"
            strokeLinecap="round"
            pathLength={100}
            style={{
              strokeDasharray: 100,
              strokeDashoffset: 100 - t * 100,
              transition: "stroke-dashoffset 1.2s cubic-bezier(0.25, 1, 0.5, 1)",
            }}
          />

          {/* Origin dot */}
          <circle cx={P0.x} cy={P0.y} r="10" fill="white" opacity="0.9" />
          <circle cx={P0.x} cy={P0.y} r="4" fill="hsl(234 62% 47%)" />
          <text x={P0.x} y={P0.y + 24} textAnchor="middle" fill="white" style={{ fontSize: 12, fontWeight: 700 }}>
            {from.length > 12 ? from.slice(0, 11) + "…" : from}
          </text>

          {/* Destination dot + pulse */}
          <circle cx={P1.x} cy={P1.y} r="14" fill="white" opacity="0.2">
            <animate attributeName="r" values="14;26;14" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={P1.x} cy={P1.y} r="10" fill="white" opacity="0.9" />
          <circle cx={P1.x} cy={P1.y} r="4" fill="hsl(234 62% 47%)" />
          <text x={P1.x} y={P1.y + 24} textAnchor="middle" fill="white" style={{ fontSize: 12, fontWeight: 700 }}>
            {to.length > 14 ? to.slice(0, 13) + "…" : to}
          </text>

          {/* Plane */}
          <g
            transform={`translate(${px}, ${py}) rotate(${angle})`}
            style={{ transition: "transform 1.2s cubic-bezier(0.25, 1, 0.5, 1)" }}
            filter="url(#gl)"
          >
            <circle r="12" fill="white" opacity="0.95" />
            <g transform="translate(-7, -7)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19.5 2.5 18 1 16 1 14.5 2.5L11 6 2.8 4.2c-.5-.1-.9.1-1.1.5-.2.4-.1.8.3 1.1L8 10l-2 3H3l-1 1 3 2 2 3 1-1v-3l3-2 4.2 6c.3.4.7.5 1.1.3.4-.2.6-.6.5-1.1Z" fill="hsl(234 62% 47%)" />
              </svg>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default PlanCraftingMap;
