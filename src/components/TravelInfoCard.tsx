import { Globe, Banknote, Languages, Clock, ShieldCheck, Wifi, ArrowLeftRight, Coins, Smartphone, Train } from "lucide-react";

export interface TravelInfoData {
  destination: string;
  visa: string;
  currency: string;
  language: string;
  timezone: string;
  tipping?: string;
  simCard?: string;
  transport?: string;
  exchangeRate?: string;
  isLive?: boolean;
  // Legacy fields (kept for backward compat but not displayed)
  bestSeason?: string;
  safety?: string;
}

const infoItems = [
  { key: "visa" as const, icon: ShieldCheck, label: "Visa" },
  { key: "currency" as const, icon: Banknote, label: "Currency" },
  { key: "exchangeRate" as const, icon: ArrowLeftRight, label: "Exchange Rate" },
  { key: "language" as const, icon: Languages, label: "Language" },
  { key: "timezone" as const, icon: Clock, label: "Timezone" },
  { key: "tipping" as const, icon: Coins, label: "Tipping" },
  { key: "simCard" as const, icon: Smartphone, label: "SIM / Data" },
  { key: "transport" as const, icon: Train, label: "Getting Around" },
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
        {infoItems.map(({ key, icon: Icon, label }) => {
          const value = info[key];
          if (!value) return null;
          return (
            <div key={key} className={`flex items-start gap-2 ${(key === "simCard" || key === "transport") ? "col-span-2" : ""}`}>
              <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                <p className="text-xs font-medium">{value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TravelInfoCard;
