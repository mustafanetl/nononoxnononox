import { Clock, DollarSign, Heart, Utensils, Camera, Mountain, Music, Palette, ShoppingBag, Waves, MapPin, Ticket, CheckCircle2 } from "lucide-react";

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
  neighborhood?: string;
  hours?: string;
  bookAhead?: boolean;
  why?: string;
  lat?: number;
  lng?: number;
  realPhoto?: string;
  realPhotos?: string[];
  isReal?: boolean;
  verified?: boolean;
  verifiedAddress?: string | null;
  verifiedRating?: number | null;
  videoUrl?: string | null;
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

const ActivityCard = ({ activity, onClick }: { activity: ActivityData; onClick: () => void }) => {
  const Icon = categoryIcons[activity.category] || Camera;
  const hasImage = !!activity.realPhoto;

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
          {activity.verified ? (
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/90 backdrop-blur-sm text-[9px] font-medium text-white flex items-center gap-0.5">
              <CheckCircle2 className="h-2.5 w-2.5" /> Verified
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded-full bg-muted/80 backdrop-blur-sm text-[9px] font-medium text-muted-foreground">
              AI suggested
            </span>
          )}
          {activity.bookAhead && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/90 backdrop-blur-sm text-[9px] font-medium text-white flex items-center gap-0.5">
              <Ticket className="h-2.5 w-2.5" /> Book ahead
            </span>
          )}
        </div>
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-start gap-2">
          <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <h3 className="font-semibold text-sm leading-tight">{activity.name}</h3>
        </div>
        {activity.neighborhood && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <MapPin className="h-2.5 w-2.5" /> {activity.verifiedAddress || activity.neighborhood}
            {activity.hours && <span className="ml-1">· {activity.hours}</span>}
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {activity.duration}
          </span>
          <span className="flex items-center gap-1 font-semibold text-foreground">
            <DollarSign className="h-3 w-3" />
            ~{activity.currency}{activity.price}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;
