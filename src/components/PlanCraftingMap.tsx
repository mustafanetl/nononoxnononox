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
 * PlanCraftingMap — a small animated card showing a plane flying from
 * city A to city B with a smooth glowing trail. No hooks, no side effects,
 * no external fetches. Pure render based on props.
 */
const PlanCraftingMap = ({ originCity, destinationCity, progress }: Props) => {
  const from = (originCity || "").trim() || "You";
  const to = (destinationCity || "").trim() || "Destination";
  const safeProgress = typeof progress === "number" && isFinite(progress) ? progress : 10;
  const t = Math.min(0.95, Math.max(0.05, safeProgress / 100));

  // Quadratic bezier
  const P0 = { x: 70, y: 185 };
  const CP = { x: 340, y: 25 };
  const P1 = { x: 620, y: 155 };

  const inv = 1 - t;
  const px = inv * inv * P0.x + 2 * inv * t * CP.x + t * t * P1.x;
  const py = inv * inv * P0.y + 2 * inv * t * CP.y + t * t * P1.y;
  const dx = 2 * inv * (CP.x - P0.x) + 2 * t * (P1.x - CP.x);
  const dy = 2 * inv * (CP.y - P0.y) + 2 * t * (P1.y - CP.y);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  const pathD = `M ${P0.x} ${P0.y} Q ${CP.x} ${CP.y} ${P1.x} ${P1.y}`;

  return (
    <div className="w-full max-w-sm mx-auto animate-fade-in my-4">
      <div
        className="relative rounded-2xl overflow-hidden border border-border"
        style={{ aspectRatio: "16/9", background: "linear-gradient(135deg, #1a1f3d 0%, #0f1225 100%)" }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* SVG flight */}
        <svg viewBox="0 0 700 240" className="relative w-full h-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="tg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="70%" stopColor="rgba(255,255,255,0.7)" />
              <stop offset="100%" stopColor="white" />
            </linearGradient>
            <filter id="gl">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Faint full arc */}
          <path d={pathD} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="6 10" strokeLinecap="round" />

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

          {/* Origin */}
          <circle cx={P0.x} cy={P0.y} r="9" fill="white" opacity="0.9" />
          <circle cx={P0.x} cy={P0.y} r="4" fill="hsl(234 62% 47%)" />
          <text x={P0.x} y={P0.y + 22} textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="var(--font-display), sans-serif">
            {from.length > 12 ? from.slice(0, 11) + "…" : from}
          </text>

          {/* Destination + pulse */}
          <circle cx={P1.x} cy={P1.y} r="14" fill="white" opacity="0.15">
            <animate attributeName="r" values="14;26;14" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.25;0;0.25" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={P1.x} cy={P1.y} r="9" fill="white" opacity="0.9" />
          <circle cx={P1.x} cy={P1.y} r="4" fill="hsl(234 62% 47%)" />
          <text x={P1.x} y={P1.y + 22} textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="var(--font-display), sans-serif">
            {to.length > 14 ? to.slice(0, 13) + "…" : to}
          </text>

          {/* Plane */}
          <g
            transform={`translate(${px}, ${py}) rotate(${angle})`}
            style={{ transition: "transform 1.2s cubic-bezier(0.25, 1, 0.5, 1)" }}
            filter="url(#gl)"
          >
            <circle r="11" fill="white" opacity="0.95" />
            <g transform="translate(-6, -6)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
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
