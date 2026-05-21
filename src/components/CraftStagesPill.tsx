import { useEffect, useState } from "react";
import { LogoMark } from "@/components/Logo";

const STAGES = [
  "Checking real-time flights",
  "Finding the best neighborhoods",
  "Building your day-by-day",
  "Verifying every venue",
  "Adding local hidden gems",
  "Optimizing your route",
  "Final polish",
];

/** Cycles narrative stages while the AI is streaming — gives the user confidence their plan is being crafted with care. */
const CraftStagesPill: React.FC<{ active: boolean; destination?: string }> = ({ active, destination }) => {
  const [idx, setIdx] = useState(0);
  const [dots, setDots] = useState("");
  useEffect(() => {
    if (!active) return;
    setIdx(0);
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % STAGES.length);
    }, 3200);
    return () => clearInterval(id);
  }, [active]);

  // Animated dots
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return null;
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-primary/20" style={{ background: "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 38%))" }}>
        <LogoMark size={17} color="white" className="animate-spin" style={{ animationDuration: "3s" }} />
      </div>
      <div className="flex flex-col gap-1.5">
        {destination && (
          <span className="text-sm font-semibold text-foreground">
            Crafting your {destination} trip
          </span>
        )}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-primary/[0.06] to-primary/[0.02] border border-primary/15 text-xs self-start">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <span key={idx} className="animate-stage-fade font-medium text-foreground/90">
            {STAGES[idx]}{dots}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CraftStagesPill;
