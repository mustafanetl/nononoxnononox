import { useState, useEffect, useCallback } from "react";
import { LogoMark } from "@/components/Logo";

/**
 * /promo — TikTok-style 9:16 vertical promo page.
 * Full-bleed place images with text overlay (like TikTok travel content).
 * Auto-plays on load via timed state transitions. Designed to be screen-recorded.
 * Showcases a real 48-hour Göteborg trip plan from Jolliday AI.
 * Loops infinitely.
 */

interface Activity {
  name: string;
  description: string;
  time: string;
  location: string;
  image: string;
}

const DAY1_ACTIVITIES: Activity[] = [
  {
    name: "CAFÉ HUSAREN",
    description: "Giant cinnamon bun breakfast in Haga",
    time: "09:00",
    location: "Haga",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800",
  },
  {
    name: "HAGA DISTRICT",
    description: "Cozy cobblestone streets & vintage shops",
    time: "11:00",
    location: "Haga",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800",
  },
  {
    name: "FESKEKÖRKA",
    description: "Fresh seafood market since 1874",
    time: "13:00",
    location: "Rosenlund",
    image: "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=800",
  },
  {
    name: "MUSEUM OF ART",
    description: "Nordic masterpieces at Götaplatsen",
    time: "15:30",
    location: "Götaplatsen",
    image: "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800",
  },
  {
    name: "LISEBERG",
    description: "Scandinavia's largest amusement park",
    time: "19:00",
    location: "Liseberg",
    image: "https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=800",
  },
];

const DAY2_ACTIVITIES: Activity[] = [
  {
    name: "SJÖMAGASINET",
    description: "Michelin-starred seafood brunch",
    time: "10:00",
    location: "Klippan",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
  },
  {
    name: "ARCHIPELAGO",
    description: "Island hopping by ferry",
    time: "12:30",
    location: "Southern Islands",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
  },
  {
    name: "SALUHALLEN",
    description: "Historic food hall lunch",
    time: "15:00",
    location: "Kungstorget",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
  },
  {
    name: "SLOTTSSKOGEN",
    description: "Golden hour walk in the city park",
    time: "17:00",
    location: "Linnéstaden",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800",
  },
  {
    name: "TRÄDGÅRN",
    description: "Live music & cocktails",
    time: "21:00",
    location: "Nya Allén",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
  },
];

const ALL_ACTIVITIES = [...DAY1_ACTIVITIES, ...DAY2_ACTIVITIES];

type Phase = "hook" | "activities" | "cta";

const HOOK_DURATION = 3000;
const ACTIVITY_DURATION = 3500;
const CTA_DURATION = 7000;
const TOTAL_DURATION =
  HOOK_DURATION + ALL_ACTIVITIES.length * ACTIVITY_DURATION + CTA_DURATION; // ~45s

const Promo = () => {
  const [phase, setPhase] = useState<Phase>("hook");
  const [activeIndex, setActiveIndex] = useState(0);
  // Track which image is "front" for crossfade
  const [visibleImage, setVisibleImage] = useState(0);

  // Preload all images on mount
  useEffect(() => {
    ALL_ACTIVITIES.forEach((a) => {
      const img = new Image();
      img.src = a.image;
    });
  }, []);

  const startSequence = useCallback(() => {
    setPhase("hook");
    setActiveIndex(0);
    setVisibleImage(0);

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Start activities after hook
    timers.push(
      setTimeout(() => {
        setPhase("activities");
        setActiveIndex(0);
        setVisibleImage(0);
      }, HOOK_DURATION)
    );

    // Cycle through all 10 activities
    for (let i = 1; i < ALL_ACTIVITIES.length; i++) {
      timers.push(
        setTimeout(() => {
          setActiveIndex(i);
          setVisibleImage(i);
        }, HOOK_DURATION + i * ACTIVITY_DURATION)
      );
    }

    // CTA after all activities
    const ctaStart = HOOK_DURATION + ALL_ACTIVITIES.length * ACTIVITY_DURATION;
    timers.push(setTimeout(() => setPhase("cta"), ctaStart));

    // Loop
    timers.push(setTimeout(() => startSequence(), TOTAL_DURATION));

    return timers;
  }, []);

  useEffect(() => {
    const timers = startSequence();
    return () => timers.forEach(clearTimeout);
  }, [startSequence]);

  const currentActivity = ALL_ACTIVITIES[activeIndex];
  const currentDay = activeIndex < 5 ? 1 : 2;
  const dayIndex = activeIndex < 5 ? activeIndex : activeIndex - 5;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black overflow-hidden">
      {/* 9:16 container */}
      <div className="relative w-full h-full max-w-[430px] bg-black overflow-hidden">
        {/* ===== HOOK SCREEN ===== */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center bg-black z-20 transition-opacity duration-700 ${
            phase === "hook" ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <p className="text-white/60 text-lg tracking-[0.3em] uppercase font-light opacity-0 animate-promo-fade-in">
            48 hours in
          </p>
          <h1
            className="text-white text-5xl sm:text-7xl font-black tracking-tighter leading-none mt-3 opacity-0 animate-promo-punch"
            style={{ animationDelay: "0.4s" }}
          >
            GÖTEBORG
          </h1>
          <p
            className="text-2xl mt-2 opacity-0 animate-promo-fade-in"
            style={{ animationDelay: "0.6s" }}
          >
            🇸🇪
          </p>
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

        {/* ===== ACTIVITY SCREENS (full-bleed images with crossfade) ===== */}
        <div
          className={`absolute inset-0 z-10 transition-opacity duration-700 ${
            phase === "activities"
              ? "opacity-100"
              : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Stacked images for crossfade */}
          {ALL_ACTIVITIES.map((activity, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-700 ${
                visibleImage === i ? "opacity-100" : "opacity-0"
              }`}
            >
              <img
                src={activity.image}
                alt={activity.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          ))}

          {/* Dark gradient overlay from bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 35%, rgba(0,0,0,0.2) 60%, transparent 100%)" }} />

          {/* Day indicator top-left */}
          <div className="absolute top-6 left-5 z-10">
            <span className="text-white/70 text-xs font-bold tracking-[0.2em] uppercase bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
              DAY {currentDay}
            </span>
          </div>

          {/* Activity info at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-6 pb-8 z-10">
            {/* Time */}
            <div
              key={`time-${activeIndex}`}
              className="flex items-center gap-2 mb-2 opacity-0 animate-promo-fade-in"
            >
              <span className="text-white/60 text-sm">⏱</span>
              <span className="text-white/70 text-sm font-medium">
                {currentActivity.time}
              </span>
            </div>

            {/* Venue name */}
            <h2
              key={`name-${activeIndex}`}
              className="text-white text-3xl sm:text-4xl font-black tracking-tight leading-tight mb-2 opacity-0 animate-promo-fade-up"
              style={{ animationDelay: "0.1s" }}
            >
              {currentActivity.name}
            </h2>

            {/* Description */}
            <p
              key={`desc-${activeIndex}`}
              className="text-white/70 text-base leading-relaxed mb-1 opacity-0 animate-promo-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              {currentActivity.description}
            </p>

            {/* Location */}
            <p
              key={`loc-${activeIndex}`}
              className="text-white/50 text-sm mb-6 opacity-0 animate-promo-fade-in"
              style={{ animationDelay: "0.4s" }}
            >
              📍 {currentActivity.location}
            </p>

            {/* Progress dots */}
            <div className="flex gap-1.5 mb-3">
              {(currentDay === 1 ? DAY1_ACTIVITIES : DAY2_ACTIVITIES).map(
                (_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                      i === dayIndex
                        ? "bg-white scale-125"
                        : i < dayIndex
                          ? "bg-white/50"
                          : "bg-white/20"
                    }`}
                  />
                )
              )}
            </div>

            {/* Day · index */}
            <p className="text-white/40 text-xs tracking-wide">
              DAY {currentDay} · {dayIndex + 1}/5
            </p>
          </div>
        </div>

        {/* ===== CTA SCREEN ===== */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center bg-black z-20 transition-opacity duration-700 ${
            phase === "cta" ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <p className="text-white/80 text-lg font-medium tracking-wide opacity-0 animate-promo-fade-in">
            Your trip.
          </p>
          <p
            className="text-white text-2xl sm:text-3xl font-bold mt-2 opacity-0 animate-promo-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            Planned in 30 seconds.
          </p>
          <div
            className="mt-12 flex flex-col items-center opacity-0 animate-promo-fade-in"
            style={{ animationDelay: "1s" }}
          >
            <div className="flex items-center gap-3 mb-5">
              <LogoMark size={40} color="white" />
              <span className="text-white text-3xl font-black tracking-tight">
                Jolliday
              </span>
            </div>
            <p className="text-amber-400 text-lg font-semibold animate-promo-text-glow">
              jolliday.online
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Promo;
