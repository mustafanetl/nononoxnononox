import { Thermometer, CloudRain, Sun, Shirt, Wifi } from "lucide-react";

export interface ForecastDay {
  date: string;
  high: number;
  low: number;
  precipitation: number;
  condition: string;
}

export interface WeatherData {
  destination: string;
  tempHigh: number;
  tempLow: number;
  conditions: string;
  rainfall: string;
  packingTips: string[];
  forecast?: ForecastDay[];
  isLive?: boolean;
}

const WeatherCard = ({ weather }: { weather: WeatherData }) => {
  return (
    <div className="mt-4 p-4 bg-card border border-border rounded-2xl">
      <div className="flex items-center gap-2 mb-3">
        <Sun className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold">Weather — {weather.destination}</h3>
        {weather.isLive && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full">
            <Wifi className="h-2.5 w-2.5" /> Live
          </span>
        )}
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
      {weather.forecast && weather.forecast.length > 0 && (
        <div className="pt-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">7-Day Forecast</p>
          <div className="grid grid-cols-7 gap-1">
            {weather.forecast.slice(0, 7).map((day) => (
              <div key={day.date} className="text-center space-y-0.5">
                <p className="text-[9px] text-muted-foreground">{new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}</p>
                <p className="text-[10px] font-medium">{day.high}°</p>
                <p className="text-[9px] text-muted-foreground">{day.low}°</p>
                {day.precipitation > 0 && (
                  <p className="text-[8px] text-blue-500">{day.precipitation}mm</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
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
