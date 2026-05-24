import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const FinalCTA = () => {
  return (
    <section className="bg-[#0a0a0f] relative overflow-hidden">
      <div className="container mx-auto px-5 sm:px-8 py-24 md:py-32 lg:py-40 max-w-4xl text-center relative z-10">
        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 70%)",
          }}
        />

        <div className="relative">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-[-0.03em] text-white leading-[1.05]">
            Ready to plan
            <br />
            your next trip?
          </h2>

          <p className="mt-6 text-lg text-white/40 max-w-md mx-auto">
            One message. Full itinerary. Verified venues. Real photos. Instant.
          </p>

          <Link to="/chat" className="inline-block mt-10">
            <button className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black font-semibold text-base sm:text-lg hover:bg-white/90 transition-all shadow-2xl shadow-white/10 hover:shadow-white/20 hover:scale-[1.02] active:scale-[0.98]">
              Start chatting
              <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </Link>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/30">
            <span>Free to try</span>
            <span>·</span>
            <span>No credit card</span>
            <span>·</span>
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
