import { MessageSquare, Sparkles, Map } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    number: "01",
    title: "Start chatting with us.",
    description:
      "Tell us where you want to go, your travel style, budget, and who's coming. Be as specific as you want — we'll handle the rest.",
  },
  {
    icon: Sparkles,
    number: "02",
    title: "Get a verified plan.",
    description:
      "In seconds, receive a complete day-by-day itinerary with real venues verified against Google Places. Every photo is real, every place exists.",
  },
  {
    icon: Map,
    number: "03",
    title: "Book and go.",
    description:
      "One-click links to Skyscanner and Booking.com. Export to PDF, add to calendar, or share with your travel partner — all in one tap.",
  },
];

const HowItWorks = () => {
  return (
    <section className="bg-[#0a0a0f] relative">
      <div className="container mx-auto px-5 sm:px-8 py-24 md:py-32 lg:py-40 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
          <p className="text-xs sm:text-sm font-semibold text-indigo-400 tracking-[0.2em] uppercase mb-4">
            How It Works
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] text-white leading-[1.05]">
            Your trip, in three steps.
          </h2>
        </div>

        <div className="grid gap-6 md:gap-8 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="relative flex flex-col p-8 sm:p-10 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 group"
              >
                {/* Step number */}
                <span className="text-xs font-mono text-white/20 tracking-wider mb-6">
                  {step.number}
                </span>

                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 transition-colors">
                  <Icon className="h-5 w-5 text-indigo-400" />
                </div>

                <h3 className="text-xl font-bold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
