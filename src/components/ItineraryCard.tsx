import { Sun, Sunset, Moon } from "lucide-react";

export type ItineraryData = {
  day: number;
  title: string;
  morning: string;
  afternoon: string;
  evening: string;
};

const ItineraryCard = ({ item }: { item: ItineraryData }) => {
  return (
    <div className="min-w-[280px] max-w-[280px] rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
          {item.day}
        </div>
        <h3 className="font-semibold text-sm">{item.title}</h3>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Sun className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">{item.morning}</p>
        </div>
        <div className="flex items-start gap-2">
          <Sunset className="h-3.5 w-3.5 text-orange-500 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">{item.afternoon}</p>
        </div>
        <div className="flex items-start gap-2">
          <Moon className="h-3.5 w-3.5 text-indigo-400 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">{item.evening}</p>
        </div>
      </div>
    </div>
  );
};

export default ItineraryCard;
