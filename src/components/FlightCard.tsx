import { Plane, Clock, Calendar, ArrowRight } from "lucide-react";

export interface FlightData {
  id: string;
  airline: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  currency: string;
  stops: number;
  date: string;
}

interface FlightCardProps {
  flight: FlightData;
}

const FlightCard = ({ flight }: FlightCardProps) => {
  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Plane className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">{flight.airline}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{flight.date}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">{flight.departureTime}</p>
          <p className="text-xs text-muted-foreground uppercase">{flight.from}</p>
        </div>

        <div className="flex-1 flex flex-col items-center px-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Clock className="h-3 w-3" />
            <span>{flight.duration}</span>
          </div>
          <div className="w-full flex items-center gap-1">
            <div className="h-[2px] flex-1 bg-border" />
            <ArrowRight className="h-3 w-3 text-primary" />
            <div className="h-[2px] flex-1 bg-border" />
          </div>
          <span className="text-xs text-muted-foreground mt-1">
            {flight.stops === 0 ? "Direct" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
          </span>
        </div>

        <div className="text-center">
          <p className="text-lg font-bold text-foreground">{flight.arrivalTime}</p>
          <p className="text-xs text-muted-foreground uppercase">{flight.to}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">Round trip</span>
        <div className="text-right">
          <span className="text-xl font-bold text-primary">
            {flight.currency}{flight.price}
          </span>
          <span className="text-xs text-muted-foreground ml-1">/person</span>
        </div>
      </div>
    </div>
  );
};

export default FlightCard;
