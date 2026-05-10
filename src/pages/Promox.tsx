import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Plane,
  Hotel,
  MapPin,
  Sparkles,
  ArrowRight,
  Play,
  RotateCcw,
  Star,
} from "lucide-react";
import Logo, { LogoMark } from "@/components/Logo";
import { Button } from "@/components/ui/button";

/**
 * /promox — 9:16 vertical promo, optimized for phone recording
 * (TikTok, Reels, Shorts). Record full-screen on iPhone/Android or
 * use Chrome's device emulation (iPhone 14 Pro) + screen recorder.
 */

type Scene =
  | "intro"
  | "problem"
  | "typing"
  | "chat"
  | "itinerary"
  | "hotel"
  | "map"
  | "cta"
  | "end";

const SCENE_DURATIONS: Record<Scene, number> = {
  intro: 2500,
  problem: 3000,
  typing: 4500,
  chat: 4800,
  itinerary: 8000,
  hotel: 5000,
  map: 5000,
  cta: 3000,
  end: 3500,
};

const SCENE_ORDER: Scene[] = [
  "intro",
  "problem",
  "typing",
  "chat",
  "itinerary",
  "hotel",
  "map",
  "cta",
  "end",
];

const TOTAL_DURATION = SCENE_ORDER.reduce(
  (sum, s) => sum + SCENE_DURATIONS[s],
  0
);

const TOKYO_IMAGES = {
  shibuya:
    "https://images.unsplash.com/photo-1554797589-7241bb691973?w=600&h=800&q=80&auto=format&fit=crop",
  senso:
    "https://images.unsplash.com/photo-1528164344705-47542687000d?w=600&h=800&q=80&auto=format&fit=crop",
  sushi:
    "https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&h=800&q=80&auto=format&fit=crop",
  shinjuku:
    "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=800&q=80&auto=format&fit=crop",
  harajuku:
    "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&h=800&q=80&auto=format&fit=crop",
  hotel:
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&q=80&auto=format&fit=crop",
};

const PROMPT_TEXT = "5 days in Tokyo, love food 🍣";

const Promox = () => {
  const [scene, setScene] = useState<Scene>("intro");
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const urls = Object.values(TOKYO_IMAGES);
    let loaded = 0;
    urls.forEach((url) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        loaded++;
        if (loaded === urls.length) setImagesLoaded(true);
      };
      img.src = url;
    });
    const t = setTimeout(() => setImagesLoaded(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const startPlayback = () => {
    setScene("intro");
    setProgress(0);
    setPlaying(true);
  };

  useEffect(() => {
    if (!playing || !imagesLoaded) return;

    let elapsed = 0;
    startTimeRef.current = performance.now();

    const timeouts: NodeJS.Timeout[] = [];
    SCENE_ORDER.forEach((s, i) => {
      if (i === 0) return;
      elapsed += SCENE_DURATIONS[SCENE_ORDER[i - 1]];
      const t = setTimeout(() => setScene(s), elapsed);
      timeouts.push(t);
    });

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
  }, [playing, imagesLoaded]);

  useEffect(() => {
    if (scene !== "typing") return;
    setTypedText("");
    const chars = [...PROMPT_TEXT];
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTypedText(chars.slice(0, i).join(""));
      if (i >= chars.length) clearInterval(interval);
    }, 85);
    return () => clearInterval(interval);
  }, [scene]);

  const replay = () => startPlayback();

  // 9:16 frame: uses min of 100vw or (100vh * 9/16) so it always fits screen
  // On phone it fills the screen. On desktop, shows as phone-framed box with black bars.
  const frameStyle = {
    width: "min(100vw, calc(100vh * 9 / 16))",
    height: "min(100vh, calc(100vw * 16 / 9))",
    aspectRatio: "9 / 16",
  };

  if (!playing && progress === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
        <div
          className="relative flex flex-col items-center justify-center overflow-hidden"
          style={{
            ...frameStyle,
            background:
              "radial-gradient(ellipse at center, hsl(234 62% 25%) 0%, hsl(234 62% 8%) 60%, black 100%)",
          }}
        >
          <div className="text-center px-6">
            <div className="mb-8 flex justify-center">
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-[0_0_80px_hsl(234_62%_60%/0.5)]"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
                }}
              >
                <LogoMark size={54} color="white" />
              </div>
            </div>
            <h1 className="text-white text-5xl font-extrabold tracking-tight mb-3">
              Jolliday
            </h1>
            <p className="text-white/60 mb-8">A quick tour</p>
            <Button
              onClick={startPlayback}
              disabled={!imagesLoaded}
              size="lg"
              className="h-14 px-8 rounded-full gap-3 text-base font-bold"
              style={{
                background:
                  "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
              }}
            >
              <Play className="h-5 w-5 fill-white" />
              {imagesLoaded ? "Play" : "Loading…"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      <div
        className="relative overflow-hidden select-none"
        style={frameStyle}
      >
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

        {!playing && progress >= 100 && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="text-center px-6">
              <div className="mb-8 flex justify-center">
                <Logo size="xl" variant="mark-only" />
              </div>
              <h2 className="text-white text-3xl font-bold mb-8">
                That's Jolliday.
              </h2>
              <div className="flex flex-col gap-3">
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
                    className="h-12 px-6 rounded-full gap-2 w-full"
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

        {/* SCENE 1: INTRO */}
        {scene === "intro" && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background:
                "radial-gradient(ellipse at center, hsl(234 62% 25%) 0%, hsl(234 62% 10%) 60%, black 100%)",
            }}
          >
            <div className="text-center animate-promo-blur-in">
              <div className="mb-8 flex justify-center">
                <div
                  className="w-32 h-32 rounded-[2rem] flex items-center justify-center shadow-[0_0_100px_hsl(234_62%_60%/0.6)] animate-promo-spin-in"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
                  }}
                >
                  <LogoMark size={72} color="white" />
                </div>
              </div>
              <h1
                className="text-white text-7xl font-extrabold tracking-tight animate-promo-fade-up"
                style={{ animationDelay: "0.3s" }}
              >
                Jolliday
              </h1>
              <p
                className="mt-4 text-white/60 text-xl animate-promo-fade-up"
                style={{ animationDelay: "0.6s" }}
              >
                AI Trip Planner
              </p>
            </div>
          </div>
        )}

        {/* SCENE 2: PROBLEM — vertical stacked tabs */}
        {scene === "problem" && (
          <div className="absolute inset-0 flex items-center justify-center bg-[hsl(0_0%_6%)]">
            <div className="w-full px-6 text-center">
              <div className="flex flex-col gap-2 mb-10 max-w-[260px] mx-auto">
                {[
                  "Kayak",
                  "Booking",
                  "Skyscanner",
                  "Airbnb",
                  "Expedia",
                ].map((tab, i) => (
                  <div
                    key={tab}
                    className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/40 text-base font-medium animate-promo-tab-fly"
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    {tab}
                  </div>
                ))}
              </div>
              <h2
                className="text-white text-4xl font-extrabold tracking-tight animate-promo-fade-up leading-tight"
                style={{ animationDelay: "0.7s" }}
              >
                Planning a trip?
              </h2>
              <h2
                className="mt-3 text-4xl font-extrabold tracking-tight animate-promo-fade-up leading-tight"
                style={{
                  animationDelay: "1.2s",
                  background:
                    "linear-gradient(135deg, hsl(234 62% 62%), hsl(260 70% 65%))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  paddingBottom: "0.2em",
                }}
              >
                Just ask Jolliday.
              </h2>
            </div>
          </div>
        )}

        {/* SCENE 3: TYPING */}
        {scene === "typing" && (
          <div className="absolute inset-0 flex items-center justify-center bg-white px-4">
            <div className="w-full text-center">
              <h2 className="text-5xl font-extrabold tracking-tight text-foreground mb-10 animate-promo-fade-up">
                Any trip.
                <br />
                In one chat.
              </h2>

              <div
                className="rounded-2xl border-2 border-primary bg-white shadow-2xl shadow-primary/20 overflow-hidden animate-promo-scale-in"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="px-5 pt-5 pb-3 text-left min-h-[110px]">
                  <p className="text-lg text-foreground leading-relaxed">
                    {typedText}
                    <span className="inline-block w-0.5 h-5 bg-primary ml-0.5 animate-pulse align-middle" />
                  </p>
                </div>
                <div className="flex items-center justify-end px-3 pb-3">
                  <div
                    className="h-10 px-5 rounded-xl flex items-center gap-2 font-semibold text-white shadow-md text-sm"
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

        {/* SCENE 4: CHAT — phone-native feel */}
        {scene === "chat" && (
          <div className="absolute inset-0 flex items-center justify-center bg-white px-4">
            <div className="w-full">
              <div className="flex justify-end mb-5 animate-promo-slide-in-right">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary text-white px-4 py-3 text-base">
                  {PROMPT_TEXT}
                </div>
              </div>

              <div
                className="flex gap-2.5 animate-promo-fade-up"
                style={{ animationDelay: "0.3s" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
                  }}
                >
                  <LogoMark size={20} color="white" />
                </div>
                <div className="flex-1 space-y-2">
                  <div
                    className="animate-promo-slide-in-left bg-muted/50 rounded-xl px-3 py-2 inline-flex items-center gap-2 text-sm text-muted-foreground"
                    style={{ animationDelay: "0.6s" }}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                    <span className="font-medium">Picking neighborhoods…</span>
                  </div>
                  <div
                    className="animate-promo-slide-in-left bg-muted/50 rounded-xl px-3 py-2 inline-flex items-center gap-2 text-sm text-muted-foreground"
                    style={{ animationDelay: "1.5s" }}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                    <span className="font-medium">Finding sushi spots…</span>
                  </div>
                  <div
                    className="animate-promo-slide-in-left bg-muted/50 rounded-xl px-3 py-2 inline-flex items-center gap-2 text-sm text-muted-foreground"
                    style={{ animationDelay: "2.4s" }}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                    <span className="font-medium">Pricing it out…</span>
                  </div>
                  <div
                    className="animate-promo-scale-in rounded-xl px-4 py-3 inline-flex items-center gap-2 text-sm font-semibold text-white shadow-lg"
                    style={{
                      animationDelay: "3.3s",
                      background:
                        "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
                    }}
                  >
                    ✨ Your Tokyo trip is ready
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 5: ITINERARY — vertical 2x3 grid, bigger cards */}
        {scene === "itinerary" && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center px-4"
            style={{
              background:
                "linear-gradient(180deg, hsl(0 0% 99%) 0%, hsl(234 62% 97%) 100%)",
            }}
          >
            <div className="text-center mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 animate-promo-fade-up">
                Your Tokyo itinerary
              </p>
              <h2
                className="text-3xl font-extrabold tracking-tight text-foreground animate-promo-fade-up"
                style={{ animationDelay: "0.2s" }}
              >
                Day by day.
                <br />
                Planned.
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full max-w-[380px]">
              {[
                {
                  day: "Day 1",
                  title: "Shibuya",
                  image: TOKYO_IMAGES.shibuya,
                  tag: "Neon · Streets",
                },
                {
                  day: "Day 2",
                  title: "Senso-ji",
                  image: TOKYO_IMAGES.senso,
                  tag: "Culture · History",
                },
                {
                  day: "Day 3",
                  title: "Tsukiji",
                  image: TOKYO_IMAGES.sushi,
                  tag: "Sushi · Seafood",
                },
                {
                  day: "Day 4",
                  title: "Shinjuku",
                  image: TOKYO_IMAGES.shinjuku,
                  tag: "Nightlife",
                },
              ].map((d, i) => (
                <div
                  key={d.day}
                  className="rounded-2xl overflow-hidden bg-white border border-border shadow-lg animate-promo-card-drop-slow"
                  style={{ animationDelay: `${0.7 + i * 0.7}s` }}
                >
                  <div className="aspect-[3/4] relative overflow-hidden bg-muted">
                    <img
                      src={d.image}
                      alt={d.title}
                      className="w-full h-full object-cover animate-promo-ken-burns"
                      loading="eager"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-sm text-[10px] font-bold text-primary uppercase tracking-wider">
                      {d.day}
                    </div>
                    <div className="absolute inset-x-2 bottom-2">
                      <p className="text-white text-base font-extrabold leading-tight">
                        {d.title}
                      </p>
                      <p className="text-white/80 text-[10px] mt-0.5">
                        {d.tag}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SCENE 6: HOTEL + FLIGHT — stacked vertically */}
        {scene === "hotel" && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center px-4"
            style={{
              background:
                "linear-gradient(180deg, hsl(234 62% 98%) 0%, hsl(0 0% 100%) 100%)",
            }}
          >
            <h2 className="text-center text-3xl font-extrabold tracking-tight text-foreground mb-6 animate-promo-fade-up">
              Real flights.
              <br />
              Real prices.
            </h2>

            <div className="w-full max-w-[360px] space-y-3">
              {/* Flight */}
              <div
                className="rounded-2xl border border-border bg-white shadow-xl p-4 animate-promo-smooth-rise"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                    <Plane className="h-3.5 w-3.5 text-sky-600" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Flight
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xl font-extrabold text-foreground">
                      JFK
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      7:45 PM
                    </p>
                  </div>
                  <div className="flex-1 mx-3 relative">
                    <div className="h-px bg-border" />
                    <Plane className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-extrabold text-foreground">
                      HND
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      11:20 PM+1
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-[10px] text-muted-foreground">
                    ANA · 14h 05m
                  </span>
                  <span className="text-base font-extrabold text-primary">
                    $612
                  </span>
                </div>
              </div>

              {/* Hotel */}
              <div
                className="rounded-2xl border border-border bg-white shadow-xl overflow-hidden animate-promo-smooth-rise"
                style={{ animationDelay: "0.7s" }}
              >
                <div className="aspect-[16/9] relative overflow-hidden bg-muted">
                  <img
                    src={TOKYO_IMAGES.hotel}
                    alt="Hotel"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-white/95 text-[10px] font-bold text-primary uppercase tracking-wider inline-flex items-center gap-1">
                    <Hotel className="h-3 w-3" /> Hotel
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-sm font-bold text-foreground">
                      Shibuya Granbell
                    </h3>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-semibold">4.6</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-2">
                    Shibuya · 5 min to station
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-[10px] text-muted-foreground">
                      5 nights
                    </span>
                    <span className="text-base font-extrabold text-primary">
                      $485
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 7: MAP — square map for vertical */}
        {scene === "map" && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center px-4"
            style={{
              background:
                "linear-gradient(180deg, hsl(234 62% 8%) 0%, hsl(234 62% 3%) 100%)",
            }}
          >
            <h2 className="text-white text-3xl font-extrabold tracking-tight mb-6 text-center animate-promo-fade-up">
              See it all
              <br />
              on a map
            </h2>

            <div
              className="relative rounded-3xl overflow-hidden border border-white/10 animate-promo-fade-up aspect-square w-full max-w-[340px]"
              style={{
                animationDelay: "0.15s",
                background:
                  "linear-gradient(135deg, hsl(234 40% 18%), hsl(234 30% 10%))",
              }}
            >
              <svg
                className="absolute inset-0 w-full h-full opacity-30"
                viewBox="0 0 400 400"
                preserveAspectRatio="none"
              >
                <defs>
                  <pattern
                    id="grid-x"
                    width="30"
                    height="30"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 30 0 L 0 0 0 30"
                      fill="none"
                      stroke="hsl(234 40% 40%)"
                      strokeWidth="0.5"
                    />
                  </pattern>
                </defs>
                <rect width="400" height="400" fill="url(#grid-x)" />
                <path
                  d="M 80 100 Q 160 140 200 180 T 280 240 T 320 320"
                  fill="none"
                  stroke="hsl(234 62% 62%)"
                  strokeWidth="2.5"
                  strokeDasharray="6 6"
                  className="animate-promo-dash"
                />
              </svg>

              {[
                { top: "22%", left: "20%", day: "1", label: "Shibuya", delay: 0.3 },
                { top: "40%", left: "42%", day: "2", label: "Senso-ji", delay: 0.6 },
                { top: "58%", left: "55%", day: "3", label: "Tsukiji", delay: 0.9 },
                { top: "72%", left: "70%", day: "4", label: "Shinjuku", delay: 1.2 },
                { top: "85%", left: "82%", day: "5", label: "Harajuku", delay: 1.5 },
              ].map((pin) => (
                <div
                  key={pin.day}
                  className="absolute -translate-x-1/2 -translate-y-full animate-promo-pin-drop"
                  style={{
                    top: pin.top,
                    left: pin.left,
                    animationDelay: `${pin.delay}s`,
                  }}
                >
                  <div className="relative flex flex-col items-center">
                    <div
                      className="px-2 py-0.5 rounded-md text-[9px] font-bold text-white mb-1 whitespace-nowrap shadow-lg"
                      style={{
                        background:
                          "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
                      }}
                    >
                      Day {pin.day} · {pin.label}
                    </div>
                    <div
                      className="w-7 h-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                      style={{
                        background:
                          "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
                      }}
                    >
                      <MapPin className="h-3.5 w-3.5 text-white fill-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p
              className="mt-6 text-white/60 text-sm text-center animate-promo-fade-up"
              style={{ animationDelay: "1.8s" }}
            >
              Every stop pinned.
            </p>
          </div>
        )}

        {/* SCENE 8: CTA */}
        {scene === "cta" && (
          <div
            className="absolute inset-0 flex items-center justify-center px-6"
            style={{
              background:
                "radial-gradient(ellipse at center, hsl(234 62% 30%) 0%, hsl(234 62% 15%) 60%, black 100%)",
            }}
          >
            <div className="text-center">
              <p className="text-white/70 text-base mb-3 animate-promo-fade-up">
                Your next trip
              </p>
              <h2
                className="text-white text-5xl font-extrabold tracking-tight leading-[1.1] animate-promo-blur-in"
                style={{ animationDelay: "0.3s" }}
              >
                is one
                <br />
                message
                <br />
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(234 62% 72%), hsl(260 70% 75%))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    paddingBottom: "0.2em",
                    display: "inline-block",
                  }}
                >
                  away.
                </span>
              </h2>
            </div>
          </div>
        )}

        {/* SCENE 9: END */}
        {scene === "end" && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background:
                "radial-gradient(ellipse at center, hsl(234 62% 25%) 0%, hsl(234 62% 8%) 50%, black 100%)",
            }}
          >
            <div className="text-center px-6">
              <div className="mb-6 flex justify-center animate-promo-spin-in">
                <div
                  className="w-28 h-28 rounded-3xl flex items-center justify-center shadow-[0_0_100px_hsl(234_62%_60%/0.6)]"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
                  }}
                >
                  <LogoMark size={64} color="white" />
                </div>
              </div>
              <h2
                className="text-white text-5xl font-extrabold tracking-tight animate-promo-fade-up"
                style={{ animationDelay: "0.2s" }}
              >
                Jolliday
              </h2>
              <p
                className="mt-6 text-white text-xl font-semibold animate-promo-fade-up"
                style={{ animationDelay: "0.5s" }}
              >
                jolliday.online
              </p>
              <p
                className="mt-3 text-white/60 text-sm animate-promo-fade-up"
                style={{ animationDelay: "0.75s" }}
              >
                Try free
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Promox;
