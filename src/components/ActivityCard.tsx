import { Clock, DollarSign, Heart, Utensils, Camera, Mountain, Music, Palette, ShoppingBag, Waves } from "lucide-react";

export type ActivityData = {
  id: string;
  name: string;
  category: string;
  duration: string;
  price: number;
  currency: string;
  image: string;
  occasion: string;
  description: string;
  lat?: number;
  lng?: number;
  realPhoto?: string;
  isReal?: boolean;
};

const categoryIcons: Record<string, React.ElementType> = {
  dining: Utensils,
  adventure: Mountain,
  beach: Waves,
  culture: Palette,
  nightlife: Music,
  shopping: ShoppingBag,
  sightseeing: Camera,
  romance: Heart,
};

const imageMap: Record<string, string[]> = {
  cruise: [
    "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1599640842225-85d111c60e6b?w=400&h=250&fit=crop",
  ],
  spa: [
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=400&h=250&fit=crop",
  ],
  temple: [
    "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=250&fit=crop",
  ],
  beach: [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1476673160081-cf065607f449?w=400&h=250&fit=crop",
  ],
  hiking: [
    "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=400&h=250&fit=crop",
  ],
  market: [
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&h=250&fit=crop",
  ],
  museum: [
    "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=400&h=250&fit=crop",
  ],
  diving: [
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&h=250&fit=crop",
  ],
  safari: [
    "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=400&h=250&fit=crop",
  ],
  concert: [
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop",
  ],
  food: [
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=250&fit=crop",
  ],
  waterfall: [
    "https://images.unsplash.com/photo-1432405972618-c6b0cfba8673?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1494472155656-f34e81b17ddc?w=400&h=250&fit=crop",
  ],
  yoga: [
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=250&fit=crop",
  ],
  shopping: [
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=250&fit=crop",
  ],
  sunset: [
    "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=400&h=250&fit=crop",
    "https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=400&h=250&fit=crop",
  ],
  wine: [
    "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=250&fit=crop",
  ],
  cooking: [
    "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=250&fit=crop",
  ],
  gardens: [
    "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=250&fit=crop",
  ],
  nightlife: [
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=250&fit=crop",
  ],
  ruins: [
    "https://images.unsplash.com/photo-1555921015-5532091f6026?w=400&h=250&fit=crop",
  ],
};

const hashName = (name: string): number => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const fallbackImages = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&h=250&fit=crop",
  "https://images.unsplash.com/photo-1476673160081-cf065607f449?w=400&h=250&fit=crop",
];

const getActivityImage = (imageKey: string, name: string): string => {
  const pool = imageMap[imageKey];
  if (pool) return pool[hashName(name) % pool.length];
  return fallbackImages[hashName(name) % fallbackImages.length];
};

const occasionLabels: Record<string, string> = {
  honeymoon: "Honeymoon",
  birthday: "Birthday",
  family: "Family",
  solo: "Solo",
  friends: "Friends",
  anniversary: "Anniversary",
};

const ActivityCard = ({ activity, onClick }: { activity: ActivityData; onClick: () => void }) => {
  const Icon = categoryIcons[activity.category] || Camera;
  const imgUrl = activity.realPhoto || getActivityImage(activity.image, activity.name);
  const occasionLabel = occasionLabels[activity.occasion] || activity.occasion;

  return (
    <div
      onClick={onClick}
      className="min-w-[260px] max-w-[260px] rounded-2xl border border-border bg-card overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
    >
      <div className="relative h-36">
        <img src={imgUrl} alt={activity.name} className="w-full h-full object-cover" />
        <div className="absolute top-2 left-2 flex items-center gap-1">
          <span className="px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm text-[10px] font-medium">
            {occasionLabel}
          </span>
          {activity.isReal && (
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/90 backdrop-blur-sm text-[9px] font-medium text-white">
              Real
            </span>
          )}
        </div>
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-start gap-2">
          <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <h3 className="font-semibold text-sm leading-tight">{activity.name}</h3>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {activity.duration}
          </span>
          <span className="flex items-center gap-1 font-semibold text-foreground">
            <DollarSign className="h-3 w-3" />
            {activity.currency}{activity.price}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;
