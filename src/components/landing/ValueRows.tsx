const rows = [
  { big: "Stop tab-hopping.", sub: "One prompt. Flights, hotels, restaurants, things to do — all in one thread you can actually use.", side: "01" },
  { big: "Real places. Real photos.", sub: "Every venue is verified against Google Places before it shows up. No invented restaurants, no wrong pictures.", side: "02" },
  { big: "Yours, forever.", sub: "Save trips to your account, edit them, export to PDF, share with whoever's coming.", side: "03" },
];

const ValueRows = () => (
  <section className="container mx-auto px-4 py-20 md:py-24 border-t border-border">
    <div className="max-w-6xl mx-auto">
      <span className="inline-block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-10 md:mb-12">
        Why people stay
      </span>
      <div className="divide-y divide-border">
        {rows.map((row) => (
          <div key={row.side} className="grid grid-cols-12 gap-4 md:gap-6 py-10 md:py-16 items-baseline">
            <div className="col-span-12 md:col-span-1 text-xs uppercase tracking-[0.2em] text-muted-foreground tabular-nums">
              {row.side}
            </div>
            <h3 className="col-span-12 md:col-span-7 text-3xl md:text-5xl font-bold tracking-tight leading-[1.05]">
              {row.big}
            </h3>
            <p className="col-span-12 md:col-span-4 text-base md:text-lg text-muted-foreground leading-relaxed">
              {row.sub}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ValueRows;
