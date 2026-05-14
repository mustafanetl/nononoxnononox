import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Coffee,
  Snowflake,
  UtensilsCrossed,
  Music,
  Building2,
  Waves,
  Store,
  Skull,
  Wine,
  Sparkles,
  Loader2,
} from "lucide-react";

/**
 * /promomalmo — TikTok-style 9:16 vertical promo page.
 * Showcases a real 48-hour Malmö trip plan from Jolliday AI.
 * Fetches real Google Places photos at runtime.
 */

interface Activity {
  icon: React.ReactNode;
  name: string;
  searchName: string;
  description: string;
  duration: string;
  location: string;
}

const DAY1_ACTIVITIES: Activity[] = [
  { icon: <Coffee className="w-4 h-4 text-amber-400" />, name: "LILLA KAFFEROSTERIET", searchName: "Lilla Kafferosteriet", description: "Sweden's best cinnamon bun, no joke", duration: "1h", location: "Davidshallstorg" },
  { icon: <Building2 className="w-4 h-4 text-amber-400" />, name: "TURNING TORSO", searchName: "Turning Torso", description: "Tallest twisted tower in Scandinavia", duration: "45m", location: "Västra Hamnen" },
  { icon: <Snowflake className="w-4 h-4 text-amber-400" />, name: "RIBERSBORGS KALLBADHUS", searchName: "Ribersborgs Kallbadhus", description: "Sauna + ice plunge in the sea, since 1898", duration: "2h", location: "Ribersborg" },
  { icon: <UtensilsCrossed className="w-4 h-4 text-amber-400" />, name: "BASTARD", searchName: "Bastard Restaurant", description: "Cult bistro Anthony Bourdain raved about", duration: "2h", location: "Mäster Johansgatan" },
  { icon: <Music className="w-4 h-4 text-amber-400" />, name: "MÖLLEVÅNGEN", searchName: "Möllevångstorget", description: "Hipster nightlife — bars, dive spots, energy", duration: "3h", location: "Möllevången" },
];

const DAY2_ACTIVITIES: Activity[] = [
  { icon: <Skull className="w-4 h-4 text-amber-400" />, name: "DISGUSTING FOOD MUSEUM", searchName: "Disgusting Food Museum", description: "80 of the world's grossest foods. Real.", duration: "1.5h", location: "Södra Förstadsgatan" },
  { icon: <Store className="w-4 h-4 text-amber-400" />, name: "MALMÖ SALUHALL", searchName: "Malmö Saluhall", description: "Foodie heaven in a converted depot", duration: "1h", location: "Gibraltargatan" },
  { icon: <Sparkles className="w-4 h-4 text-amber-400" />, name: "FOLKETS PARK", searchName: "Folkets Park Malmö", description: "Free concerts, mini golf, vintage rides", duration: "2h", location: "Möllevången" },
  { icon: <Waves className="w-4 h-4 text-amber-400" />, name: "WESTERN HARBOUR", searchName: "Västra Hamnen", description: "Sunset boardwalk by the Öresund", duration: "1.5h", location: "Västra Hamnen" },
  { icon: <Wine className="w-4 h-4 text-amber-400" />, name: "FAR I HATTEN", searchName: "Far i Hatten", description: "Iconic late-night bar in Folkets Park", duration: "3h", location: "Folkets Park" },
];

type Phase = "loading" | "hook" | "day1-title" | "day1-activities" | "day2-title" | "day2-activities" | "cta";
const TOTAL_DURATION = 40000;

const PromoMalmo = () => {
  const [phase, setPhase] = useState<Phase>("loading");
  const [activeCard, setActiveCard] = useState(0);
  const [photos, setPhotos] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const allActivities = [...DAY1_ACTIVITIES, ...DAY2_ACTIVITIES];
        const searchNames = allActivities.map((a) => a.searchName);
        // Use TripAdvisor for promo photos — much better quality
        const { data } = await supabase.functions.invoke("tripadvisor-photos", {
          body: {
            destination: "Malmö",
            venues: searchNames,
          },
        });
        const photoMap: Record<string, string> = {};
        const taPhotos = data?.photos || {};
        for (const activity of allActivities) {
          const info = taPhotos[activity.searchName];
          if (info?.photo) {
            photoMap[activity.name] = info.photo;
          }
        }
        setPhotos(photoMap);
      } catch (e) {
        console.error("Failed to load photos", e);
      } finally {
        setPhase("hook");
      }
    };
    fetchPhotos();
  }, []);

  const startSequence = useCallback(() => {
    setPhase("hook");
    setActiveCard(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase("day1-title"), 3000));
    timers.push(setTimeout(() => { setPhase("day1-activities"); setActiveCard(0); }, 5000));
    for (let i = 1; i < 5; i++) {
      timers.push(setTimeout(() => setActiveCard(i), 5000 + i * 2500));
    }
    timers.push(setTimeout(() => setPhase("day2-title"), 18000));
    timers.push(setTimeout(() => { setPhase("day2-activities"); setActiveCard(0); }, 20000));
    for (let i = 1; i < 5; i++) {
      timers.push(setTimeout(() => setActiveCard(i), 20000 + i * 2500));
    }
    timers.push(setTimeout(() => setPhase("cta"), 33000));
    timers.push(setTimeout(() => startSequence(), TOTAL_DURATION));
    return timers;
  }, []);

  useEffect(() => {
    if (phase === "loading") return;
    const timers = startSequence();
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase === "loading" ? "loading" : "started"]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black overflow-hidden">
      <div className="relative w-full h-full max-w-[430px] bg-black overflow-hidden flex items-center justify-center">

        {phase === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-white/40 text-xs mt-4 tracking-wide uppercase">Loading photos…</p>
          </div>
        )}

        {phase === "hook" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 px-6">
            <p className="text-white/60 text-base sm:text-lg tracking-[0.3em] uppercase font-light opacity-0 animate-promo-fade-in">
              48 hours in
            </p>
            <h1
              className="text-white text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[0.95] mt-3 opacity-0 animate-promo-punch text-center break-words max-w-full"
              style={{ animationDelay: "0.4s" }}
            >
              MALMÖ
            </h1>
            <div
              className="h-[3px] w-40 bg-gradient-to-r from-transparent via-amber-400 to-transparent mt-4 origin-left scale-x-0 animate-promo-underline"
              style={{ animationDelay: "0.8s" }}
            />
            <p
              className="text-white/40 text-sm tracking-wide mt-6 opacity-0 animate-promo-fade-in"
              style={{ animationDelay: "1.2s" }}
            >
              powered by Jolliday ✦
            </p>
          </div>
        )}

        {phase === "day1-title" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
            <div className="opacity-0 animate-promo-fade-up">
              <p className="text-amber-400 text-sm font-bold tracking-[0.4em] uppercase mb-2 text-center">
                Morning → Night
              </p>
              <h2 className="text-white text-6xl font-black tracking-tight text-center">DAY 1</h2>
              <div className="h-[2px] w-20 bg-amber-400/60 mt-4 mx-auto" />
            </div>
          </div>
        )}

        {phase === "day1-activities" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 z-10 bg-black">
            <ActivityCardDisplay
              activities={DAY1_ACTIVITIES}
              activeIndex={activeCard}
              dayLabel="DAY 1"
              photos={photos}
            />
          </div>
        )}

        {phase === "day2-title" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
            <div className="opacity-0 animate-promo-fade-up">
              <p className="text-amber-400 text-sm font-bold tracking-[0.4em] uppercase mb-2 text-center">
                Morning → Night
              </p>
              <h2 className="text-white text-6xl font-black tracking-tight text-center">DAY 2</h2>
              <div className="h-[2px] w-20 bg-amber-400/60 mt-4 mx-auto" />
            </div>
          </div>
        )}

        {phase === "day2-activities" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 z-10 bg-black">
            <ActivityCardDisplay
              activities={DAY2_ACTIVITIES}
              activeIndex={activeCard}
              dayLabel="DAY 2"
              photos={photos}
            />
          </div>
        )}

        {phase === "cta" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 px-6">
            <p className="text-white text-2xl font-bold opacity-0 animate-promo-fade-in text-center">
              Your perfect trip.
            </p>
            <p
              className="text-white/70 text-xl font-medium mt-2 opacity-0 animate-promo-fade-in text-center"
              style={{ animationDelay: "0.5s" }}
            >
              Planned in 30 seconds.
            </p>
            <div
              className="mt-10 flex flex-col items-center opacity-0 animate-promo-fade-in"
              style={{ animationDelay: "1s" }}
            >
              <span className="text-white text-4xl sm:text-5xl font-black tracking-tight mb-4">Jolliday</span>
              <p className="text-amber-400 text-base sm:text-lg font-semibold animate-promo-text-glow">
                Try free → jolliday.online
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function ActivityCardDisplay({
  activities,
  activeIndex,
  dayLabel,
  photos,
}: {
  activities: Activity[];
  activeIndex: number;
  dayLabel: string;
  photos: Record<string, string>;
}) {
  const activity = activities[activeIndex];
  const imageUrl = photos[activity.name];

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-amber-400/80 text-xs font-bold tracking-[0.3em] uppercase">{dayLabel}</span>
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-white/30 text-xs">{activeIndex + 1}/{activities.length}</span>
      </div>

      <div className="flex gap-1.5 mb-4">
        {activities.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i === activeIndex ? "bg-amber-400" : i < activeIndex ? "bg-amber-400/30" : "bg-white/10"
            }`}
          />
        ))}
      </div>

      <div
        key={`${dayLabel}-${activeIndex}`}
        className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden animate-promo-slide-in shadow-2xl bg-slate-900"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={activity.name}
            className="absolute inset-0 w-full h-full object-cover animate-promo-ken-burns"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center">
              {activity.icon}
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/95" />

        <div className="absolute top-4 left-4 w-9 h-9 rounded-xl bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20">
          {activity.icon}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className="text-white text-2xl sm:text-3xl font-black tracking-tight mb-1.5 leading-tight">
            {activity.name}
          </h3>
          <p className="text-white/80 text-sm leading-relaxed mb-3">{activity.description}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-xs font-medium">
              <span>⏱</span>{activity.duration}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-xs font-medium">
              <span>📍</span>{activity.location}
            </span>
          </div>
        </div>
      </div>

      {activeIndex < activities.length - 1 && (
        <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 opacity-40">
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-xs uppercase tracking-wider">Next:</span>
            <span className="text-white/50 text-sm font-semibold">{activities[activeIndex + 1].name}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default PromoMalmo;
