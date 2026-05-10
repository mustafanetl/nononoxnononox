import { CalendarDays, Tag, Link2, Share2 } from "lucide-react";

const features = [
  {
    icon: CalendarDays,
    title: "Day-by-day itinerary",
    description:
      "Morning, afternoon, evening — a real structured plan, not just a list.",
  },
  {
    icon: Tag,
    title: "Live prices",
    description:
      "Real flight and hotel prices, pulled now — not estimates from months ago.",
  },
  {
    icon: Link2,
    title: "Book in one click",
    description:
      "Every hotel and flight has a direct link. No tab-switching needed.",
  },
  {
    icon: Share2,
    title: "Share with friends",
    description:
      "Send your plan to your travel crew. Everyone stays on the same page.",
  },
];

const WhyJolliday = () => {
  return (
    <section className="bg-background border-t border-border">
      <div className="container mx-auto px-4 py-12 md:py-20 lg:py-28 max-w-5xl">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Everything you need in one place
          </h2>
          <p className="mt-3 text-muted-foreground">
            No more jumping between 10 tabs to plan a trip.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-[1rem] border border-[hsl(0_0%_85%)] bg-white p-6 flex items-start gap-4 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06),0px_1px_2px_-1px_rgba(0,0,0,0.03)]"
              >
                <div className="w-10 h-10 rounded-xl bg-foreground/5 border border-border flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
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
