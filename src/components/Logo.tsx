import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "white" | "mark-only" | "mark-white";
  className?: string;
  as?: "div" | "span";
}

const sizeConfig = {
  sm: { mark: "w-7 h-7", icon: 16, text: "text-base", rounded: "rounded-lg" },
  md: { mark: "w-9 h-9", icon: 20, text: "text-xl", rounded: "rounded-xl" },
  lg: { mark: "w-11 h-11", icon: 24, text: "text-2xl", rounded: "rounded-xl" },
  xl: { mark: "w-14 h-14", icon: 30, text: "text-3xl", rounded: "rounded-2xl" },
};

/**
 * Jolliday Logo
 *
 * A 4-pointed north-star / compass rose inside a rounded tile.
 * The star guides travellers — it's our brand's north.
 */
export const LogoMark = ({
  size = 20,
  color = "white",
  className,
}: {
  size?: number;
  color?: string;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Phantom-inspired friendly ghost/spirit shape — rounded top, wavy bottom */}
    <path
      d="M32 8 C18 8 12 18 12 28 L12 44 C12 46 13 47 14.5 46 C16 45 17.5 46 19 47 C20.5 48 22 47 23.5 46 C25 45 26.5 46 28 47 C29.5 48 31 47 32 46 C33 47 34.5 48 36 47 C37.5 46 39 45 40.5 46 C42 47 43.5 48 45 47 C46.5 46 48 45 49.5 46 C51 47 52 46 52 44 L52 28 C52 18 46 8 32 8 Z"
      fill={color}
    />
    {/* Eyes */}
    <circle cx="24" cy="30" r="4.5" fill={color === "white" ? "hsl(234, 62%, 47%)" : "white"} />
    <circle cx="40" cy="30" r="4.5" fill={color === "white" ? "hsl(234, 62%, 47%)" : "white"} />
    {/* Subtle smile */}
    <path
      d="M26 39 Q32 43 38 39"
      stroke={color === "white" ? "hsl(234, 62%, 47%)" : "white"}
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const Logo = ({
  size = "md",
  variant = "default",
  className,
}: LogoProps) => {
  const s = sizeConfig[size];
  const isWhite = variant === "white" || variant === "mark-white";
  const showWordmark = variant !== "mark-only" && variant !== "mark-white";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          s.mark,
          s.rounded,
          "flex items-center justify-center shrink-0 shadow-sm",
          isWhite ? "bg-white" : "bg-primary"
        )}
        style={
          !isWhite
            ? {
                background:
                  "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
              }
            : undefined
        }
      >
        <LogoMark
          size={s.icon}
          color={isWhite ? "hsl(234 62% 47%)" : "white"}
        />
      </div>
      {showWordmark && (
        <span
          className={cn(
            s.text,
            "font-extrabold tracking-tight",
            isWhite ? "text-white" : "text-foreground"
          )}
          style={{ fontFamily: "var(--font-display)" }}
        >
          Jolliday
        </span>
      )}
    </div>
  );
};

export default Logo;
