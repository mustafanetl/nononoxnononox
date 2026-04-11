import { Clock, MapPin, Ticket, ArrowRight } from "lucide-react";

export type ItinerarySlot = {
  time: string;
  activity: string;
  venue: string;
  neighborhood: string;
  duration: string;
  cost: number;
  bookAhead: boolean;
  transitNext: string;
};

export type ItineraryData = {
  day: number;
  title: string;
  // New slot-based format
  slots?: ItinerarySlot[];
  // Legacy format fallback
  morning?: string;
  afternoon?: string;
  evening?: string;
};

const ItineraryCard = ({ item }: { item: ItineraryData }) => {
  const hasSlots = item.slots && item.slots.length > 0;

  if (!hasSlots) {
    // Legacy fallback for old format
    return (
      <div className="min-w-[280px] max-w-[280px] rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            {item.day}
          </div>
          <h3 className="font-semibold text-sm">{item.title}</h3>
        </div>
        <div className="space-y-2 text-xs text-muted-foreground">
          {item.morning && <p>🌅 {item.morning}</p>}
          {item.afternoon && <p>☀️ {item.afternoon}</p>}
          {item.evening && <p>🌙 {item.evening}</p>}
        </div>
      </div>
    );
  }

  const dayTotal = item.slots!.reduce((sum, s) => sum + (s.cost || 0), 0);

  return (
    <div className="min-w-[300px] max-w-[300px] rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            {item.day}
          </div>
          <h3 className="font-semibold text-sm">{item.title}</h3>
        </div>
        {dayTotal > 0 && (
          <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            ~${dayTotal}/pp
          </span>
        )}
      </div>

      <div className="space-y-1">
        {item.slots!.map((slot, idx) => (
          <div key={idx}>
            <div className="flex items-start gap-2 py-1.5">
              <span className="text-[10px] font-mono text-muted-foreground w-10 shrink-0 pt-0.5">{slot.time}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-foreground truncate">{slot.venue}</p>
                  {slot.bookAhead && (
                    <Ticket className="h-3 w-3 text-amber-500 shrink-0" title="Book ahead" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <MapPin className="h-2.5 w-2.5" /> {slot.neighborhood}
                  </span>
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Clock className="h-2.5 w-2.5" /> {slot.duration}
                  </span>
                  {slot.cost > 0 && (
                    <span className="text-[10px] font-semibold text-foreground">${slot.cost}</span>
                  )}
                </div>
              </div>
            </div>
            {slot.transitNext && slot.transitNext !== "—" && idx < item.slots!.length - 1 && (
              <div className="flex items-center gap-1.5 ml-10 py-0.5">
                <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/50" />
                <span className="text-[9px] text-muted-foreground/60 italic">{slot.transitNext}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ItineraryCard;
