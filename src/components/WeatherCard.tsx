import { Thermometer, CloudRain, Sun, Shirt } from "lucide-react";

export interface WeatherData {
  destination: string;
  tempHigh: number;
  tempLow: number;
  conditions: string;
  rainfall: string;
  packingTips: string[];
}

const WeatherCard = ({ weather }: { weather: WeatherData }) => {
  return (
    <div className="mt-4 p-4 bg-card border border-border rounded-2xl">
      <div className="flex items-center gap-2 mb-3">
        <Sun className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold">Weather — {weather.destination}</h3>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-[10px] text-muted-foreground">Temperature</p>
            <p className="text-xs font-medium">{weather.tempLow}°–{weather.tempHigh}°C</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CloudRain className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-[10px] text-muted-foreground">Rainfall</p>
            <p className="text-xs font-medium">{weather.rainfall}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-[10px] text-muted-foreground">Conditions</p>
            <p className="text-xs font-medium">{weather.conditions}</p>
          </div>
        </div>
      </div>
      {weather.packingTips.length > 0 && (
        <div className="flex items-start gap-2 pt-3 border-t border-border">
          <Shirt className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Pack</p>
            <p className="text-xs">{weather.packingTips.join(", ")}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherCard;
