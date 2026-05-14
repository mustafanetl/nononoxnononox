import { LogoMark } from "@/components/Logo";

/**
 * /promo — TikTok-style 9:16 vertical promo page.
 * Auto-plays on load via CSS animations. Designed to be screen-recorded.
 * Showcases a real 24-hour Gothenburg plan from Jolliday AI.
 */

const GOTHENBURG_PLAN = {
  destination: "Gothenburg",
  duration: "24 hours",
  itinerary: [
    { time: "09:00", venue: "Café Husaren", activity: "Giant cinnamon bun breakfast", neighborhood: "Haga" },
    { time: "10:30", venue: "Haga District", activity: "Explore cobblestone streets", neighborhood: "Haga" },
    { time: "12:30", venue: "Feskekôrka", activity: "Fresh seafood lunch", neighborhood: "Grönsakstorget" },
    { time: "14:00", venue: "Gothenburg Museum of Art", activity: "Nordic art & exhibitions", neighborhood: "Götaplatsen" },
    { time: "16:30", venue: "Liseberg", activity: "Rides & atmosphere", neighborhood: "Liseberg" },
    { time: "20:00", venue: "Sjömagasinet", activity: "Michelin seafood dinner", neighborhood: "Klippan" },
  ],
};

const Promo = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black overflow-hidden">
      {/* 9:16 container — full screen on mobile, centered on desktop */}
      <div className="relative w-full h-full max-w-[calc(100vh*9/16)] aspect-[9/16] overflow-hidden promo-gbg-bg">
        
        {/* ===== PHASE 1: HOOK (0s - 2s) ===== */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 promo-gbg-hook">
          <p className="text-white/70 text-lg sm:text-xl font-medium tracking-wide promo-gbg-fade-in">
            24 hours in
          </p>
          <h1 className="text-white text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-none mt-2 promo-gbg-punch-in">
            GOTHENBURG
          </h1>
          <p className="text-5xl mt-3 promo-gbg-fade-in" style={{ animationDelay: "0.4s" }}>
            🇸🇪
          </p>
        </div>

        {/* ===== PHASE 2: TRANSITION (2s - 3s) ===== */}
        <div className="absolute inset-0 flex items-center justify-center z-20 promo-gbg-transition">
          <p className="text-white/80 text-lg sm:text-xl font-medium tracking-wide text-center px-6">
            Planned by AI in 30 seconds ✨
          </p>
        </div>

        {/* ===== PHASE 3: ITINERARY REVEAL (3s - 15s) ===== */}
        <div className="absolute inset-0 flex flex-col justify-center px-5 sm:px-8 z-10 promo-gbg-itinerary">
          <p className="text-white/50 text-xs font-bold uppercase tracking-[0.2em] mb-4 promo-gbg-itinerary-title">
            Your day in Gothenburg
          </p>
          
          <div className="space-y-3">
            {GOTHENBURG_PLAN.itinerary.map((slot, i) => (
              <div
                key={slot.venue}
                className="promo-gbg-card rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-md px-4 py-3 sm:px-5 sm:py-4"
                style={{ animationDelay: `${3 + i * 2}s` }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-white/40 text-sm font-mono font-bold shrink-0 pt-0.5">
                    {slot.time}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-white font-bold text-base sm:text-lg leading-tight truncate">
                      {slot.venue}
                    </h3>
                    <p className="text-white/60 text-sm mt-0.5 truncate">
                      {slot.activity}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== PHASE 4: STATS (15s - 17s) ===== */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 promo-gbg-stats">
          <p className="text-white text-xl sm:text-2xl font-bold tracking-wide text-center">
            6 stops · 1 day · 0 planning
          </p>
          <div className="mt-6 flex items-center gap-2 promo-gbg-stats-logo">
            <LogoMark size={32} color="white" />
            <span className="text-white text-2xl font-black tracking-tight">Jolliday</span>
          </div>
        </div>

        {/* ===== PHASE 5: CTA (17s - 20s) ===== */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 promo-gbg-cta">
          <p className="text-white/70 text-base sm:text-lg font-medium mb-3">
            Try it free
          </p>
          <p className="text-white text-2xl sm:text-3xl font-black tracking-tight promo-gbg-pulse">
            jolliday.online
          </p>
          <div className="mt-6 flex items-center gap-2">
            <LogoMark size={24} color="white" />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Promo;
