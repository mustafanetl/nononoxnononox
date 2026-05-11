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
    <path
      d="M32 12 C32.7 20.5 34.8 28.4 41.8 30.4 C48.8 32.4 48.8 31.2 50.8 32 C48.8 32.8 48.8 31.6 41.8 33.6 C34.8 35.6 32.7 43.5 32 52 C31.3 43.5 29.2 35.6 22.2 33.6 C15.2 31.6 15.2 32.8 13.2 32 C15.2 31.2 15.2 32.4 22.2 30.4 C29.2 28.4 31.3 20.5 32 12 Z"
      fill={color}
    />
    <circle cx="32" cy="32" r="2" fill={color} opacity="0.35" />
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
