import { MapPin, Clock } from "lucide-react";
import { useState } from "react";

const lisbonPhotos = [
  "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=600&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1558370781-d6196949e317?w=600&h=600&fit=crop&q=80",
  "https://images.unsplash.com/photo-1513735492246-483525079686?w=600&h=600&fit=crop&q=80",
];

const day1 = [
  { time: "09:00", title: "Pastéis de Belém", note: "Custard tarts, then walk along the river" },
  { time: "11:30", title: "Jerónimos Monastery", note: "Skip the queue with a timed entry" },
  { time: "13:00", title: "Cervejaria Ramiro", note: "Lunch — the prawns, obviously" },
  { time: "16:00", title: "Tram 28 to Alfama", note: "Old town, tiled streets, viewpoints" },
  { time: "20:30", title: "Fado at Mesa de Frades", note: "Reservation recommended" },
];

const PhotoTile = ({ src, i }: { src: string; i: number }) => {
  const [failed, setFailed] = useState(false);
  return (
    <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-muted to-muted-foreground/10">
      {!failed && (
        <img
          src={src}
          alt={`Lisbon ${i + 1}`}
          loading="lazy"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
};

const ProductPreview = () => {
  return (
    <section id="examples" className="container mx-auto px-4 py-20 md:py-24 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 md:mb-12 max-w-2xl">
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
                <div className="text-[10px] sm:text-xs text-center text-muted-foreground px-3 py-1 rounded-md bg-background border border-border truncate">
                  jolliday.online/trip/lisbon
                </div>
              </div>
            </div>

            {/* Trip header */}
            <div className="p-5 sm:p-8 md:p-10">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">
                <MapPin className="h-3 w-3" /> Portugal
              </div>
              <h3 className="text-3xl md:text-5xl font-bold tracking-tight">Lisbon</h3>
              <p className="text-muted-foreground mt-2 text-sm md:text-base">4 days · for two · easy pace</p>

              {/* Photos row */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-6 md:mt-8">
                {lisbonPhotos.map((src, i) => (
                  <PhotoTile key={i} src={src} i={i} />
                ))}
              </div>

              {/* Day 1 */}
              <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-border">
                <div className="flex items-baseline justify-between mb-5 md:mb-6 gap-3">
                  <h4 className="text-lg md:text-xl font-semibold">Day 1 — Belém & Alfama</h4>
                  <span className="text-[10px] sm:text-xs uppercase tracking-[0.15em] text-muted-foreground whitespace-nowrap">Tue, May 6</span>
                </div>
                <ul className="space-y-4 md:space-y-5">
                  {day1.map((item) => (
                    <li key={item.time} className="flex gap-4 sm:gap-5 group">
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground tabular-nums w-14 sm:w-16 shrink-0">
                        <Clock className="h-3 w-3 hidden sm:inline" />
                        {item.time}
                      </div>
                      <div className="flex-1 pb-4 md:pb-5 border-b border-border/60 last:border-0">
                        <div className="font-medium text-foreground text-sm md:text-base">{item.title}</div>
                        <div className="text-xs md:text-sm text-muted-foreground mt-0.5">{item.note}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <p className="mt-6 text-xs md:text-sm text-muted-foreground italic text-center">
            An actual 4-day Lisbon plan, made by Jolliday in 14 seconds.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProductPreview;
