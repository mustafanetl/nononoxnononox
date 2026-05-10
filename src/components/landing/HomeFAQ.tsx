import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Is Jolliday free to use?",
    a: "Jolliday offers a 3-day free trial so you can explore everything before committing. After the trial you can choose a plan that fits how often you travel. You can cancel anytime.",
  },
  {
    q: "How accurate are the itineraries?",
    a: "Our AI builds itineraries using real destination data including opening hours, travel times, and local recommendations. We always suggest double-checking bookings directly with providers before you travel.",
  },
  {
    q: "Does Jolliday actually book flights and hotels for me?",
    a: "Jolliday creates your full itinerary and provides direct links to book flights and hotels with trusted providers. The booking itself happens on the provider's site so you always stay in control.",
  },
  {
    q: "Which countries and destinations does it cover?",
    a: "Jolliday works for destinations worldwide — cities, islands, road trips, and multi-country trips. If you can travel there, we can plan it.",
  },
  {
    q: "Can it plan family or group trips?",
    a: "Absolutely. Just tell us who's coming along and we'll balance activities that work for everyone — from toddlers to grandparents.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. We do not sell your personal data to third parties. Your trip information is used only to generate and improve your itineraries.",
  },
];

const HomeFAQ = () => {
  return (
    <section className="bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-20 md:py-28 lg:py-36 max-w-3xl">
        <div className="text-center mb-10 md:mb-14">
          <p className="text-xs sm:text-sm font-semibold text-primary tracking-[0.15em] uppercase mb-3">
            FAQ
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Questions?
            <br className="sm:hidden" />
            <span className="text-primary"> We've got answers.</span>
          </h2>
        </div>
        <Accordion type="single" collapsible className="w-full space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border border-border rounded-2xl bg-white px-5 sm:px-6 data-[state=open]:border-primary/30 data-[state=open]:shadow-md transition-all"
            >
              <AccordionTrigger className="text-left text-base sm:text-lg font-semibold text-foreground hover:no-underline py-5">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm sm:text-base text-muted-foreground leading-relaxed pb-5">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default HomeFAQ;
