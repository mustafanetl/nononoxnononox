import { useState, useEffect, useCallback } from "react";
import { LogoMark } from "@/components/Logo";
import {
  Fish,
  Coffee,
  Microscope,
  UtensilsCrossed,
  Music,
  Sparkles,
  Ship,
  Store,
  Palette,
  Wine,
} from "lucide-react";

/**
 * /promo — TikTok-style 9:16 vertical promo page.
 * Auto-plays on load via timed state transitions. Designed to be screen-recorded.
 * Showcases a real 48-hour Gothenburg trip plan from Jolliday AI.
 * Loops infinitely. Features big venue images with ken-burns effect.
 */

interface Activity {
  icon: React.ReactNode;
  name: string;
  description: string;
  duration: string;
  location: string;
}

const VENUE_IMAGES: Record<string, string> = {
  "FESKEKÖRKA": "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=1200&fit=crop",
  "HAGA DISTRICT": "https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?w=800&h=1200&fit=crop",
  "UNIVERSEUM": "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&h=1200&fit=crop",
  "SJÖMAGASINET": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=1200&fit=crop",
  "AVENYN NIGHTLIFE": "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&h=1200&fit=crop",
  "LISEBERG": "https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=800&h=1200&fit=crop",
  "ARCHIPELAGO": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=1200&fit=crop",
  "SALUHALLEN": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=1200&fit=crop",
  "MUSEUM OF ART": "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&h=1200&fit=crop",
  "TRÄDGÅRN": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=1200&fit=crop",
};

const DAY1_ACTIVITIES: Activity[] = [
  {
    icon: <Fish className="w-4 h-4 text-amber-400" />,
    name: "FESKEKÖRKA",
    description: "Fresh seafood market since 1874",
    duration: "1.5h",
    location: "Rosenlund",
  },
  {
    icon: <Coffee className="w-4 h-4 text-amber-400" />,
    name: "HAGA DISTRICT",
    description: "Cozy cobblestone streets & giant cinnamon buns",
    duration: "2h",
    location: "Haga",
  },
  {
    icon: <Microscope className="w-4 h-4 text-amber-400" />,
    name: "UNIVERSEUM",
    description: "Scandinavia's largest science center",
    duration: "2.5h",
    location: "Södra Vägen",
  },
  {
    icon: <UtensilsCrossed className="w-4 h-4 text-amber-400" />,
    name: "SJÖMAGASINET",
    description: "Michelin-starred seafood dinner",
    duration: "2h",
    location: "Klippan",
  },
  {
    icon: <Music className="w-4 h-4 text-amber-400" />,
    name: "AVENYN NIGHTLIFE",
    description: "Gothenburg's main boulevard after dark",
    duration: "3h",
    location: "Avenyn",
  },
];

const DAY2_ACTIVITIES: Activity[] = [
  {
    icon: <Sparkles className="w-4 h-4 text-amber-400" />,
    name: "LISEBERG",
    description: "Scandinavia's largest amusement park",
    duration: "3h",
    location: "Liseberg",
  },
  {
    icon: <Ship className="w-4 h-4 text-amber-400" />,
    name: "ARCHIPELAGO",
    description: "Island hopping by ferry",
    duration: "3h",
    location: "Southern Islands",
  },
  {
    icon: <Store className="w-4 h-4 text-amber-400" />,
    name: "SALUHALLEN",
    description: "Historic food hall lunch",
    duration: "1h",
    location: "Kungstorget",
  },
  {
    icon: <Palette className="w-4 h-4 text-amber-400" />,
    name: "MUSEUM OF ART",
    description: "Nordic masterpieces",
    duration: "2h",
    location: "Götaplatsen",
  },
  {
    icon: <Wine className="w-4 h-4 text-amber-400" />,
    name: "TRÄDGÅRN",
    description: "Live music & cocktails",
    duration: "3h",
    location: "Nya Allén",
  },
];

type Phase =
  | "hook"
  | "day1-title"
  | "day1-activities"
  | "day2-title"
  | "day2-activities"
  | "cta";

const TOTAL_DURATION = 40000; // 40s total loop

const Promo = () => {
  const [phase, setPhase] = useState<Phase>("hook");
  const [activeCard, setActiveCard] = useState(0);

  const startSequence = useCallback(() => {
    setPhase("hook");
    setActiveCard(0);

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Day 1 title at 3s
    timers.push(setTimeout(() => setPhase("day1-title"), 3000));

    // Day 1 activities at 5s
    timers.push(
      setTimeout(() => {
        setPhase("day1-activities");
        setActiveCard(0);
      }, 5000)
    );

    // Cycle through day 1 cards (5 cards, 2.5s each)
    for (let i = 1; i < 5; i++) {
      timers.push(setTimeout(() => setActiveCard(i), 5000 + i * 2500));
    }

    // Day 2 title at 18s
    timers.push(setTimeout(() => setPhase("day2-title"), 18000));

    // Day 2 activities at 20s
    timers.push(
      setTimeout(() => {
        setPhase("day2-activities");
        setActiveCard(0);
      }, 20000)
    );

    // Cycle through day 2 cards
    for (let i = 1; i < 5; i++) {
      timers.push(setTimeout(() => setActiveCard(i), 20000 + i * 2500));
    }

    // CTA at 33s
    timers.push(setTimeout(() => setPhase("cta"), 33000));

    // Loop at 40s
    timers.push(setTimeout(() => startSequence(), TOTAL_DURATION));

    return timers;
  }, []);

  useEffect(() => {
    const timers = startSequence();
    return () => timers.forEach(clearTimeout);
  }, [startSequence]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black overflow-hidden">
      {/* 9:16 container */}
      <div className="relative w-full h-full max-w-[430px] bg-black overflow-hidden flex items-center justify-center">
        {/* ===== HOOK SCREEN ===== */}
        {phase === "hook" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 px-4">
            <p className="text-white/60 text-lg tracking-[0.3em] uppercase font-light opacity-0 animate-promo-fade-in">
              48 hours in
            </p>
            <h1
              className="text-white text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter leading-none mt-3 opacity-0 animate-promo-punch"
              style={{ animationDelay: "0.4s" }}
            >
              GOTHENBURG
            </h1>
            {/* Golden underline */}
            <div
              className="h-[3px] w-48 bg-gradient-to-r from-transparent via-amber-400 to-transparent mt-4 origin-left scale-x-0 animate-promo-underline"
              style={{ animationDelay: "0.8s" }}
            />
            <p
              className="text-white/40 text-sm tracking-wide mt-6 opacity-0 animate-promo-fade-in"
              style={{ animationDelay: "1.2s" }}
            >
              planned by AI ✦
            </p>
          </div>
        )}

        {/* ===== DAY 1 TITLE ===== */}
        {phase === "day1-title" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
            <div className="opacity-0 animate-promo-fade-up">
              <p className="text-amber-400 text-sm font-bold tracking-[0.4em] uppercase mb-2 text-center">
                Morning → Night
              </p>
              <h2 className="text-white text-6xl font-black tracking-tight text-center">
                DAY 1
              </h2>
              <div className="h-[2px] w-20 bg-amber-400/60 mt-4 mx-auto" />
            </div>
          </div>
        )}

        {/* ===== DAY 1 ACTIVITIES ===== */}
        {phase === "day1-activities" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 z-10 bg-black">
            <ActivityCardDisplay
              activities={DAY1_ACTIVITIES}
              activeIndex={activeCard}
              dayLabel="DAY 1"
            />
          </div>
        )}

        {/* ===== DAY 2 TITLE ===== */}
        {phase === "day2-title" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
            <div className="opacity-0 animate-promo-fade-up">
              <p className="text-amber-400 text-sm font-bold tracking-[0.4em] uppercase mb-2 text-center">
                Morning → Night
              </p>
              <h2 className="text-white text-6xl font-black tracking-tight text-center">
                DAY 2
              </h2>
              <div className="h-[2px] w-20 bg-amber-400/60 mt-4 mx-auto" />
            </div>
          </div>
        )}

        {/* ===== DAY 2 ACTIVITIES ===== */}
        {phase === "day2-activities" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 z-10 bg-black">
            <ActivityCardDisplay
              activities={DAY2_ACTIVITIES}
              activeIndex={activeCard}
              dayLabel="DAY 2"
            />
          </div>
        )}

        {/* ===== CTA SCREEN ===== */}
        {phase === "cta" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
            <p className="text-white text-2xl font-bold opacity-0 animate-promo-fade-in">
              Your perfect trip.
            </p>
            <p
              className="text-white/70 text-xl font-medium mt-2 opacity-0 animate-promo-fade-in"
              style={{ animationDelay: "0.5s" }}
            >
              Planned in 30 seconds.
            </p>
            <div
              className="mt-10 flex flex-col items-center opacity-0 animate-promo-fade-in"
              style={{ animationDelay: "1s" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <LogoMark size={36} color="white" />
                <span className="text-white text-3xl font-black tracking-tight">
                  Jolliday
                </span>
              </div>
              <p className="text-amber-400 text-lg font-semibold animate-promo-text-glow">
                Try free → jolliday.online
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ===== Activity Card Display Component (TikTok style with venue images) ===== */
function ActivityCardDisplay({
  activities,
  activeIndex,
  dayLabel,
}: {
  activities: Activity[];
  activeIndex: number;
  dayLabel: string;
}) {
  const activity = activities[activeIndex];
  const imageUrl = VENUE_IMAGES[activity.name];

  return (
    <div className="w-full max-w-sm">
      {/* Day indicator */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-amber-400/80 text-xs font-bold tracking-[0.3em] uppercase">
          {dayLabel}
        </span>
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-white/30 text-xs">
          {activeIndex + 1}/{activities.length}
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-4">
        {activities.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i === activeIndex
                ? "bg-amber-400"
                : i < activeIndex
                  ? "bg-amber-400/30"
                  : "bg-white/10"
            }`}
          />
        ))}
      </div>

      {/* Active card — TikTok style with big venue image */}
      <div
        key={`${dayLabel}-${activeIndex}`}
        className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden animate-promo-slide-in shadow-2xl"
      >
        {/* Background venue image with ken-burns */}
        <img
          src={imageUrl}
          alt={activity.name}
          className="absolute inset-0 w-full h-full object-cover animate-promo-ken-burns"
        />

        {/* Dark gradient overlay — transparent top to black bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90" />

        {/* Icon badge — top left */}
        <div className="absolute top-4 left-4 w-8 h-8 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/10">
          {activity.icon}
        </div>

        {/* Content — bottom left */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className="text-white text-2xl font-black tracking-tight mb-1">
            {activity.name}
          </h3>
          <p className="text-white/70 text-sm leading-relaxed mb-3">
            {activity.description}
          </p>
          {/* Duration + location pills */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-xs font-medium">
              <span>⏱</span>
              {activity.duration}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-xs font-medium">
              <span>📍</span>
              {activity.location}
            </span>
          </div>
        </div>
      </div>

      {/* Upcoming preview */}
      {activeIndex < activities.length - 1 && (
        <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 opacity-40">
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-xs uppercase tracking-wider">
              Next:
            </span>
            <span className="text-white/50 text-sm font-semibold">
              {activities[activeIndex + 1].name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Promo;
