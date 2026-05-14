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
 * Loops infinitely.
 */

interface Activity {
  icon: React.ReactNode;
  name: string;
  description: string;
  duration: string;
  location: string;
}

const DAY1_ACTIVITIES: Activity[] = [
  {
    icon: <Fish className="w-5 h-5 text-amber-400" />,
    name: "FESKEKÖRKA",
    description: "Fresh seafood market since 1874",
    duration: "1.5h",
    location: "Rosenlund",
  },
  {
    icon: <Coffee className="w-5 h-5 text-amber-400" />,
    name: "HAGA DISTRICT",
    description: "Cozy cobblestone streets & giant cinnamon buns",
    duration: "2h",
    location: "Haga",
  },
  {
    icon: <Microscope className="w-5 h-5 text-amber-400" />,
    name: "UNIVERSEUM",
    description: "Scandinavia's largest science center",
    duration: "2.5h",
    location: "Södra Vägen",
  },
  {
    icon: <UtensilsCrossed className="w-5 h-5 text-amber-400" />,
    name: "SJÖMAGASINET",
    description: "Michelin-starred seafood dinner",
    duration: "2h",
    location: "Klippan",
  },
  {
    icon: <Music className="w-5 h-5 text-amber-400" />,
    name: "AVENYN NIGHTLIFE",
    description: "Gothenburg's main boulevard after dark",
    duration: "3h",
    location: "Avenyn",
  },
];

const DAY2_ACTIVITIES: Activity[] = [
  {
    icon: <Sparkles className="w-5 h-5 text-amber-400" />,
    name: "LISEBERG",
    description: "Scandinavia's largest amusement park",
    duration: "3h",
    location: "Liseberg",
  },
  {
    icon: <Ship className="w-5 h-5 text-amber-400" />,
    name: "ARCHIPELAGO",
    description: "Island hopping by ferry",
    duration: "3h",
    location: "Southern Islands",
  },
  {
    icon: <Store className="w-5 h-5 text-amber-400" />,
    name: "SALUHALLEN",
    description: "Historic food hall lunch",
    duration: "1h",
    location: "Kungstorget",
  },
  {
    icon: <Palette className="w-5 h-5 text-amber-400" />,
    name: "MUSEUM OF ART",
    description: "Nordic masterpieces",
    duration: "2h",
    location: "Götaplatsen",
  },
  {
    icon: <Wine className="w-5 h-5 text-amber-400" />,
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
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
            <p className="text-white/60 text-lg tracking-[0.3em] uppercase font-light opacity-0 animate-promo-fade-in">
              48 hours in
            </p>
            <h1
              className="text-white text-7xl sm:text-8xl font-black tracking-tighter leading-none mt-3 opacity-0 animate-promo-punch"
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
          <div className="absolute inset-0 flex flex-col items-center justify-center px-5 z-10 bg-gradient-to-b from-slate-900 via-[#0f1724] to-slate-900">
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
          <div className="absolute inset-0 flex flex-col items-center justify-center px-5 z-10 bg-gradient-to-b from-slate-900 via-[#0f1724] to-slate-900">
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

/* ===== Activity Card Display Component ===== */
function ActivityCardDisplay({
  activities,
  activeIndex,
  dayLabel,
}: {
  activities: Activity[];
  activeIndex: number;
  dayLabel: string;
}) {
  return (
    <div className="w-full max-w-sm">
      {/* Day indicator */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-amber-400/80 text-xs font-bold tracking-[0.3em] uppercase">
          {dayLabel}
        </span>
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-white/30 text-xs">
          {activeIndex + 1}/{activities.length}
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-6">
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

      {/* Active card */}
      <div
        key={`${dayLabel}-${activeIndex}`}
        className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6 animate-promo-slide-in shadow-lg"
        style={{
          boxShadow:
            "0 0 30px 2px rgba(212, 175, 55, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center">
            {activities[activeIndex].icon}
          </div>
          <h3 className="text-white text-xl font-black tracking-tight">
            {activities[activeIndex].name}
          </h3>
        </div>
        <p className="text-white/60 text-base leading-relaxed mb-5">
          {activities[activeIndex].description}
        </p>
        <div className="flex items-center gap-4 text-white/40 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="text-base">⏱</span>
            {activities[activeIndex].duration}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-base">📍</span>
            {activities[activeIndex].location}
          </span>
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
