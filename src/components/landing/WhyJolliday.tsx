import { Check, X } from "lucide-react";

const comparisons = [
  { feature: "Verified venues", jolliday: true, chatgpt: false },
  { feature: "Real photos", jolliday: true, chatgpt: false },
  { feature: "Walking times", jolliday: true, chatgpt: false },
  { feature: "Interactive map", jolliday: true, chatgpt: false },
  { feature: "PDF export", jolliday: true, chatgpt: false },
  { feature: "Calendar sync", jolliday: true, chatgpt: false },
  { feature: "Booking links", jolliday: true, chatgpt: false },
  { feature: "Instant (cached)", jolliday: true, chatgpt: false },
  { feature: "Share without signup", jolliday: true, chatgpt: false },
  { feature: "Mobile-first design", jolliday: true, chatgpt: false },
];

const WhyJolliday = () => {
  return (
    <section className="bg-[#0a0a0f]">
      <div className="container mx-auto px-5 sm:px-8 py-24 md:py-32 lg:py-40 max-w-4xl">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <p className="text-xs sm:text-sm font-semibold text-indigo-400 tracking-[0.2em] uppercase mb-4">
            The difference
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.03em] text-white leading-[1.05]">
            Why not just use ChatGPT?
          </h2>
          <p className="mt-4 text-base text-white/40">
            Because a text list isn't a travel plan.
          </p>
        </div>

        {/* Comparison table */}
        <div className="rounded-3xl border border-white/5 bg-white/[0.02] overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-3 px-6 py-4 border-b border-white/5">
            <div className="text-sm font-medium text-white/40">Feature</div>
            <div className="text-sm font-bold text-white text-center">Jolliday</div>
            <div className="text-sm font-medium text-white/40 text-center">ChatGPT</div>
          </div>

          {/* Rows */}
          {comparisons.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-3 px-6 py-3.5 items-center ${
                i < comparisons.length - 1 ? "border-b border-white/5" : ""
              }`}
            >
              <div className="text-sm text-white/70">{row.feature}</div>
              <div className="flex justify-center">
                {row.jolliday ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                    <X className="h-3.5 w-3.5 text-red-400" />
                  </div>
                )}
              </div>
              <div className="flex justify-center">
                {row.chatgpt ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                    <X className="h-3.5 w-3.5 text-white/20" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyJolliday;
