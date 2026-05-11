import { useEffect, useMemo, useRef, useState } from "react";
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

const PlanCraftingMap = ({ destinationCity, activities, progress }: Props) => {
  const hasDestination = !!destinationCity?.trim();
  const filledSlots = useMemo(
    () => activities.filter((a) => a.name?.trim()),
    [activities]
  );

  // Typewriter for destination
  const target = hasDestination ? destinationCity : "Planning";
  const [typed, setTyped] = useState(target);
  const lastTargetRef = useRef("");
  useEffect(() => {
    if (target === lastTargetRef.current) return;
    lastTargetRef.current = target;
    setTyped("");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(target.slice(0, i));
      if (i >= target.length) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <div className="rounded-3xl border border-border bg-white shadow-xl overflow-hidden">
        {/* Header — gradient with logo */}
        <div
          className="relative px-6 pt-8 pb-6 text-center overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 38%))",
          }}
        >
          {/* Subtle animated orb */}
          <div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl"
            style={{ animation: "drift1 6s ease-in-out infinite" }}
          />

          {/* Logo spinning */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <LogoMark
                size={28}
                color="white"
                className="animate-spin"
              />
            </div>
          </div>

          {/* Destination name */}
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {typed}
            <span className="inline-block w-0.5 h-5 bg-white/70 ml-0.5 animate-pulse align-middle" />
          </h2>

          {/* Progress dots */}
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-white/40"
                style={{
                  animation: "pulse 1.4s ease-in-out infinite",
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Activity stream */}
        <div className="px-5 py-4">
          {filledSlots.length === 0 ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/40"
                >
                  <div className="w-6 h-6 rounded-full bg-muted animate-pulse shrink-0" />
                  <div
                    className="flex-1 h-3 rounded-full bg-muted relative overflow-hidden"
                  >
                    <div
                      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/5 to-transparent"
                      style={{
                        animation: "shimmer 1.5s ease-in-out infinite",
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filledSlots.slice(0, 6).map((slot, i) => (
                <div
                  key={`${i}-${slot.name}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-white animate-fade-in"
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

              {/* "Finding more..." indicator */}
              {progress < 90 && (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-dashed border-border bg-muted/20 animate-fade-in">
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

      {/* Inline keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes drift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(15px, 8px) scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default PlanCraftingMap;
