import { useState, useRef } from "react";
import { Sun, Sunset, Moon } from "lucide-react";
import { ItineraryData } from "@/components/ItineraryCard";

type Props = {
  items: ItineraryData[];
  activeDay?: number | null;
  onDayClick?: (day: number) => void;
};

const ItineraryTimeline = ({ items, activeDay, onDayClick }: Props) => {
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const toggleSlot = (key: string) => {
    setExpandedSlot((prev) => (prev === key ? null : key));
  };

  return (
    <div className="space-y-6">
      {items.map((item, idx) => {
        const isActive = activeDay === item.day;
        const dayNum = item.day;

        return (
          <div
            key={idx}
            className={`animate-stagger-in rounded-2xl border transition-all duration-300 ${
              isActive
                ? "border-primary/30 shadow-md animate-glow-pulse"
                : "border-border"
            } bg-card overflow-hidden`}
            style={{ animationDelay: `${idx * 100}ms` }}
            onClick={() => onDayClick?.(dayNum)}
          >
            {/* Day Header */}
            <div
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                isActive ? "bg-primary/5" : "hover:bg-secondary/50"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-300 ${
                  isActive
                    ? "bg-primary text-primary-foreground scale-110"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {dayNum}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-foreground">{item.title}</h3>
              </div>
            </div>

            {/* Time-of-day cards - horizontal scroll */}
            <div
              ref={scrollRef}
              className="flex gap-3 px-4 pb-4 overflow-x-auto scrollbar-hide"
            >
              <TimeCard
                icon={Sun}
                label="Morning"
                text={item.morning}
                gradient="from-amber-500/10 to-orange-500/5"
                iconColor="text-amber-500"
                borderColor="border-amber-500/20"
                expanded={expandedSlot === `${idx}-m`}
                onClick={() => toggleSlot(`${idx}-m`)}
              />
              <TimeCard
                icon={Sunset}
                label="Afternoon"
                text={item.afternoon}
                gradient="from-orange-500/10 to-rose-500/5"
                iconColor="text-orange-500"
                borderColor="border-orange-500/20"
                expanded={expandedSlot === `${idx}-a`}
                onClick={() => toggleSlot(`${idx}-a`)}
              />
              <TimeCard
                icon={Moon}
                label="Evening"
                text={item.evening}
                gradient="from-indigo-500/10 to-purple-500/5"
                iconColor="text-indigo-400"
                borderColor="border-indigo-500/20"
                expanded={expandedSlot === `${idx}-e`}
                onClick={() => toggleSlot(`${idx}-e`)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TimeCard = ({
  icon: Icon,
  label,
  text,
  gradient,
  iconColor,
  borderColor,
  expanded,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  text: string;
  gradient: string;
  iconColor: string;
  borderColor: string;
  expanded: boolean;
  onClick: () => void;
}) => (
  <div
    className={`flex-shrink-0 w-[200px] sm:w-auto sm:flex-1 rounded-xl border ${borderColor} bg-gradient-to-br ${gradient} p-3 cursor-pointer transition-all duration-300 ${
      expanded ? "scale-[1.02] shadow-md" : "hover:scale-[1.01]"
    }`}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
  >
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`h-4 w-4 ${iconColor} shrink-0`} />
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        {label}
      </p>
    </div>
    <p
      className={`text-xs text-foreground leading-relaxed transition-all duration-300 ${
        expanded ? "" : "line-clamp-3"
      }`}
    >
      {text}
    </p>
    {!expanded && text.length > 100 && (
      <span className="text-[10px] text-primary font-medium mt-1 inline-block">
        Tap to read more
      </span>
    )}
  </div>
);

export default ItineraryTimeline;
