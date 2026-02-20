import { Globe, Banknote, Languages, Clock, Sun, ShieldCheck } from "lucide-react";

export interface TravelInfoData {
  destination: string;
  visa: string;
  currency: string;
  language: string;
  timezone: string;
  bestSeason: string;
  safety: string;
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
      <h3 className="text-sm font-semibold mb-3">Travel Info — {info.destination}</h3>
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
