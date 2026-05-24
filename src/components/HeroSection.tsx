import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const HeroSection = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (q: string) => {
    const trimmed = q.trim();
    if (trimmed) navigate(`/chat?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center px-4 sm:px-6 overflow-hidden bg-[#0a0a0f]">
      {/* Ambient gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(99, 102, 241, 0.12) 0%, transparent 70%)",
        }}
      />
      
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative w-full max-w-4xl mx-auto pt-32 pb-16 sm:pt-40 sm:pb-20 md:pt-48 md:pb-24 flex flex-col items-center text-center">
        {/* Main headline — large, bold, cinematic */}
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-extrabold tracking-[-0.04em] text-white leading-[0.95]">
          Travel
          <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            better.
          </span>
        </h1>

        <p className="mt-6 sm:mt-8 text-lg sm:text-xl text-white/50 max-w-lg leading-relaxed font-light">
          Jolliday brings the world to you — verified venues, real photos, and instant itineraries crafted for your style.
        </p>

        {/* CTA Button */}
        <button
          onClick={() => navigate("/chat")}
          className="mt-10 sm:mt-12 group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black font-semibold text-base sm:text-lg hover:bg-white/90 transition-all shadow-2xl shadow-white/10 hover:shadow-white/20 hover:scale-[1.02] active:scale-[0.98]"
        >
          Start chatting
          <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Quick prompts */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 max-w-2xl">
          {[
            "5 days in Tokyo for a couple",
            "Weekend in Barcelona",
            "Family trip to Bali",
            "10 days Italy → Greece",
          ].map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => handleSubmit(ex)}
              className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-white/60 hover:text-white hover:border-white/30 hover:bg-white/10 transition-all"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
        <span className="text-xs tracking-wider uppercase">Learn more</span>
        <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent" />
      </div>
    </section>
  );
};

export default HeroSection;
