import { useEffect, useState } from "react";
import { LogoMark } from "@/components/Logo";

const STAGES = [
  "Scoping the vibe",
  "Picking neighborhoods",
  "Sequencing the days",
  "Pricing it out",
  "Polishing the plan",
];

/** Cycles narrative stages while the AI is streaming — gives the recording a story. */
const CraftStagesPill: React.FC<{ active: boolean }> = ({ active }) => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!active) return;
    setIdx(0);
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % STAGES.length);
    }, 2400);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return null;
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm" style={{ background: "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))" }}>
        <LogoMark size={16} color="white" className="animate-spin" />
      </div>
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground self-start">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span key={idx} className="animate-stage-fade font-medium text-foreground/80">
          {STAGES[idx]}…
        </span>
      </div>
    </div>
  );
};

export default CraftStagesPill;
