import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Plane,
  Hotel,
  MapPin,
  Sparkles,
  ArrowRight,
  Utensils,
  Check,
  Play,
  RotateCcw,
  Star,
  Clock,
  Sun,
  Moon,
  Volume2,
} from "lucide-react";
import Logo, { LogoMark } from "@/components/Logo";
import { Button } from "@/components/ui/button";

/**
 * /promo — cinematic showcase with high-quality synthesized sound FX.
 * No voice-over, no music — just crisp, purposeful sound design.
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

// Paced for feel — snappy where it matters, room to breathe where visuals shine
const SCENE_DURATIONS: Record<Scene, number> = {
  intro: 2800,
  problem: 3200,
  typing: 4800,
  chat: 5000,
  itinerary: 6500,
  hotel: 5500,
  map: 5800,
  cta: 3500,
  end: 3800,
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
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=450&q=80&auto=format&fit=crop",
};

const PROMPT_TEXT = "5 days in Tokyo for a couple, love food 🍣";

/**
 * High-quality sound synthesis toolkit.
 * All sounds generated procedurally via Web Audio API — no files required.
 */
class SoundFX {
  ctx: AudioContext;
  master: GainNode;
  noiseBuffer: AudioBuffer;

  constructor() {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.6;
    this.master.connect(this.ctx.destination);

    // Pre-generate white noise buffer for texture
    const len = this.ctx.sampleRate * 1;
    this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  resume() {
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  // Mechanical keyboard click — short, crisp, slightly detuned per press
  typeClick() {
    const now = this.ctx.currentTime;
    const freq = 1800 + Math.random() * 800;

    // Body: short sine ping
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.03);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + 0.05);

    // Click: short noise burst through high-pass
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 3000;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.0001, now);
    ng.gain.exponentialRampToValueAtTime(0.05, now + 0.001);
    ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
    noise.connect(hp).connect(ng).connect(this.master);
    noise.start(now);
    noise.stop(now + 0.03);
  }

  // Cinematic whoosh — filtered noise sweeping low→high + sub bump
  whoosh() {
    const now = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(400, now);
    bp.frequency.exponentialRampToValueAtTime(4000, now + 0.45);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.0001, now);
    ng.gain.exponentialRampToValueAtTime(0.22, now + 0.08);
    ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    noise.connect(bp).connect(ng).connect(this.master);
    noise.start(now);
    noise.stop(now + 0.65);

    // Sub thump
    const sub = this.ctx.createOscillator();
    const sg = this.ctx.createGain();
    sub.type = "sine";
    sub.frequency.setValueAtTime(80, now);
    sub.frequency.exponentialRampToValueAtTime(40, now + 0.25);
    sg.gain.setValueAtTime(0.0001, now);
    sg.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
    sg.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    sub.connect(sg).connect(this.master);
    sub.start(now);
    sub.stop(now + 0.4);
  }

  // Sparkle — cascading high-frequency chimes (magical/AI feel)
  sparkle() {
    const now = this.ctx.currentTime;
    const notes = [1760, 2349, 2637, 3136, 3520]; // A6 D7 E7 G7 A7
    notes.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      const t0 = now + i * 0.06;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.08, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
      osc.connect(gain).connect(this.master);
      osc.start(t0);
      osc.stop(t0 + 0.55);
    });
  }

  // UI pop — bubbly chat message arrival
  pop() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.15, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Success chime — two-note "ding"
  success() {
    const now = this.ctx.currentTime;
    const notes = [
      { f: 1046, t: 0 }, // C6
      { f: 1568, t: 0.12 }, // G6
    ];
    notes.forEach(({ f, t }) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      const t0 = now + t;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55);
      osc.connect(gain).connect(this.master);
      osc.start(t0);
      osc.stop(t0 + 0.6);
    });
  }

  // Card drop — deep woody thud
  thud() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.15);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Pin drop — short "tk" click
  pin() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Deep hit — big reveal (end card)
  bigHit() {
    const now = this.ctx.currentTime;

    // Boom
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.5, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + 0.65);

    // Impact noise
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 800;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.3, now);
    ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    noise.connect(lp).connect(ng).connect(this.master);
    noise.start(now);
    noise.stop(now + 0.35);
  }
}

// Which sound each scene triggers on entry
const SCENE_SOUND: Record<Scene, keyof SoundFX | null> = {
  intro: "sparkle",
  problem: "whoosh",
  typing: "whoosh",
  chat: "pop",
  itinerary: "whoosh",
  hotel: "whoosh",
  map: "whoosh",
  cta: "whoosh",
  end: "bigHit",
};

const Promo = () => {
  const [scene, setScene] = useState<Scene>("intro");
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>();
  const sfxRef = useRef<SoundFX | null>(null);

  // Preload images
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
    if (!sfxRef.current) sfxRef.current = new SoundFX();
    sfxRef.current.resume();
    setScene("intro");
    setProgress(0);
    setPlaying(true);
    // Intro sound
    setTimeout(() => sfxRef.current?.sparkle(), 100);
  };

  // Scene transitions with sound FX
  useEffect(() => {
    if (!playing || !imagesLoaded) return;

    let elapsed = 0;
    startTimeRef.current = performance.now();

    const timeouts: NodeJS.Timeout[] = [];
    SCENE_ORDER.forEach((s, i) => {
      if (i === 0) return;
      elapsed += SCENE_DURATIONS[SCENE_ORDER[i - 1]];
      const t = setTimeout(() => {
        setScene(s);
        const sfx = sfxRef.current;
        const soundName = SCENE_SOUND[s];
        if (sfx && soundName && typeof (sfx as any)[soundName] === "function") {
          (sfx as any)[soundName]();
        }
      }, elapsed);
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

  // Typewriter with per-keystroke click sounds
  useEffect(() => {
    if (scene !== "typing") return;
    setTypedText("");
    const chars = [...PROMPT_TEXT];
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTypedText(chars.slice(0, i).join(""));
      // Click on every character (except the emoji for clean sound)
      if (i <= chars.length && chars[i - 1] !== "🍣") {
        sfxRef.current?.typeClick();
      }
      if (i >= chars.length) clearInterval(interval);
    }, 75);
    return () => clearInterval(interval);
  }, [scene]);

  // Chat scene — schedule pop + chime sounds aligned with animations
  useEffect(() => {
    if (scene !== "chat") return;
    const sfx = sfxRef.current;
    if (!sfx) return;
    // Pop already fired on scene entry (user message)
    const t1 = setTimeout(() => sfx.pop(), 900); // "Picking neighborhoods"
    const t2 = setTimeout(() => sfx.pop(), 1800); // "Finding sushi"
    const t3 = setTimeout(() => sfx.pop(), 2700); // "Pricing"
    const t4 = setTimeout(() => sfx.success(), 3600); // "Ready" chime
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [scene]);

  // Itinerary — thud per card + sparkle at end
  useEffect(() => {
    if (scene !== "itinerary") return;
    const sfx = sfxRef.current;
    if (!sfx) return;
    const timers: NodeJS.Timeout[] = [];
    for (let i = 0; i < 5; i++) {
      timers.push(setTimeout(() => sfx.thud(), 300 + i * 150));
    }
    timers.push(setTimeout(() => sfx.sparkle(), 1500));
    return () => timers.forEach(clearTimeout);
  }, [scene]);

  // Hotel — 2 pops for 2 cards
  useEffect(() => {
    if (scene !== "hotel") return;
    const sfx = sfxRef.current;
    if (!sfx) return;
    const t1 = setTimeout(() => sfx.pop(), 220);
    const t2 = setTimeout(() => sfx.pop(), 370);
    return () => [t1, t2].forEach(clearTimeout);
  }, [scene]);

  // Map — pin drop sounds
  useEffect(() => {
    if (scene !== "map") return;
    const sfx = sfxRef.current;
    if (!sfx) return;
    const delays = [300, 600, 900, 1200, 1500];
    const timers = delays.map((d) => setTimeout(() => sfx.pin(), d));
    return () => timers.forEach(clearTimeout);
  }, [scene]);

  const replay = () => {
    startPlayback();
  };

  // Pre-play screen
  if (!playing && progress === 0) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(234 62% 25%) 0%, hsl(234 62% 8%) 50%, black 100%)",
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
          <h1 className="text-white text-5xl sm:text-6xl font-extrabold tracking-tight mb-3">
            Jolliday
          </h1>
          <p className="text-white/60 mb-8">A 45-second tour</p>
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
            <Volume2 className="h-5 w-5" />
          </Button>
          <p className="mt-4 text-white/40 text-xs">Unmute for sound</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none">
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
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="text-center">
            <div className="mb-8 flex justify-center">
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

      {/* SCENE 1: INTRO */}
      {scene === "intro" && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background:
              "radial-gradient(ellipse at center, hsl(234 62% 25%) 0%, hsl(234 62% 10%) 50%, black 100%)",
          }}
        >
          <div className="text-center animate-promo-blur-in">
            <div className="mb-6 flex justify-center">
              <div
                className="w-28 h-28 rounded-[1.75rem] flex items-center justify-center shadow-[0_0_80px_hsl(234_62%_60%/0.5)] animate-promo-spin-in"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
                }}
              >
                <LogoMark size={60} color="white" />
              </div>
            </div>
            <h1
              className="text-white text-6xl sm:text-7xl font-extrabold tracking-tight animate-promo-fade-up"
              style={{ animationDelay: "0.3s" }}
            >
              Jolliday
            </h1>
            <p
              className="mt-3 text-white/60 text-lg animate-promo-fade-up"
              style={{ animationDelay: "0.55s" }}
            >
              AI Trip Planner
            </p>
          </div>
        </div>
      )}

      {/* SCENE 2: PROBLEM */}
      {scene === "problem" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[hsl(0_0%_6%)]">
          <div className="max-w-4xl px-8 text-center py-8">
            <div className="grid grid-cols-4 gap-2 mb-10">
              {[
                "Kayak",
                "Booking",
                "Skyscanner",
                "TripAdvisor",
                "Airbnb",
                "Expedia",
                "Google Flights",
                "Reddit",
              ].map((tab, i) => (
                <div
                  key={tab}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/40 text-sm truncate animate-promo-tab-fly"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {tab}
                </div>
              ))}
            </div>
            <h2
              className="text-white text-4xl sm:text-5xl font-extrabold tracking-tight animate-promo-fade-up leading-tight"
              style={{ animationDelay: "0.5s" }}
            >
              Planning a trip?
            </h2>
            <h2
              className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight animate-promo-fade-up leading-tight"
              style={{
                animationDelay: "1s",
                background:
                  "linear-gradient(135deg, hsl(234 62% 62%), hsl(260 70% 65%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                paddingBottom: "0.15em",
              }}
            >
              Just ask Jolliday.
            </h2>
          </div>
        </div>
      )}

      {/* SCENE 3: TYPING */}
      {scene === "typing" && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <div className="w-full max-w-3xl px-8 text-center">
            <h2 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-foreground mb-10 animate-promo-fade-up">
              Any trip.
              <br />
              In one chat.
            </h2>

            <div
              className="rounded-2xl border-2 border-primary bg-white shadow-2xl shadow-primary/20 overflow-hidden animate-promo-scale-in"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="px-6 pt-6 pb-4 text-left min-h-[100px]">
                <p className="text-xl text-foreground leading-relaxed">
                  {typedText}
                  <span className="inline-block w-0.5 h-6 bg-primary ml-0.5 animate-pulse align-middle" />
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

      {/* SCENE 4: CHAT */}
      {scene === "chat" && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <div className="w-full max-w-2xl px-6">
            <div className="flex justify-end mb-4 animate-promo-slide-in-right">
              <div className="max-w-sm rounded-2xl rounded-tr-sm bg-primary text-white px-4 py-3 text-sm">
                {PROMPT_TEXT}
              </div>
            </div>

            <div
              className="flex gap-3 animate-promo-fade-up"
              style={{ animationDelay: "0.3s" }}
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
              <div className="flex-1 space-y-2.5">
                <div
                  className="animate-promo-slide-in-left bg-muted/40 rounded-xl px-3 py-2 inline-flex items-center gap-2 text-xs text-muted-foreground"
                  style={{ animationDelay: "0.6s" }}
                >
                  <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                  <span className="font-medium">Picking neighborhoods…</span>
                </div>
                <div
                  className="animate-promo-slide-in-left bg-muted/40 rounded-xl px-3 py-2 inline-flex items-center gap-2 text-xs text-muted-foreground"
                  style={{ animationDelay: "1.5s" }}
                >
                  <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                  <span className="font-medium">Finding sushi spots…</span>
                </div>
                <div
                  className="animate-promo-slide-in-left bg-muted/40 rounded-xl px-3 py-2 inline-flex items-center gap-2 text-xs text-muted-foreground"
                  style={{ animationDelay: "2.4s" }}
                >
                  <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                  <span className="font-medium">Pricing it out…</span>
                </div>
                <div
                  className="animate-promo-scale-in rounded-xl px-4 py-2.5 inline-flex items-center gap-2 text-sm font-semibold text-white shadow-lg"
                  style={{
                    animationDelay: "3.3s",
                    background:
                      "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
                  }}
                >
                  <Check className="h-4 w-4" />
                  Your Tokyo trip is ready
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCENE 5: ITINERARY */}
      {scene === "itinerary" && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{
            background:
              "linear-gradient(180deg, hsl(0 0% 99%) 0%, hsl(234 62% 97%) 100%)",
          }}
        >
          <div className="w-full max-w-5xl px-6">
            <div className="text-center mb-6">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-2 animate-promo-fade-up">
                Your Tokyo itinerary
              </p>
              <h2
                className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground animate-promo-fade-up"
                style={{ animationDelay: "0.15s" }}
              >
                Day by day. Planned.
              </h2>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {[
                { day: "Day 1", title: "Shibuya Crossing", image: TOKYO_IMAGES.shibuya, tag: "Neon · Streets" },
                { day: "Day 2", title: "Senso-ji Temple", image: TOKYO_IMAGES.senso, tag: "Culture · History" },
                { day: "Day 3", title: "Tsukiji Market", image: TOKYO_IMAGES.sushi, tag: "Sushi · Seafood" },
                { day: "Day 4", title: "Shinjuku", image: TOKYO_IMAGES.shinjuku, tag: "Nightlife · Views" },
                { day: "Day 5", title: "Harajuku", image: TOKYO_IMAGES.harajuku, tag: "Fashion · Cafés" },
              ].map((d, i) => (
                <div
                  key={d.day}
                  className="rounded-2xl overflow-hidden bg-white border border-border shadow-lg animate-promo-card-drop"
                  style={{ animationDelay: `${0.3 + i * 0.15}s` }}
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
                    <div className="absolute inset-x-3 bottom-3">
                      <p className="text-white text-sm font-extrabold leading-tight">
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

            <div
              className="mt-5 flex items-center justify-center gap-2 animate-promo-fade-up"
              style={{ animationDelay: "1.4s" }}
            >
              {[
                { icon: Sun, label: "Morning" },
                { icon: Utensils, label: "Lunch" },
                { icon: Clock, label: "Afternoon" },
                { icon: Moon, label: "Evening" },
              ].map((slot) => {
                const Icon = slot.icon;
                return (
                  <div
                    key={slot.label}
                    className="px-3 py-1.5 rounded-full bg-white border border-border text-xs font-medium text-muted-foreground inline-flex items-center gap-1.5"
                  >
                    <Icon className="h-3 w-3 text-primary" />
                    {slot.label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SCENE 6: HOTEL */}
      {scene === "hotel" && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background:
              "linear-gradient(180deg, hsl(234 62% 98%) 0%, hsl(0 0% 100%) 100%)",
          }}
        >
          <div className="w-full max-w-4xl px-8">
            <h2 className="text-center text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-8 animate-promo-fade-up">
              Real flights. Real prices.
            </h2>

            <div className="grid grid-cols-2 gap-5">
              <div
                className="rounded-2xl border border-border bg-white shadow-xl p-5 animate-promo-slide-in-left"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center">
                    <Plane className="h-4 w-4 text-sky-600" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Flight
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-2xl font-extrabold text-foreground">JFK</p>
                    <p className="text-xs text-muted-foreground">7:45 PM</p>
                  </div>
                  <div className="flex-1 mx-3 relative">
                    <div className="h-px bg-border" />
                    <Plane className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-foreground">HND</p>
                    <p className="text-xs text-muted-foreground">11:20 PM+1</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    ANA · Direct · 14h 05m
                  </span>
                  <span className="text-lg font-extrabold text-primary">$612</span>
                </div>
              </div>

              <div
                className="rounded-2xl border border-border bg-white shadow-xl overflow-hidden animate-promo-slide-in-right"
                style={{ animationDelay: "0.35s" }}
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
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-base font-bold text-foreground">
                      Shibuya Granbell
                    </h3>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-semibold">4.6</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Shibuya · 5 min to station · Rooftop bar
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">5 nights</span>
                    <span className="text-lg font-extrabold text-primary">$485</span>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="mt-6 flex items-center justify-center gap-2 animate-promo-fade-up"
              style={{ animationDelay: "1s" }}
            >
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground font-medium">
                Direct booking links. No middleman.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SCENE 7: MAP */}
      {scene === "map" && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background:
              "linear-gradient(180deg, hsl(234 62% 8%) 0%, hsl(234 62% 3%) 100%)",
          }}
        >
          <div className="w-full max-w-4xl px-8 text-center">
            <h2 className="text-white text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 animate-promo-fade-up">
              See it all on a map
            </h2>

            <div
              className="relative mx-auto rounded-3xl overflow-hidden border border-white/10 animate-promo-fade-up aspect-[16/9] max-w-3xl"
              style={{
                animationDelay: "0.15s",
                background:
                  "linear-gradient(135deg, hsl(234 40% 18%), hsl(234 30% 10%))",
              }}
            >
              <svg
                className="absolute inset-0 w-full h-full opacity-30"
                viewBox="0 0 800 450"
                preserveAspectRatio="none"
              >
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="hsl(234 40% 40%)"
                      strokeWidth="0.5"
                    />
                  </pattern>
                </defs>
                <rect width="800" height="450" fill="url(#grid)" />
                <path
                  d="M 150 120 Q 280 200 380 180 T 580 250 T 680 320"
                  fill="none"
                  stroke="hsl(234 62% 62%)"
                  strokeWidth="2.5"
                  strokeDasharray="6 6"
                  className="animate-promo-dash"
                />
              </svg>

              {[
                { top: "26%", left: "19%", day: "1", label: "Shibuya", delay: 0.3 },
                { top: "40%", left: "35%", day: "2", label: "Senso-ji", delay: 0.6 },
                { top: "40%", left: "47%", day: "3", label: "Tsukiji", delay: 0.9 },
                { top: "55%", left: "72%", day: "4", label: "Shinjuku", delay: 1.2 },
                { top: "71%", left: "85%", day: "5", label: "Harajuku", delay: 1.5 },
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
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white mb-1 whitespace-nowrap shadow-lg"
                      style={{
                        background:
                          "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
                      }}
                    >
                      Day {pin.day} · {pin.label}
                    </div>
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                      style={{
                        background:
                          "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))",
                      }}
                    >
                      <MapPin className="h-4 w-4 text-white fill-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p
              className="mt-5 text-white/60 animate-promo-fade-up"
              style={{ animationDelay: "1.8s" }}
            >
              Every stop pinned. Walking times included.
            </p>
          </div>
        </div>
      )}

      {/* SCENE 8: CTA */}
      {scene === "cta" && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background:
              "radial-gradient(ellipse at center, hsl(234 62% 30%) 0%, hsl(234 62% 15%) 60%, black 100%)",
          }}
        >
          <div className="text-center px-8">
            <p className="text-white/70 text-lg mb-3 animate-promo-fade-up">
              Your next trip
            </p>
            <h2
              className="text-white text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.1] animate-promo-blur-in"
              style={{ animationDelay: "0.3s" }}
            >
              is one message
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(135deg, hsl(234 62% 72%), hsl(260 70% 75%))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  paddingBottom: "0.15em",
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
          <div className="text-center">
            <div className="mb-5 flex justify-center animate-promo-spin-in">
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
            <h2
              className="text-white text-5xl sm:text-6xl font-extrabold tracking-tight animate-promo-fade-up"
              style={{ animationDelay: "0.2s" }}
            >
              Jolliday
            </h2>
            <p
              className="mt-5 text-white text-xl sm:text-2xl font-semibold animate-promo-fade-up"
              style={{ animationDelay: "0.5s" }}
            >
              jolliday.online
            </p>
            <p
              className="mt-3 text-white/60 text-base animate-promo-fade-up"
              style={{ animationDelay: "0.75s" }}
            >
              Try free
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Promo;
