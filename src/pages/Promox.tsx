import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Plane,
  Hotel,
  ArrowRight,
  Play,
  RotateCcw,
  Star,
  Send,
  MoreHorizontal,
  ChevronLeft,
  Clock,
  MapPin,
} from "lucide-react";
import Logo, { LogoMark } from "@/components/Logo";
import { Button } from "@/components/ui/button";

/**
 * /promox — TikTok-ready vertical promo.
 *
 * Approach: Frame the entire promo as a REAL phone screen recording of
 * someone using Jolliday. More authentic, more share-worthy.
 *
 * Structure:
 * 1. HOOK — bold overlay text over blurred tokyo footage
 * 2. PHONE START — the "recording starts", shows Jolliday chat
 * 3. USER TYPES — typewriter in real chat UI
 * 4. AI RESPONDS — streaming reveal
 * 5. CARDS STREAM IN — itinerary, hotel, flight cards in chat
 * 6. MAP REVEAL
 * 7. PAYOFF text overlay
 * 8. CTA
 */

type Scene = "hook" | "chat-type" | "chat-ai" | "chat-itinerary" | "chat-hotel" | "map" | "payoff" | "end";

const SCENE_DURATIONS: Record<Scene, number> = {
  hook: 2200,
  "chat-type": 4500,
  "chat-ai": 3800,
  "chat-itinerary": 7500,
  "chat-hotel": 5000,
  map: 4800,
  payoff: 3200,
  end: 3000,
};

const SCENE_ORDER: Scene[] = [
  "hook",
  "chat-type",
  "chat-ai",
  "chat-itinerary",
  "chat-hotel",
  "map",
  "payoff",
  "end",
];

const TOTAL_DURATION = SCENE_ORDER.reduce(
  (sum, s) => sum + SCENE_DURATIONS[s],
  0
);

const TOKYO = {
  shibuya: "https://images.unsplash.com/photo-1554797589-7241bb691973?w=600&h=800&q=80&auto=format&fit=crop",
  senso: "https://images.unsplash.com/photo-1528164344705-47542687000d?w=600&h=800&q=80&auto=format&fit=crop",
  sushi: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&h=800&q=80&auto=format&fit=crop",
  shinjuku: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=800&q=80&auto=format&fit=crop",
  hotel: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&q=80&auto=format&fit=crop",
  hero: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=900&h=1600&q=80&auto=format&fit=crop",
};

const PROMPT_TEXT = "4 days in Tokyo, love food 🍣";

const ITINERARY = [
  { day: "Day 1", title: "Shibuya", image: TOKYO.shibuya, tag: "Arrive · Neon streets" },
  { day: "Day 2", title: "Senso-ji", image: TOKYO.senso, tag: "Culture · Temples" },
  { day: "Day 3", title: "Tsukiji", image: TOKYO.sushi, tag: "Sushi · Markets" },
  { day: "Day 4", title: "Shinjuku", image: TOKYO.shinjuku, tag: "Nightlife · Views" },
];

const Promox = () => {
  const [scene, setScene] = useState<Scene>("hook");
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const urls = Object.values(TOKYO);
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
    setScene("hook");
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
    if (scene !== "chat-type") return;
    setTypedText("");
    const chars = [...PROMPT_TEXT];
    let i = 0;
    // Delay 600ms so user sees the empty chat first
    const startDelay = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setTypedText(chars.slice(0, i).join(""));
        if (i >= chars.length) clearInterval(interval);
      }, 80);
      (startDelay as any).interval = interval;
    }, 600);
    return () => {
      clearTimeout(startDelay);
      if ((startDelay as any).interval) clearInterval((startDelay as any).interval);
    };
  }, [scene]);

  const replay = () => startPlayback();

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
            <p className="text-white/60 mb-8">TikTok cut · ~34s</p>
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

  // Shared chat frame used across chat-* scenes so it feels continuous
  const ChatFrame = ({
    children,
    showTyping = false,
    inputValue = "",
    withCursor = false,
  }: {
    children?: React.ReactNode;
    showTyping?: boolean;
    inputValue?: string;
    withCursor?: boolean;
  }) => (
    <div className="absolute inset-0 bg-white flex flex-col">
      {/* Status bar mock */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2 text-[11px] font-semibold text-foreground">
        <span>9:41</span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-sm border border-foreground/60 flex items-center justify-end pr-0.5">
            <span className="w-1.5 h-1 bg-foreground/80 rounded-sm" />
          </span>
        </span>
      </div>

      {/* Chat header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
        <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{
            background:
              "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
          }}
        >
          <LogoMark size={16} color="white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground leading-tight">
            Jolliday
          </p>
          <p className="text-[10px] text-green-600 font-medium leading-tight">
            ● online
          </p>
        </div>
        <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Chat body */}
      <div className="flex-1 overflow-hidden px-3 py-4 space-y-2.5">
        {children}
      </div>

      {/* Input bar */}
      <div className="border-t border-border px-3 py-2.5 bg-white">
        <div className="flex items-center gap-2 rounded-full border-2 border-border px-4 py-2 bg-white relative">
          <div className="flex-1 text-sm text-foreground min-h-[20px] relative">
            {inputValue ? (
              <span>
                {inputValue}
                {withCursor && (
                  <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse align-middle" />
                )}
              </span>
            ) : (
              <span className="text-muted-foreground/50">Message Jolliday…</span>
            )}
          </div>
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-md transition-all ${
              inputValue ? "animate-promo-button-pulse" : "opacity-40"
            }`}
            style={{
              background: inputValue
                ? "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))"
                : "hsl(0 0% 90%)",
            }}
          >
            <Send
              className={`h-4 w-4 ${inputValue ? "text-white" : "text-muted-foreground"}`}
            />
          </div>
        </div>
        {showTyping && (
          <p className="text-[10px] text-muted-foreground text-center mt-1.5">
            Press send to plan your trip
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      <div className="relative overflow-hidden select-none" style={frameStyle}>
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-50 pointer-events-none">
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
                jolliday.online
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
                    Try Jolliday <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 1: HOOK — bold POV claim over slowly-zooming Tokyo footage */}
        {scene === "hook" && (
          <div className="absolute inset-0 overflow-hidden bg-black">
            <img
              src={TOKYO.hero}
              alt=""
              className="absolute inset-0 w-full h-full object-cover animate-promo-hook-zoom"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/85" />

            {/* Top "POV:" label */}
            <div className="absolute top-12 left-0 right-0 flex justify-center animate-promo-hook-badge">
              <div className="px-4 py-1.5 rounded-full bg-red-500 text-white text-xs font-black uppercase tracking-widest">
                ● POV
              </div>
            </div>

            {/* Centered big text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <h1
                className="text-white font-black tracking-[-0.03em] leading-[0.95] animate-promo-hook-text"
                style={{
                  fontSize: "clamp(2.5rem, 12vw, 4.5rem)",
                  textShadow: "0 4px 30px rgba(0,0,0,0.4)",
                }}
              >
                i planned
                <br />
                my whole
                <br />
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(40 100% 60%), hsl(340 90% 60%))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    paddingBottom: "0.1em",
                    display: "inline-block",
                  }}
                >
                  tokyo trip
                </span>
              </h1>
              <p
                className="mt-6 text-white text-3xl font-black animate-promo-hook-subtext"
                style={{
                  animationDelay: "0.7s",
                  textShadow: "0 2px 20px rgba(0,0,0,0.6)",
                }}
              >
                in <span className="text-yellow-300 underline decoration-4 underline-offset-4">60 seconds</span>
              </p>
            </div>

            {/* Bottom caption */}
            <div
              className="absolute bottom-10 left-0 right-0 text-center px-8 animate-promo-fade-up"
              style={{ animationDelay: "1.1s" }}
            >
              <p className="text-white/90 text-sm font-semibold">
                watch 👇 this is crazy
              </p>
            </div>
          </div>
        )}

        {/* SCENE 2: USER TYPING IN CHAT */}
        {scene === "chat-type" && (
          <ChatFrame
            showTyping={typedText.length === PROMPT_TEXT.length}
            inputValue={typedText}
            withCursor
          >
            {/* Empty chat — just a welcome from AI */}
            <div className="flex gap-2.5 animate-promo-fade-up">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
                }}
              >
                <LogoMark size={16} color="white" />
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm max-w-[85%]">
                Hey! Where are we heading? ✈️
              </div>
            </div>
          </ChatFrame>
        )}

        {/* SCENE 3: AI THINKING */}
        {scene === "chat-ai" && (
          <ChatFrame>
            {/* Previous AI msg */}
            <div className="flex gap-2.5 opacity-60">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
                }}
              >
                <LogoMark size={16} color="white" />
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm max-w-[85%]">
                Hey! Where are we heading? ✈️
              </div>
            </div>

            {/* User message — already sent */}
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary text-white px-4 py-2.5 text-sm">
                {PROMPT_TEXT}
              </div>
            </div>

            {/* AI thinking states */}
            <div className="flex gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
                }}
              >
                <LogoMark size={16} color="white" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div
                  className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm max-w-[90%] animate-promo-fade-up"
                  style={{ animationDelay: "0.2s" }}
                >
                  On it! 🍣 Crafting 4 days in Tokyo...
                </div>

                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-primary/5 border border-primary/10 text-xs text-primary font-medium max-w-fit animate-promo-fade-up"
                  style={{ animationDelay: "1s" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Picking neighborhoods
                </div>
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-primary/5 border border-primary/10 text-xs text-primary font-medium max-w-fit animate-promo-fade-up"
                  style={{ animationDelay: "1.8s" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Finding sushi spots
                </div>
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-primary/5 border border-primary/10 text-xs text-primary font-medium max-w-fit animate-promo-fade-up"
                  style={{ animationDelay: "2.6s" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Pricing it out
                </div>
              </div>
            </div>
          </ChatFrame>
        )}

        {/* SCENE 4: ITINERARY — cards stream in chat */}
        {scene === "chat-itinerary" && (
          <ChatFrame>
            <div className="flex gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
                }}
              >
                <LogoMark size={16} color="white" />
              </div>
              <div className="flex-1 space-y-2">
                <div
                  className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm font-semibold max-w-[95%] animate-promo-fade-up"
                >
                  ✨ Here's your 4-day Tokyo plan
                </div>
              </div>
            </div>

            {/* Itinerary grid as a chat card */}
            <div
              className="bg-gradient-to-b from-white to-[hsl(234_62%_98%)] rounded-2xl border border-border overflow-hidden shadow-lg ml-10 animate-promo-scale-in"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="p-3 border-b border-border flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="h-3 w-3 text-primary" />
                </div>
                <p className="text-xs font-bold text-foreground">
                  Tokyo · 4 days
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 p-3">
                {ITINERARY.map((d, i) => (
                  <div
                    key={d.day}
                    className="rounded-xl overflow-hidden relative aspect-[3/4] animate-promo-card-drop-slow"
                    style={{ animationDelay: `${0.7 + i * 0.9}s` }}
                  >
                    <img
                      src={d.image}
                      alt={d.title}
                      className="w-full h-full object-cover animate-promo-ken-burns"
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-white/95 text-[9px] font-bold text-primary uppercase tracking-wider">
                      {d.day}
                    </div>
                    <div className="absolute inset-x-1.5 bottom-1.5">
                      <p className="text-white text-xs font-extrabold leading-tight">
                        {d.title}
                      </p>
                      <p className="text-white/70 text-[8px] leading-tight mt-0.5">
                        {d.tag}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ChatFrame>
        )}

        {/* SCENE 5: HOTEL + FLIGHT cards in chat */}
        {scene === "chat-hotel" && (
          <ChatFrame>
            <div className="flex gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
                }}
              >
                <LogoMark size={16} color="white" />
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm font-semibold max-w-[90%] animate-promo-fade-up">
                And here's your flight + hotel 👇
              </div>
            </div>

            <div className="ml-10 space-y-2">
              {/* Flight card */}
              <div
                className="rounded-2xl border border-border bg-white shadow-md p-3 animate-promo-smooth-rise"
                style={{ animationDelay: "0.4s" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-sky-50 flex items-center justify-center">
                    <Plane className="h-3 w-3 text-sky-600" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    Flight · ANA
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-lg font-extrabold text-foreground leading-none">
                      JFK
                    </p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      7:45 PM
                    </p>
                  </div>
                  <div className="flex-1 mx-3 relative">
                    <div className="h-px bg-border" />
                    <Plane className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 text-primary" />
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-extrabold text-foreground leading-none">
                      HND
                    </p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      11:20 PM+1
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-[9px] text-muted-foreground">
                    Direct · 14h 05m
                  </span>
                  <span className="text-sm font-extrabold text-primary">
                    $612
                  </span>
                </div>
              </div>

              {/* Hotel card */}
              <div
                className="rounded-2xl border border-border bg-white shadow-md overflow-hidden animate-promo-smooth-rise"
                style={{ animationDelay: "0.85s" }}
              >
                <div className="aspect-[16/9] relative overflow-hidden bg-muted">
                  <img
                    src={TOKYO.hotel}
                    alt="Hotel"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-white/95 text-[9px] font-bold text-primary uppercase tracking-wider inline-flex items-center gap-1">
                    <Hotel className="h-2.5 w-2.5" /> Hotel
                  </div>
                </div>
                <div className="p-2.5">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-xs font-bold text-foreground">
                      Shibuya Granbell
                    </h3>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                      <span className="text-[10px] font-semibold">4.6</span>
                    </div>
                  </div>
                  <p className="text-[9px] text-muted-foreground mb-1.5">
                    Shibuya · 5 min to station
                  </p>
                  <div className="flex items-center justify-between pt-1.5 border-t border-border">
                    <span className="text-[9px] text-muted-foreground">
                      4 nights
                    </span>
                    <span className="text-sm font-extrabold text-primary">
                      $388
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </ChatFrame>
        )}

        {/* SCENE 6: MAP — clean city map, no weird paths */}
        {scene === "map" && (
          <ChatFrame>
            <div className="flex gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
                }}
              >
                <LogoMark size={16} color="white" />
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm font-semibold max-w-[90%] animate-promo-fade-up">
                Every stop, pinned for you 📍
              </div>
            </div>

            {/* Map card */}
            <div
              className="ml-10 rounded-2xl overflow-hidden shadow-md border border-border animate-promo-smooth-rise"
              style={{
                animationDelay: "0.3s",
                background:
                  "linear-gradient(135deg, hsl(210 30% 94%), hsl(210 25% 88%))",
                height: "min(55%, 420px)",
              }}
            >
              {/* Fake map with districts / water / roads */}
              <div className="relative w-full h-full">
                {/* Water shape */}
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 300 400"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <pattern
                      id="streets"
                      width="20"
                      height="20"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 0 10 L 20 10 M 10 0 L 10 20"
                        stroke="hsl(210 20% 82%)"
                        strokeWidth="0.8"
                      />
                    </pattern>
                  </defs>
                  <rect width="300" height="400" fill="url(#streets)" />
                  {/* Water */}
                  <path
                    d="M 0 280 Q 80 260 150 290 T 300 320 L 300 400 L 0 400 Z"
                    fill="hsl(210 60% 85%)"
                    opacity="0.6"
                  />
                  {/* Park */}
                  <circle cx="110" cy="170" r="42" fill="hsl(120 40% 82%)" opacity="0.7" />
                  {/* Main road */}
                  <path
                    d="M 40 40 Q 100 80 150 160 T 250 340"
                    stroke="white"
                    strokeWidth="6"
                    fill="none"
                  />
                  <path
                    d="M 30 200 Q 120 220 180 200 T 300 180"
                    stroke="white"
                    strokeWidth="4"
                    fill="none"
                  />
                </svg>

                {/* District labels */}
                <span className="absolute top-[18%] left-[38%] text-[9px] font-semibold text-foreground/50 uppercase tracking-wider">
                  Shinjuku
                </span>
                <span className="absolute top-[42%] left-[22%] text-[9px] font-semibold text-foreground/50 uppercase tracking-wider">
                  Shibuya
                </span>
                <span className="absolute top-[58%] left-[58%] text-[9px] font-semibold text-foreground/50 uppercase tracking-wider">
                  Asakusa
                </span>

                {/* Pins */}
                {[
                  { top: "45%", left: "28%", day: 1, label: "Shibuya", delay: 0.6 },
                  { top: "62%", left: "55%", day: 2, label: "Senso-ji", delay: 1.0 },
                  { top: "72%", left: "40%", day: 3, label: "Tsukiji", delay: 1.4 },
                  { top: "22%", left: "48%", day: 4, label: "Shinjuku", delay: 1.8 },
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
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white mb-1 whitespace-nowrap shadow-md"
                        style={{
                          background:
                            "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
                        }}
                      >
                        {pin.label}
                      </div>
                      <div
                        className="w-7 h-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] font-black"
                        style={{
                          background:
                            "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
                        }}
                      >
                        {pin.day}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ChatFrame>
        )}

        {/* SCENE 7: PAYOFF — big text reveal */}
        {scene === "payoff" && (
          <div
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
            style={{
              background:
                "radial-gradient(ellipse at center, hsl(234 62% 30%) 0%, hsl(234 62% 12%) 60%, black 100%)",
            }}
          >
            <div className="text-center px-6">
              <p
                className="text-white/60 text-base font-semibold uppercase tracking-[0.2em] mb-5 animate-promo-fade-up"
              >
                No tabs. No stress.
              </p>
              <h2
                className="text-white font-black tracking-[-0.03em] leading-[0.95] animate-promo-blur-in"
                style={{
                  fontSize: "clamp(3rem, 13vw, 5rem)",
                  animationDelay: "0.2s",
                }}
              >
                Just
                <br />
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(40 100% 60%), hsl(340 90% 60%))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    paddingBottom: "0.1em",
                    display: "inline-block",
                  }}
                >
                  Jolliday.
                </span>
              </h2>
              <p
                className="mt-6 text-white/90 text-xl font-bold animate-promo-fade-up"
                style={{ animationDelay: "0.8s" }}
              >
                try it free 👇
              </p>
            </div>
          </div>
        )}

        {/* SCENE 8: END */}
        {scene === "end" && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background:
                "radial-gradient(ellipse at center, hsl(234 62% 25%) 0%, hsl(234 62% 6%) 60%, black 100%)",
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
                className="text-white text-5xl font-black tracking-tight animate-promo-fade-up"
                style={{ animationDelay: "0.15s" }}
              >
                Jolliday
              </h2>
              <p
                className="mt-5 text-white text-2xl font-bold animate-promo-fade-up"
                style={{ animationDelay: "0.4s" }}
              >
                jolliday.online
              </p>
              <p
                className="mt-4 text-white/60 text-sm animate-promo-fade-up"
                style={{ animationDelay: "0.65s" }}
              >
                link in bio 👆
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Promox;
