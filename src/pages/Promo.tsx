import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Plane,
  Hotel,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
  Utensils,
  Camera,
  DollarSign,
  Check,
  Play,
  RotateCcw,
} from "lucide-react";
import Logo, { LogoMark } from "@/components/Logo";
import { Button } from "@/components/ui/button";

/**
 * /promo — auto-playing animated showcase of Jolliday.
 *
 * Designed to be screen-recorded (OBS, iPhone recorder, Screen Studio, etc.).
 * Plays through 8 scenes over ~48 seconds, then loops or shows replay button.
 *
 * Total duration: ~48s (perfect for TikTok/Reels/Shorts).
 */

type Scene =
  | "intro"
  | "problem"
  | "typing"
  | "chat"
  | "features"
  | "proof"
  | "cta"
  | "end";

const SCENE_DURATIONS: Record<Scene, number> = {
  intro: 4000,
  problem: 5000,
  typing: 6000,
  chat: 8000,
  features: 8000,
  proof: 6000,
  cta: 5000,
  end: 6000,
};

const SCENE_ORDER: Scene[] = [
  "intro",
  "problem",
  "typing",
  "chat",
  "features",
  "proof",
  "cta",
  "end",
];

const TOTAL_DURATION = SCENE_ORDER.reduce(
  (sum, s) => sum + SCENE_DURATIONS[s],
  0
);

const Promo = () => {
  const [scene, setScene] = useState<Scene>("intro");
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [typedText, setTypedText] = useState("");
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>();

  const TYPE_TARGET = "5 days in Tokyo for a couple in April, love food 🍣";

  // Scene transitions
  useEffect(() => {
    if (!playing) return;

    let elapsed = 0;
    startTimeRef.current = performance.now();

    const timeouts: NodeJS.Timeout[] = [];
    SCENE_ORDER.forEach((s, i) => {
      if (i === 0) return;
      elapsed += SCENE_DURATIONS[SCENE_ORDER[i - 1]];
      const t = setTimeout(() => setScene(s), elapsed);
      timeouts.push(t);
    });

    // Progress bar
    const tick = () => {
      const now = performance.now();
      const pct = Math.min(
        ((now - startTimeRef.current) / TOTAL_DURATION) * 100,
        100
      );
      setProgress(pct);
      if (pct < 100) rafRef.current = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      timeouts.forEach(clearTimeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);

  // Typewriter effect during "typing" scene
  useEffect(() => {
    if (scene !== "typing") return;
    setTypedText("");
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTypedText(TYPE_TARGET.slice(0, i));
      if (i >= TYPE_TARGET.length) clearInterval(interval);
    }, 90);
    return () => clearInterval(interval);
  }, [scene]);

  const replay = () => {
    setScene("intro");
    setProgress(0);
    setPlaying(true);
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-50">
        <div
          className="h-full"
          style={{
            width: `${progress}%`,
            background:
              "linear-gradient(90deg, hsl(234 62% 62%), hsl(260 70% 65%))",
            transition: "width 100ms linear",
          }}
        />
      </div>

      {/* Replay button when done */}
      {!playing && progress >= 100 && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="text-center">
            <div className="mb-8">
              <Logo size="xl" variant="mark-only" />
            </div>
            <h2 className="text-white text-4xl font-bold mb-6">
              That's Jolliday.
            </h2>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={replay}
                size="lg"
                className="h-12 px-6 rounded-full gap-2 bg-white text-black hover:bg-white/90"
              >
                <RotateCcw className="h-4 w-4" /> Replay
              </Button>
              <Link to="/">
                <Button
                  size="lg"
                  className="h-12 px-6 rounded-full gap-2"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
                  }}
                >
                  Go to site <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* SCENE 1: INTRO — Logo reveal */}
      {scene === "intro" && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background:
              "radial-gradient(ellipse at center, hsl(234 62% 25%) 0%, hsl(234 62% 10%) 50%, black 100%)",
          }}
        >
          <div className="text-center animate-promo-zoom-in">
            <div className="mb-8 flex justify-center">
              <div
                className="w-32 h-32 rounded-[2rem] flex items-center justify-center shadow-[0_0_80px_hsl(234_62%_60%/0.5)]"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
                }}
              >
                <LogoMark size={70} color="white" />
              </div>
            </div>
            <h1 className="text-white text-7xl font-extrabold tracking-tight animate-promo-fade-up">
              Jolliday
            </h1>
            <p
              className="mt-4 text-white/60 text-xl animate-promo-fade-up"
              style={{ animationDelay: "0.4s" }}
            >
              AI Trip Planner
            </p>
          </div>
        </div>
      )}

      {/* SCENE 2: PROBLEM */}
      {scene === "problem" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[hsl(0_0%_6%)]">
          <div className="max-w-4xl px-8 text-center">
            <div
              className="grid grid-cols-4 gap-2 mb-12 animate-promo-fade-up"
              style={{ animationDelay: "0.1s" }}
            >
              {["Kayak", "Booking", "Skyscanner", "TripAdvisor", "Airbnb", "Expedia", "Google Flights", "Reddit"].map((tab, i) => (
                <div
                  key={tab}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/40 text-sm truncate animate-promo-fade-up"
                  style={{ animationDelay: `${0.2 + i * 0.08}s` }}
                >
                  {tab}
                </div>
              ))}
            </div>
            <h2
              className="text-white text-6xl font-extrabold tracking-tight animate-promo-fade-up"
              style={{ animationDelay: "1s" }}
            >
              Planning a trip?
            </h2>
            <h2
              className="mt-3 text-5xl font-extrabold tracking-tight animate-promo-fade-up"
              style={{
                animationDelay: "1.8s",
                background:
                  "linear-gradient(135deg, hsl(234 62% 62%), hsl(260 70% 65%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Just ask Jolliday.
            </h2>
          </div>
        </div>
      )}

      {/* SCENE 3: TYPING — mock hero */}
      {scene === "typing" && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <div className="w-full max-w-3xl px-8 text-center">
            <h2
              className="text-6xl font-extrabold tracking-tight text-foreground mb-12 animate-promo-fade-up"
            >
              Any trip.
              <br />
              In one chat.
            </h2>

            <div className="rounded-2xl border-2 border-primary bg-white shadow-2xl shadow-primary/20 overflow-hidden animate-promo-fade-up" style={{ animationDelay: "0.3s" }}>
              <div className="px-6 pt-6 pb-4 text-left min-h-[120px]">
                <p className="text-xl text-foreground leading-relaxed">
                  {typedText}
                  <span className="inline-block w-0.5 h-6 bg-primary ml-0.5 animate-pulse" />
                </p>
              </div>
              <div className="flex items-center justify-end px-4 pb-4">
                <div
                  className="h-11 px-6 rounded-xl flex items-center gap-2 font-semibold text-white shadow-md"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
                  }}
                >
                  Plan my trip
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCENE 4: CHAT streaming */}
      {scene === "chat" && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <div className="w-full max-w-2xl px-6">
            {/* User message */}
            <div className="flex justify-end mb-4 animate-promo-slide-in-right">
              <div className="max-w-sm rounded-2xl rounded-tr-sm bg-primary text-white px-4 py-3 text-sm">
                5 days in Tokyo for a couple in April 🍣
              </div>
            </div>

            {/* Assistant stream */}
            <div
              className="flex gap-3 animate-promo-fade-up"
              style={{ animationDelay: "0.8s" }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
                }}
              >
                <LogoMark size={18} color="white" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="bg-muted/60 rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed">
                  <span className="animate-promo-typewriter-1 inline-block overflow-hidden whitespace-nowrap">
                    Perfect! I'm planning a 5-day Tokyo trip for you...
                  </span>
                </div>
                <div
                  className="animate-promo-fade-up bg-muted/40 rounded-xl px-3 py-2 inline-flex items-center gap-2 text-xs text-muted-foreground"
                  style={{ animationDelay: "2.5s" }}
                >
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="font-medium">Picking neighborhoods…</span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                </div>
                <div
                  className="animate-promo-fade-up bg-muted/40 rounded-xl px-3 py-2 inline-flex items-center gap-2 text-xs text-muted-foreground"
                  style={{ animationDelay: "4s" }}
                >
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="font-medium">Pricing it out…</span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                </div>
                <div
                  className="animate-promo-fade-up bg-muted/40 rounded-xl px-3 py-2 inline-flex items-center gap-2 text-xs text-muted-foreground"
                  style={{ animationDelay: "5.5s" }}
                >
                  <Check className="h-3 w-3 text-green-500" />
                  <span className="font-medium text-foreground">
                    Your Tokyo trip is ready ✨
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCENE 5: FEATURES grid */}
      {scene === "features" && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background:
              "linear-gradient(180deg, hsl(0 0% 99%) 0%, hsl(234 62% 97%) 100%)",
          }}
        >
          <div className="w-full max-w-5xl px-8">
            <h2
              className="text-center text-4xl font-extrabold tracking-tight text-foreground mb-10 animate-promo-fade-up"
            >
              Everything, in seconds
            </h2>
            <div className="grid grid-cols-3 gap-5">
              {[
                { icon: Plane, title: "Flights", desc: "Live prices", color: "from-sky-400 to-blue-600" },
                { icon: Hotel, title: "Hotels", desc: "Hand-picked stays", color: "from-purple-400 to-indigo-600" },
                { icon: MapPin, title: "Activities", desc: "Day by day", color: "from-pink-400 to-rose-600" },
                { icon: Utensils, title: "Restaurants", desc: "Local favorites", color: "from-amber-400 to-orange-600" },
                { icon: Calendar, title: "Itinerary", desc: "Hour by hour", color: "from-emerald-400 to-teal-600" },
                { icon: Camera, title: "Hidden gems", desc: "Off the beaten path", color: "from-fuchsia-400 to-purple-600" },
              ].map((f, i) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="bg-white rounded-2xl border border-border p-6 shadow-lg animate-promo-card-in"
                    style={{ animationDelay: `${0.2 + i * 0.15}s` }}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-3 shadow-md`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">
                      {f.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {f.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SCENE 6: PROOF points */}
      {scene === "proof" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[hsl(0_0%_5%)]">
          <div className="w-full max-w-3xl px-8 text-center">
            <h2
              className="text-white text-5xl font-extrabold tracking-tight mb-12 animate-promo-fade-up"
            >
              Trusted by travellers
            </h2>
            <div className="grid grid-cols-3 gap-6 mb-10">
              {[
                { num: "48K+", label: "Trips planned" },
                { num: "4.9★", label: "Avg rating" },
                { num: "60s", label: "Avg plan time" },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className="animate-promo-fade-up"
                  style={{ animationDelay: `${0.3 + i * 0.25}s` }}
                >
                  <div
                    className="text-5xl font-extrabold bg-clip-text text-transparent"
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, hsl(234 62% 62%), hsl(260 70% 65%))",
                    }}
                  >
                    {s.num}
                  </div>
                  <div className="text-white/60 mt-2 text-sm">{s.label}</div>
                </div>
              ))}
            </div>
            <div
              className="max-w-xl mx-auto rounded-2xl border border-white/10 bg-white/[0.03] p-6 animate-promo-fade-up"
              style={{ animationDelay: "1.2s" }}
            >
              <p className="text-white/90 text-lg italic leading-relaxed">
                "Planned our Bali honeymoon in 3 minutes. Would have taken
                hours on my own."
              </p>
              <p className="text-white/50 text-sm mt-3">— Sofia, honeymooner</p>
            </div>
          </div>
        </div>
      )}

      {/* SCENE 7: CTA */}
      {scene === "cta" && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background:
              "radial-gradient(ellipse at center, hsl(234 62% 30%) 0%, hsl(234 62% 15%) 60%, black 100%)",
          }}
        >
          <div className="text-center px-8">
            <p
              className="text-white/70 text-xl mb-4 animate-promo-fade-up"
            >
              Your next trip
            </p>
            <h2
              className="text-white text-7xl font-extrabold tracking-tight leading-[1.1] animate-promo-fade-up"
              style={{ animationDelay: "0.5s" }}
            >
              is one message
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(135deg, hsl(234 62% 72%), hsl(260 70% 75%))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                away.
              </span>
            </h2>
          </div>
        </div>
      )}

      {/* SCENE 8: END CARD */}
      {scene === "end" && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background:
              "radial-gradient(ellipse at center, hsl(234 62% 25%) 0%, hsl(234 62% 8%) 50%, black 100%)",
          }}
        >
          <div className="text-center">
            <div className="mb-6 flex justify-center animate-promo-zoom-in">
              <div
                className="w-28 h-28 rounded-[1.75rem] flex items-center justify-center shadow-[0_0_80px_hsl(234_62%_60%/0.5)]"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
                }}
              >
                <LogoMark size={60} color="white" />
              </div>
            </div>
            <h2
              className="text-white text-6xl font-extrabold tracking-tight animate-promo-fade-up"
              style={{ animationDelay: "0.3s" }}
            >
              Jolliday
            </h2>
            <p
              className="mt-6 text-white/80 text-2xl font-semibold animate-promo-fade-up"
              style={{ animationDelay: "0.7s" }}
            >
              jolliday.online
            </p>
            <p
              className="mt-4 text-white/50 text-base animate-promo-fade-up"
              style={{ animationDelay: "1s" }}
            >
              Try free · 3-day trial
            </p>
          </div>
        </div>
      )}

      {/* Hidden start button if autoplay didn't kick in */}
      {!playing && progress === 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black">
          <Button
            onClick={() => setPlaying(true)}
            size="lg"
            className="h-16 px-10 rounded-full gap-3 text-lg font-bold"
            style={{
              background:
                "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
            }}
          >
            <Play className="h-5 w-5 fill-white" /> Play promo
          </Button>
        </div>
      )}
    </div>
  );
};

export default Promo;
