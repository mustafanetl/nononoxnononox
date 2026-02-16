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

const imageMap: Record<string, string> = {
  cruise: "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=400&h=250&fit=crop",
  spa: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=250&fit=crop",
  temple: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=250&fit=crop",
  beach: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=250&fit=crop",
  hiking: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=250&fit=crop",
  market: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=250&fit=crop",
  museum: "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=400&h=250&fit=crop",
  diving: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=250&fit=crop",
  safari: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400&h=250&fit=crop",
  concert: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop",
  food: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=250&fit=crop",
  waterfall: "https://images.unsplash.com/photo-1432405972618-c6b0cfba8673?w=400&h=250&fit=crop",
  yoga: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=250&fit=crop",
  shopping: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=250&fit=crop",
  sunset: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=400&h=250&fit=crop",
};

const occasionLabels: Record<string, string> = {
  honeymoon: "Perfect for honeymoons 💕",
  birthday: "Great for birthdays 🎂",
  family: "Family-friendly 👨‍👩‍👧‍👦",
  solo: "Solo adventure 🎒",
  friends: "Fun with friends 🎉",
  anniversary: "Anniversary special 💍",
};

const ActivityCard = ({ activity, onClick }: { activity: ActivityData; onClick: () => void }) => {
  const Icon = categoryIcons[activity.category] || Camera;
  const imgUrl = imageMap[activity.image] || imageMap.beach;
  const occasionLabel = occasionLabels[activity.occasion] || activity.occasion;

  return (
    <div
      onClick={onClick}
      className="min-w-[260px] max-w-[260px] rounded-2xl border border-border bg-card overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
    >
      <div className="relative h-36">
        <img src={imgUrl} alt={activity.name} className="w-full h-full object-cover" />
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm text-[10px] font-medium">
          {occasionLabel}
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
