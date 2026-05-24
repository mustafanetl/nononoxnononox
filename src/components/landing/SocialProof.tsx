import { CheckCircle2, Image, Clock, MapPin, FileText, Share2 } from "lucide-react";

const features = [
  {
    icon: CheckCircle2,
    title: "Verified venues",
    description: "Every recommendation checked against Google Places. If it doesn't exist, it doesn't make the plan.",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
  {
    icon: Image,
    title: "Real photos",
    description: "No stock images. Every photo comes from the actual venue, stored on our servers so they never expire.",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  {
    icon: Clock,
    title: "Instant plans",
    description: "Pre-cached itineraries mean most plans load in under 5 seconds. No waiting, no spinning wheels.",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
  },
  {
    icon: MapPin,
    title: "Walking times",
    description: "Real walking times between every stop, calculated via routing. Know exactly how your day flows.",
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20",
  },
  {
    icon: FileText,
    title: "PDF & calendar export",
    description: "Download your itinerary as a beautiful PDF or add it directly to your calendar. Works offline.",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
  },
  {
    icon: Share2,
    title: "Share with anyone",
    description: "Send a beautiful link to your travel partner. No signup required to view — just open and explore.",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
  },
];

const SocialProof = () => {
  return (
    <section className="bg-[#0a0a0f]">
      <div className="container mx-auto px-5 sm:px-8 py-24 md:py-32 lg:py-40 max-w-6xl">
        <div className="text-center mb-16 md:mb-20">
          <p className="text-xs sm:text-sm font-semibold text-indigo-400 tracking-[0.2em] uppercase mb-4">
            Everything you need
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] text-white leading-[1.05]">
            10x better than ChatGPT.
          </h2>
          <p className="mt-5 text-base sm:text-lg text-white/40 max-w-lg mx-auto">
            ChatGPT gives you a text list. Jolliday gives you verified venues, real photos, maps, and one-click booking.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-3xl border border-white/5 bg-white/[0.02] p-7 sm:p-8 flex flex-col hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 group"
            >
              <div className={`w-11 h-11 rounded-xl ${f.bgColor} border ${f.borderColor} flex items-center justify-center mb-5`}>
                <f.icon className={`h-5 w-5 ${f.color}`} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
