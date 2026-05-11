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
}) => {
  const eyeColor = color === "white" ? "#3d52d5" : "white";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Ghost body — slightly tilted, rounded, fills the space */}
      <g transform="rotate(-6 18 18)">
        <path
          d="M18 3C11.373 3 6 8.373 6 15v12.5c0 .6.4.8.8.5.6-.4 1.2.1 1.8.5s1.2.1 1.8-.3c.6-.4 1.2-.1 1.8.3.6.4 1.2.1 1.8-.3.6-.4 1.2-.1 1.8.3.6.4 1.2.1 1.8-.3.6-.4 1.2-.1 1.8.3.6.4 1.2.1 1.8-.3.6-.4 1.2-.1 1.8.3.6.4 1.2.1 1.8-.3.6-.4 1.2-.1 1.8.3.4.3.8.1.8-.5V15c0-6.627-5.373-12-12-12z"
          fill={color}
        />
        {/* Round glasses frame */}
        <circle cx="13.5" cy="16.5" r="3.8" stroke={eyeColor} strokeWidth="1.4" fill="none" />
        <circle cx="22.5" cy="16.5" r="3.8" stroke={eyeColor} strokeWidth="1.4" fill="none" />
        {/* Bridge between glasses */}
        <path d="M17.3 16.5 Q18 15.2 18.7 16.5" stroke={eyeColor} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        {/* Eyes (pupils inside glasses) */}
        <circle cx="14" cy="17" r="1.6" fill={eyeColor} />
        <circle cx="23" cy="17" r="1.6" fill={eyeColor} />
      </g>
    </svg>
  );
};

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
