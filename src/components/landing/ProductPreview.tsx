import { MapPin, Clock } from "lucide-react";

const lisbonPhotos = [
  "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1588535570707-3897c1d9d7e8?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1513735492246-483525079686?w=600&h=600&fit=crop",
];

const day1 = [
  { time: "09:00", title: "Pastéis de Belém", note: "Custard tarts, then walk along the river" },
  { time: "11:30", title: "Jerónimos Monastery", note: "Skip the queue with a timed entry" },
  { time: "13:00", title: "Cervejaria Ramiro", note: "Lunch — the prawns, obviously" },
  { time: "16:00", title: "Tram 28 to Alfama", note: "Old town, tiled streets, viewpoints" },
  { time: "20:30", title: "Fado at Mesa de Frades", note: "Reservation recommended" },
];

const ProductPreview = () => {
  return (
    <section id="examples" className="container mx-auto px-4 py-24 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 max-w-2xl">
          <span className="inline-block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
            What you actually get
          </span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.05]">
            Not a list of suggestions.
            <br />
            <span className="text-muted-foreground">A plan.</span>
          </h2>
        </div>

        {/* Faux browser frame */}
        <div className="relative">
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xl">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-border" />
                <span className="w-2.5 h-2.5 rounded-full bg-border" />
                <span className="w-2.5 h-2.5 rounded-full bg-border" />
              </div>
              <div className="flex-1 mx-auto max-w-md">
                <div className="text-xs text-center text-muted-foreground px-3 py-1 rounded-md bg-background border border-border">
                  jolliday.online/trip/lisbon
                </div>
              </div>
            </div>

            {/* Trip header */}
            <div className="p-6 md:p-10">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">
                <MapPin className="h-3 w-3" /> Portugal
              </div>
              <h3 className="text-3xl md:text-5xl font-bold tracking-tight">Lisbon</h3>
              <p className="text-muted-foreground mt-2">4 days · for two · easy pace</p>

              {/* Photos row */}
              <div className="grid grid-cols-3 gap-3 mt-8">
                {lisbonPhotos.map((src, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img src={src} alt="Lisbon" loading="lazy" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>

              {/* Day 1 */}
              <div className="mt-10 pt-8 border-t border-border">
                <div className="flex items-baseline justify-between mb-6">
                  <h4 className="text-xl font-semibold">Day 1 — Belém & Alfama</h4>
                  <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Tue, May 6</span>
                </div>
                <ul className="space-y-5">
                  {day1.map((item) => (
                    <li key={item.time} className="flex gap-5 group">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground tabular-nums w-16 shrink-0">
                        <Clock className="h-3 w-3" />
                        {item.time}
                      </div>
                      <div className="flex-1 pb-5 border-b border-border/60 last:border-0">
                        <div className="font-medium text-foreground">{item.title}</div>
                        <div className="text-sm text-muted-foreground mt-0.5">{item.note}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <p className="mt-6 text-sm text-muted-foreground italic text-center">
            An actual 4-day Lisbon plan, made by Jolliday in 14 seconds.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProductPreview;