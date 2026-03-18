import { useState } from "react";
import { CheckSquare, Square, Luggage } from "lucide-react";

interface PackingListProps {
  items: string[];
}

const PackingList = ({ items }: PackingListProps) => {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (index: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  if (items.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Luggage className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Packing Checklist</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {checked.size}/{items.length}
        </span>
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className="flex items-center gap-2 w-full text-left text-sm hover:bg-muted/50 rounded-lg px-2 py-1.5 transition-colors"
          >
            {checked.has(i) ? (
              <CheckSquare className="h-4 w-4 text-primary shrink-0" />
            ) : (
              <Square className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className={checked.has(i) ? "line-through text-muted-foreground" : ""}>
              {item}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PackingList;
