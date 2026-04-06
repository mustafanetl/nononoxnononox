import { Link } from "react-router-dom";
import { Compass, ArrowLeft } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "What is Jolliday?",
    a: "Jolliday is an AI-powered travel planning assistant that creates personalized trip itineraries in seconds. Just tell us where you want to go, and we'll handle flights, hotels, activities, and day-by-day plans."
  },
  {
    q: "Is Jolliday free to use?",
    a: "You can chat with Jolliday and get trip suggestions for free. To unlock full itineraries, PDF exports, packing lists, and unlimited plans, you'll need a Premium subscription."
  },
  {
    q: "How does the free trial work?",
    a: "When you start your Premium subscription, you get 3 days completely free. You won't be charged during the trial period, and you can cancel anytime before it ends."
  },
  {
    q: "Can I cancel my subscription?",
    a: "Yes, you can cancel anytime. Your Premium access will remain active until the end of your current billing period."
  },
  {
    q: "Does Jolliday book flights and hotels for me?",
    a: "Jolliday provides curated recommendations with direct booking links to trusted platforms like Booking.com, Skyscanner, and others. You complete the booking on those platforms."
  },
  {
    q: "How accurate are the prices shown?",
    a: "We pull real-time pricing data where possible, but prices can fluctuate. We recommend clicking through to the booking platform to confirm the latest price."
  },
  {
    q: "Can I plan local activities in my own city?",
    a: "Absolutely! Just type something like 'things to do in [your city]' and Jolliday will create a curated activity plan without flights or hotels."
  },
  {
    q: "Is my data safe?",
    a: "Yes. We take privacy seriously. Your conversations and trip data are encrypted and stored securely. We never sell your personal information. See our Privacy Policy for details."
  },
  {
    q: "What currencies are supported?",
    a: "Jolliday automatically detects your location and displays prices in your local currency, including USD, EUR, GBP, SEK, and more."
  },
  {
    q: "How do I contact support?",
    a: "You can reach us through our Contact page or email us directly at hello@jolliday.app. We typically respond within 24 hours."
  },
];

const FAQ = () => (
  <div className="min-h-screen bg-background">
    <header className="border-b border-border">
      <nav className="container mx-auto flex items-center gap-3 px-4 py-4">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
            <Compass className="h-3.5 w-3.5 text-background" />
          </div>
          <span className="font-semibold">Jolliday</span>
        </div>
      </nav>
    </header>

    <main className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl font-bold text-foreground mb-2">Frequently Asked Questions</h1>
      <p className="text-muted-foreground mb-8">Everything you need to know about Jolliday.</p>

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left text-sm font-medium">{faq.q}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </main>
  </div>
);

export default FAQ;
