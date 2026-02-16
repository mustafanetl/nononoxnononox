import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, Plus, Menu, Compass, ChevronLeft, ChevronRight } from "lucide-react";
import { useRzumaChat } from "@/hooks/useRzumaChat";
import FlightCard, { FlightData } from "@/components/FlightCard";
import FlightDetailModal from "@/components/FlightDetailModal";
import ActivityCard, { ActivityData } from "@/components/ActivityCard";
import ActivityDetailModal from "@/components/ActivityDetailModal";
import ItineraryCard, { ItineraryData } from "@/components/ItineraryCard";
import { Link } from "react-router-dom";

// Parse message content to extract flight, activity, and itinerary data
const parseMessageContent = (content: string): { 
  text: string; 
  flights: FlightData[]; 
  activities: ActivityData[];
  itinerary: ItineraryData[];
} => {
  let flights: FlightData[] = [];
  let activities: ActivityData[] = [];
  let itinerary: ItineraryData[] = [];
  let text = content;

  const extractBlock = (blockType: string) => {
    const regex = new RegExp("```" + blockType + "\\s*([\\s\\S]*?)```", "g");
    const matches = text.matchAll(regex);
    const items: any[] = [];
    for (const match of matches) {
      try {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed)) items.push(...parsed);
      } catch { /* skip */ }
      text = text.replace(match[0], "");
    }
    return items;
  };

  flights = extractBlock("flights");
  activities = extractBlock("activities");
  itinerary = extractBlock("itinerary");

  return { text: text.trim(), flights, activities, itinerary };
};

const HorizontalCarousel = ({ children }: { children: React.ReactNode }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => { checkScroll(); }, [children]);

  const scroll = (direction: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative mt-4">
      {canScrollLeft && (
        <button onClick={() => scroll("left")} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-background border border-border rounded-full flex items-center justify-center shadow-lg hover:bg-muted transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      {canScrollRight && (
        <button onClick={() => scroll("right")} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-background border border-border rounded-full flex items-center justify-center shadow-lg hover:bg-muted transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
      <div ref={scrollRef} onScroll={checkScroll} className="flex gap-3 overflow-x-auto scrollbar-hide px-1 py-1">
        {children}
      </div>
    </div>
  );
};

const Chat = () => {
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null);
  const [flightModalOpen, setFlightModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityData | null>(null);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const { messages, isLoading, error, sendMessage, clearChat } = useRzumaChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFlightClick = (flight: FlightData) => {
    setSelectedFlight(flight);
    setFlightModalOpen(true);
  };

  const handleActivityClick = (activity: ActivityData) => {
    setSelectedActivity(activity);
    setActivityModalOpen(true);
  };

  const suggestions = [
    "Plan a honeymoon in Bali",
    "Birthday trip to Tokyo",
    "Family vacation to Dubai",
    "Solo adventure in Europe",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} fixed md:relative md:translate-x-0 z-40 w-64 h-full chat-sidebar flex flex-col transition-transform duration-200`}>
        <div className="p-3">
          <Button onClick={clearChat} variant="outline" className="w-full justify-start gap-2">
            <Plus className="h-4 w-4" /> New chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs text-muted-foreground px-2 mb-2">Recent</p>
          <p className="text-sm text-muted-foreground px-2">No previous chats</p>
        </div>
        <div className="p-3 border-t border-border">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Compass className="h-4 w-4" /> Back to home
          </Link>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-3 p-3 border-b border-border md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5" />
            <span className="font-semibold">Rzuma</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-8">
            {!hasMessages ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center">
                    <Compass className="h-6 w-6 text-background" />
                  </div>
                </div>
                <h1 className="text-2xl font-semibold mb-2">Where would you like to go?</h1>
                <p className="text-muted-foreground text-center mb-8">
                  I can help you plan trips, find flights, and discover activities for any occasion.
                </p>
                <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                  {suggestions.map((s) => (
                    <button key={s} onClick={() => sendMessage(s)} className="p-3 text-left text-sm border border-border rounded-xl hover:bg-muted transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg, i) => {
                  const { text, flights, activities, itinerary } =
                    msg.role === "assistant"
                      ? parseMessageContent(msg.content)
                      : { text: msg.content, flights: [], activities: [], itinerary: [] };

                  return (
                    <div key={i} className="animate-fade-in">
                      {msg.role === "user" ? (
                        <div className="flex justify-end">
                          <div className="bg-muted rounded-2xl px-4 py-2 max-w-[80%]">
                            <p className="text-sm">{text}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center shrink-0">
                            <Compass className="h-4 w-4 text-background" />
                          </div>
                          <div className="flex-1 min-w-0">
                            {text && <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>}
                            {flights.length > 0 && (
                              <HorizontalCarousel>
                                {flights.map((f, idx) => (
                                  <FlightCard key={f.id || idx} flight={f} onClick={() => handleFlightClick(f)} />
                                ))}
                              </HorizontalCarousel>
                            )}
                            {activities.length > 0 && (
                              <HorizontalCarousel>
                                {activities.map((a, idx) => (
                                  <ActivityCard key={a.id || idx} activity={a} onClick={() => handleActivityClick(a)} />
                                ))}
                              </HorizontalCarousel>
                            )}
                            {itinerary.length > 0 && (
                              <HorizontalCarousel>
                                {itinerary.map((item, idx) => (
                                  <ItineraryCard key={idx} item={item} />
                                ))}
                              </HorizontalCarousel>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-3 animate-fade-in">
                    <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center shrink-0">
                      <Compass className="h-4 w-4 text-background" />
                    </div>
                    <div className="flex gap-1 py-2">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot" />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot" />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="px-4">
            <div className="max-w-3xl mx-auto mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
              {error}
            </div>
          </div>
        )}

        <div className="p-4 pb-6">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit}>
              <div className="chat-input-container p-2">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    placeholder="Message Rzuma..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    rows={1}
                    className="flex-1 bg-transparent px-3 py-2 text-sm resize-none focus:outline-none min-h-[40px] max-h-[200px]"
                  />
                  <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="h-9 w-9 rounded-lg shrink-0">
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </form>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Rzuma can make mistakes. Verify travel details before booking.
            </p>
          </div>
        </div>
      </main>

      <FlightDetailModal flight={selectedFlight} open={flightModalOpen} onOpenChange={setFlightModalOpen} />
      <ActivityDetailModal activity={selectedActivity} open={activityModalOpen} onOpenChange={setActivityModalOpen} />
    </div>
  );
};

export default Chat;
