import { Plane, MapPin } from "lucide-react";

export interface TimelineLeg {
  from: string;
  to: string;
  transport: string;
  duration: string;
  date: string;
}

const TripTimeline = ({ legs }: { legs: TimelineLeg[] }) => {
  if (!legs.length) return null;

  return (
    <div className="mt-4 p-4 bg-card border border-border rounded-2xl">
      <h3 className="text-sm font-semibold mb-4">Trip Route</h3>
      <div className="relative">
        {legs.map((leg, i) => (
          <div key={i} className="flex items-start gap-3 mb-4 last:mb-0">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Plane className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              {i < legs.length - 1 && (
                <div className="w-px h-10 bg-border mt-1" />
              )}
            </div>
            <div className="pt-1">
              <p className="text-sm font-medium">
                {leg.from} → {leg.to}
              </p>
              <p className="text-xs text-muted-foreground">
                {leg.transport} · {leg.duration} · {leg.date}
              </p>
            </div>
          </div>
        ))}
        {/* Final destination dot */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
            <MapPin className="h-3.5 w-3.5 text-accent-foreground" />
          </div>
          <div className="pt-1">
            <p className="text-xs text-muted-foreground">Final destination</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripTimeline;
