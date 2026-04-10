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
  const hasImage = !!activity.realPhoto;
  const occasionLabel = occasionLabels[activity.occasion] || activity.occasion;

  return (
    <div
      onClick={onClick}
      className="min-w-[260px] max-w-[260px] rounded-2xl border border-border bg-card overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
    >
      <div className="relative h-36">
        {hasImage ? (
          <img src={activity.realPhoto} alt={activity.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-muted to-accent/20 flex items-center justify-center">
            <Icon className="h-10 w-10 text-muted-foreground/50" />
          </div>
        )}
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
