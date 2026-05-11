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
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* 
      Phantom-style ghost: fills the viewBox properly.
      Smooth dome, body fills width, 3 rounded legs at bottom.
      Centered and balanced.
    */}
    <path
      d="M20 4C12.268 4 6 10.268 6 18v13.5c0 .8.6 1.1 1.2.7.9-.6 1.8-.1 2.7.5.6.4 1.2.4 1.8 0l1.3-.9c.6-.4 1.2-.4 1.8 0l1.3.9c.6.4 1.2.4 1.8 0l1.3-.9c.6-.4 1.2-.4 1.8 0l1.3.9c.6.4 1.2.4 1.8 0l1.3-.9c.6-.4 1.2-.4 1.8 0l1.3.9c.6.4 1.2.4 1.8 0 .9-.6 1.8-1.1 2.7-.5.6.4 1.2.1 1.2-.7V18c0-7.732-6.268-14-14-14z"
      fill={color}
    />
    <circle cx="15" cy="20" r="2.5" fill={color === "white" ? "#3d52d5" : "white"} />
    <circle cx="25" cy="20" r="2.5" fill={color === "white" ? "#3d52d5" : "white"} />
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
