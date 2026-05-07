import { CalendarDays, Tag, Link2, Share2 } from "lucide-react";

const features = [
  {
    icon: CalendarDays,
    title: "Day-by-day itinerary",
    description:
      "A real structured plan — morning, afternoon, evening — not just a list of suggestions.",
  },
  {
    icon: Tag,
    title: "Real-time prices",
    description:
      "Actual flight and hotel prices pulled live, not estimates from months ago.",
  },
  {
    icon: Link2,
    title: "One-click booking links",
    description:
      "Every hotel and flight comes with a direct link to book. No copy-pasting, no tab switching.",
  },
  {
    icon: Share2,
    title: "Share with your travel crew",
    description:
      "Send your itinerary to friends or family with one link. Everyone stays on the same page.",
  },
];

const WhyJolliday = () => {
  return (
    <section className="border-t border-b border-border">
      <div className="container mx-auto px-4 py-20 md:py-28 max-w-5xl">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Why Jolliday — not just ChatGPT
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            ChatGPT gives you ideas. Jolliday gives you a trip.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card p-6 flex items-start gap-4"
              >
                <div className="w-11 h-11 rounded-xl border border-border bg-background flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <h3 className="text-base font-semibold tracking-tight">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyJolliday;