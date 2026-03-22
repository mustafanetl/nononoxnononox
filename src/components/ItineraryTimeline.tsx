import { useState } from "react";
import { Sun, Sunset, Moon, ChevronDown } from "lucide-react";
import { ItineraryData } from "@/components/ItineraryCard";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const ItineraryTimeline = ({ items }: { items: ItineraryData[] }) => {
  const [openDays, setOpenDays] = useState<number[]>([0]); // first day open by default

  const toggleDay = (idx: number) => {
    setOpenDays((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-[19px] top-8 bottom-4 w-px bg-border" />

      <div className="space-y-0">
        {items.map((item, idx) => {
          const isOpen = openDays.includes(idx);

          return (
            <Collapsible key={idx} open={isOpen} onOpenChange={() => toggleDay(idx)}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center gap-4 py-3 group cursor-pointer">
                  {/* Day circle */}
                  <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                    isOpen
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground group-hover:bg-primary/20"
                  }`}>
                    {item.day}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-sm text-foreground">{item.title}</h3>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="ml-14 mb-4 space-y-3 pb-4">
                  <TimeSlot icon={Sun} color="text-amber-500" label="Morning" text={item.morning} />
                  <TimeSlot icon={Sunset} color="text-orange-500" label="Afternoon" text={item.afternoon} />
                  <TimeSlot icon={Moon} color="text-indigo-400" label="Evening" text={item.evening} />
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
};

const TimeSlot = ({
  icon: Icon,
  color,
  label,
  text,
}: {
  icon: React.ElementType;
  color: string;
  label: string;
  text: string;
}) => (
  <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50">
    <Icon className={`h-4 w-4 ${color} mt-0.5 shrink-0`} />
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-0.5">{label}</p>
      <p className="text-xs text-foreground leading-relaxed">{text}</p>
    </div>
  </div>
);

export default ItineraryTimeline;
