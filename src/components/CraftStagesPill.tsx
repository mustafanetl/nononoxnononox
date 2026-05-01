import { useEffect, useState } from "react";
import { Compass } from "lucide-react";

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
      <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center shrink-0">
        <Compass className="h-4 w-4 text-background animate-spin" style={{ animationDuration: "3s" }} />
      </div>
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground self-start">
        <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-pulse" />
        <span key={idx} className="animate-stage-fade font-medium text-foreground/80">
          {STAGES[idx]}…
        </span>
      </div>
    </div>
  );
};

export default CraftStagesPill;
