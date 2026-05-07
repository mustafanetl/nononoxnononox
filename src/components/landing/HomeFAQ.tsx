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
    q: "Is my data safe?",
    a: "Yes. We do not sell your personal data to third parties. Your trip information is used only to generate and improve your itineraries.",
  },
];

const HomeFAQ = () => {
  return (
    <section className="border-t border-border">
      <div className="container mx-auto px-4 py-20 md:py-28 max-w-3xl">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-center mb-10 md:mb-14">
          Frequently asked questions
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-base md:text-lg font-medium">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm md:text-base text-muted-foreground leading-relaxed">
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