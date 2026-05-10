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
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* North-star shape (4-pointed star with concave curves) */}
    <path
      d="M16 2.5 C16.5 8 18 13.5 23 15 C28 16.5 28 15.5 29.5 16 C28 16.5 28 15.5 23 17 C18 18.5 16.5 24 16 29.5 C15.5 24 14 18.5 9 17 C4 15.5 4 16.5 2.5 16 C4 15.5 4 16.5 9 15 C14 13.5 15.5 8 16 2.5 Z"
      fill={color}
    />
    {/* Center dot */}
    <circle cx="16" cy="16" r="1.5" fill={color} opacity="0.25" />
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
