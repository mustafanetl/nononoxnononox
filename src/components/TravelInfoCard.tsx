import { Globe, Banknote, Languages, Clock, Sun, ShieldCheck, Wifi } from "lucide-react";

export interface TravelInfoData {
  destination: string;
  visa: string;
  currency: string;
  language: string;
  timezone: string;
  bestSeason: string;
  safety: string;
  exchangeRate?: string;
  isLive?: boolean;
}

const infoItems = [
  { key: "visa" as const, icon: ShieldCheck, label: "Visa" },
  { key: "currency" as const, icon: Banknote, label: "Currency" },
  { key: "language" as const, icon: Languages, label: "Language" },
  { key: "timezone" as const, icon: Clock, label: "Timezone" },
  { key: "bestSeason" as const, icon: Sun, label: "Best Season" },
  { key: "safety" as const, icon: Globe, label: "Safety" },
];

const TravelInfoCard = ({ info }: { info: TravelInfoData }) => {
  return (
    <div className="mt-4 p-4 bg-card border border-border rounded-2xl">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold">Travel Info — {info.destination}</h3>
        {info.isLive && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full">
            <Wifi className="h-2.5 w-2.5" /> Live
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {infoItems.map(({ key, icon: Icon, label }) => (
          <div key={key} className="flex items-start gap-2">
            <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
              <p className="text-xs font-medium">{info[key]}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TravelInfoCard;
