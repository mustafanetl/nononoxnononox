import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, Plus, Menu, Compass, ChevronLeft, ChevronRight, Share2, Trash2, GitCompare, Download, Save, User, LogOut, MapPin, Settings, RotateCcw, Crown } from "lucide-react";
import { useRzumaChat } from "@/hooks/useRzumaChat";
import { useAuth } from "@/hooks/useAuth";
import FlightCard, { FlightData } from "@/components/FlightCard";
import FlightDetailModal from "@/components/FlightDetailModal";
import ActivityCard, { ActivityData } from "@/components/ActivityCard";
import ActivityDetailModal from "@/components/ActivityDetailModal";
import ItineraryCard, { ItineraryData } from "@/components/ItineraryCard";
import HotelCard from "@/components/HotelCard";
import HotelDetailModal from "@/components/HotelDetailModal";
import BudgetPanel from "@/components/BudgetPanel";
import ThemeToggle from "@/components/ThemeToggle";
import TripTimeline, { TimelineLeg } from "@/components/TripTimeline";
import TravelInfoCard, { TravelInfoData } from "@/components/TravelInfoCard";
import QuickReplies from "@/components/QuickReplies";
import ComparisonModal from "@/components/ComparisonModal";
import VoiceInput from "@/components/VoiceInput";
import CurrencyConverter from "@/components/CurrencyConverter";
import TripMap, { type MapPoint } from "@/components/TripMap";
import TripSummaryCard, { TripPlanData } from "@/components/TripSummaryCard";
import PlanPreviewGate from "@/components/PlanPreviewGate";
import PlanCraftingMap, { type CraftActivity } from "@/components/PlanCraftingMap";
import PlaceShowcase from "@/components/PlaceShowcase";
import PlacesGallery, { PlaceItem } from "@/components/PlacesGallery";
import PaywallModal from "@/components/PaywallModal";
import { useSubscription } from "@/hooks/useSubscription";
import { HotelData, useTripContext } from "@/contexts/TripContext";
import { shareTripSummary } from "@/utils/tripSummary";
import { exportTripPDF } from "@/utils/pdfExport";
import { supabase } from "@/integrations/supabase/client";
import { setWikimediaImage } from "@/utils/cityImages";
import { Link, useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

// Enrichment cache to avoid re-fetching
const enrichmentCache: Record<string, any> = {};

const fetchEnrichment = async (destination: string, travelMonth?: string, activityNames?: string[], imageOnly?: boolean, hotelNames?: string[]) => {
  // Cache key includes activity/hotel names to avoid stale photo reuse
  const namesHash = [...(activityNames || []), ...(hotelNames || [])].sort().join("|").slice(0, 100);
  const cacheKey = imageOnly ? `${destination}-imageOnly` : `${destination}-${travelMonth || ""}-${namesHash}`;
  if (enrichmentCache[cacheKey]) return enrichmentCache[cacheKey];

  try {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enrich-destination`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ destination, travelMonth, activities: activityNames, hotelNames, imageOnly }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    enrichmentCache[cacheKey] = data;
    return data;
  } catch {
    return null;
  }
};

// Parse message content to extract all block types
const parseMessageContent = (content: string) => {
  let flights: FlightData[] = [];
  let activities: ActivityData[] = [];
  let hotels: HotelData[] = [];
  let itinerary: ItineraryData[] = [];
  let timeline: TimelineLeg[] = [];
  let travelInfo: TravelInfoData | null = null;
  let weather: any = null;
  let quickReplies: string[] = [];
  let destinationEnrich: { destination: string; travelMonth?: string } | null = null;
  let placeImages: { place: string; vibes?: string[] }[] = [];
  let places: PlaceItem[] = [];
  let text = content;

  const extractBlock = (blockType: string) => {
    const regex = new RegExp("```" + blockType + "\\s*([\\s\\S]*?)```", "g");
    const items: any[] = [];
    for (const match of text.matchAll(regex)) {
      let raw = match[1].trim();
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) items.push(...parsed);
        else items.push(parsed);
      } catch {
        // Try auto-closing incomplete JSON during streaming
        try {
          if (raw.startsWith("[")) {
            // Count open/close braces and brackets
            const openBraces = (raw.match(/{/g) || []).length;
            const closeBraces = (raw.match(/}/g) || []).length;
            const openBrackets = (raw.match(/\[/g) || []).length;
            const closeBrackets = (raw.match(/\]/g) || []).length;
            let fixed = raw;
            // Remove trailing comma
            fixed = fixed.replace(/,\s*$/, "");
            for (let j = 0; j < openBraces - closeBraces; j++) fixed += "}";
            for (let j = 0; j < openBrackets - closeBrackets; j++) fixed += "]";
            const parsed2 = JSON.parse(fixed);
            if (Array.isArray(parsed2)) items.push(...parsed2);
            else items.push(parsed2);
          } else if (raw.startsWith("{")) {
            let fixed = raw.replace(/,\s*$/, "");
            const openBraces = (fixed.match(/{/g) || []).length;
            const closeBraces = (fixed.match(/}/g) || []).length;
            for (let j = 0; j < openBraces - closeBraces; j++) fixed += "}";
            items.push(JSON.parse(fixed));
          }
        } catch { /* truly broken, skip */ }
      }
      text = text.replace(match[0], "");
    }
    // FALLBACK: AI sometimes drops the triple-backtick fences and emits
    //   activities
    //   [{...}]
    // Recover those so cards still render.
    const unfencedRegex = new RegExp(
      "(^|\\n)\\s*" + blockType + "\\s*\\n\\s*([\\[{][\\s\\S]*?[\\]}])\\s*(?=\\n\\s*\\n|\\n\\s*[a-z_]+\\s*\\n[\\[{]|\\n*$)",
      "gi"
    );
    for (const match of Array.from(text.matchAll(unfencedRegex))) {
      const raw = match[2].trim();
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) items.push(...parsed);
        else items.push(parsed);
        text = text.replace(match[0], "\n");
      } catch { /* leave it; could be partial stream */ }
    }
    return items;
  };

  flights = extractBlock("flights");
  activities = extractBlock("activities");
  hotels = extractBlock("hotels");
  itinerary = extractBlock("itinerary");
  timeline = extractBlock("timeline");
  
  const enrichArr = extractBlock("destination_enrich");
  if (enrichArr.length > 0) destinationEnrich = enrichArr[0];

  const travelInfoArr = extractBlock("travelinfo");
  if (travelInfoArr.length > 0) travelInfo = travelInfoArr[0];
  
  const weatherArr = extractBlock("weather");
  if (weatherArr.length > 0) weather = weatherArr[0];
  
  const qrArr = extractBlock("quickreplies");
  if (qrArr.length > 0) {
    quickReplies = Array.isArray(qrArr[0]) ? qrArr[0] : qrArr;
  }

  // Fallback: parse plain-text quickreplies like `quickreplies: ["a", "b"]`
  if (quickReplies.length === 0) {
    const plainQrMatch = text.match(/quickreplies:\s*\[([^\]]*)\]/i);
    if (plainQrMatch) {
      try {
        const parsed = JSON.parse(`[${plainQrMatch[1]}]`);
        if (Array.isArray(parsed)) quickReplies = parsed;
      } catch { /* ignore */ }
      text = text.replace(plainQrMatch[0], "");
    }
  }

  const piArr = extractBlock("place_images");
  if (piArr.length > 0) {
    placeImages = piArr.map((p: any) => ({ place: p.place || "", vibes: p.vibes }));
  }

  const placesArr = extractBlock("places");
  if (placesArr.length > 0) {
    places = placesArr
      .filter((p: any) => p && typeof p.name === "string" && typeof p.location === "string")
      .slice(0, 12)
      .map((p: any) => ({ name: p.name, location: p.location, why: p.why, category: p.category }));
  }

  // Strip incomplete/unterminated code blocks during streaming to prevent raw JSON leaking
  const blockTypes = ["flights", "activities", "hotels", "itinerary", "timeline", "destination_enrich", "travelinfo", "weather", "quickreplies", "place_images", "places"];
  for (const bt of blockTypes) {
    // Match an opening ```blocktype that has NO closing ```
    const openPattern = new RegExp("```" + bt + "\\s[\\s\\S]*$");
    if (openPattern.test(text) && !(new RegExp("```" + bt + "\\s[\\s\\S]*?```")).test(text)) {
      text = text.replace(openPattern, "");
    }
  }

  return { text: text.trim(), flights, activities, hotels, itinerary, timeline, travelInfo, weather, quickReplies, destinationEnrich, placeImages, places };
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
  const { user, loading: authLoading, signOut } = useAuth();

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return <ChatInner user={user ?? null} signOut={signOut} />;
};

const ChatInner = ({ user, signOut }: { user: any | null; signOut: () => Promise<void> }) => {
  const { isPremium } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallContext, setPaywallContext] = useState<{ destination?: string; tripStats?: any }>({});
  const [planGenerated, setPlanGenerated] = useState(false);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null);
  const [flightModalOpen, setFlightModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityData | null>(null);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [selectedActivityMsgIdx, setSelectedActivityMsgIdx] = useState<number>(-1);
  const [selectedActivityDest, setSelectedActivityDest] = useState<string>("");
  const [selectedHotel, setSelectedHotel] = useState<HotelData | null>(null);
  const [hotelModalOpen, setHotelModalOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const { messages, isLoading, qaStatus, error, sendMessage, clearChat, conversations, activeId, switchChat, deleteChat, preferences, exportLocalData, replaceActivity, replaceItinerarySlot } = useRzumaChat();
  const [selectedSlotRef, setSelectedSlotRef] = useState<{ day: number; slotIdx: number } | null>(null);
  const { compareItems } = useTripContext();

  // Track whether assistant has started streaming content for current response
  const hasStreamedContent = useMemo(() => {
    if (!isLoading) return false;
    const lastMsg = messages[messages.length - 1];
    return lastMsg?.role === "assistant" && lastMsg.content.length > 0;
  }, [isLoading, messages]);

  // Crafting active state — fully decoupled from isLoading
  const [craftingActive, setCraftingActive] = useState(false);
  const [craftingPlanType, setCraftingPlanType] = useState<"full" | "local">("full");
  const lastCraftedMsgIndex = useRef(-1);
  const craftingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const craftingProgressRef = useRef(0);
  const streamingDoneRef = useRef(false);
  const craftingStartTimeRef = useRef(0);

  // Unified crafting controller: detect plan blocks → start animation → finish when ready
  useEffect(() => {
    // Premium users also see the crafting animation
    const lastIdx = messages.length - 1;
    if (lastIdx < 0) return;
    const lastMsg = messages[lastIdx];
    if (!lastMsg || lastMsg.role !== "assistant") return;
    const c = lastMsg.content;
    const hasPlanBlocks = /```(activities|itinerary)/s.test(c);

    // Start crafting if plan blocks detected and not already started for this message
    if (hasPlanBlocks && isLoading && lastIdx !== lastCraftedMsgIndex.current && !craftingIntervalRef.current) {
      lastCraftedMsgIndex.current = lastIdx;
      craftingProgressRef.current = 0;
      streamingDoneRef.current = false;
      craftingStartTimeRef.current = Date.now();

      const hasFlightsOrHotels = /```(flights|hotels)/s.test(c);
      setCraftingPlanType(hasFlightsOrHotels ? "full" : "local");

      const destMatch = c.match(/```travelinfo\s*\{[^}]*"destination"\s*:\s*"([^"]+)"/);
      const dest = destMatch?.[1] || "";
      setCraftingPlan({ destination: dest, progress: 0 });
      setCraftingActive(true);

      // Single interval drives everything
      craftingIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - craftingStartTimeRef.current;
        const minDuration = 12000;

        // Smooth ease-out curve: 0 → ~90 over 12 seconds
        if (craftingProgressRef.current < 90) {
          craftingProgressRef.current = Math.min(90, craftingProgressRef.current + (90 - craftingProgressRef.current) * 0.04);
          setCraftingPlan(prev => prev ? { ...prev, progress: craftingProgressRef.current } : null);
        }

        // Finish: streaming done AND minimum time passed AND progress >= 88
        if (streamingDoneRef.current && elapsed >= minDuration && craftingProgressRef.current >= 88) {
          craftingProgressRef.current = 100;
          setCraftingPlan(prev => prev ? { ...prev, progress: 100 } : null);

          if (craftingIntervalRef.current) {
            clearInterval(craftingIntervalRef.current);
            craftingIntervalRef.current = null;
          }

          setTimeout(() => {
            setCraftingActive(false);
            setCraftingPlan(null);
          }, 600);
        }
      }, 300);
    }
  }, [messages, isPremium]);

  // When streaming ends, mark it and update plan type from final content
  useEffect(() => {
    if (!isLoading && craftingIntervalRef.current && !streamingDoneRef.current) {
      streamingDoneRef.current = true;
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === "assistant") {
        const hasFlightsOrHotels = /```(flights|hotels)/s.test(lastMsg.content);
        setCraftingPlanType(hasFlightsOrHotels ? "full" : "local");
      }
    }
  }, [isLoading, messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (craftingIntervalRef.current) {
        clearInterval(craftingIntervalRef.current);
        craftingIntervalRef.current = null;
      }
    };
  }, []);

  const isCraftingPlan = craftingActive;
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [searchParams] = useSearchParams();
  const initialQuerySent = useRef(false);
  const [enrichedData, setEnrichedData] = useState<Record<string, any>>({});
  const [craftingPlan, setCraftingPlan] = useState<{ destination: string; progress: number } | null>(null);
  const prevActiveId = useRef(activeId);
  const prefsSynced = useRef(false);

  // Memoize parsed messages to avoid re-parsing on every render
  const parsedMessages = useMemo(() => {
    return messages.map((msg) => ({
      ...msg,
      parsed: msg.role === "assistant"
        ? parseMessageContent(msg.content)
        : { text: msg.content, flights: [], activities: [], hotels: [], itinerary: [], timeline: [], travelInfo: null, weather: null, quickReplies: [], destinationEnrich: null, placeImages: [], places: [] },
    }));
  }, [messages]);

  // Track the latest destination across the conversation so Swap works
  // even on messages that don't include a destination_enrich block.
  const latestDestination = useMemo(() => {
    for (let i = parsedMessages.length - 1; i >= 0; i--) {
      const p: any = parsedMessages[i].parsed;
      const d =
        p?.destinationEnrich?.destination ||
        p?.travelInfo?.destination ||
        (p?.places?.[0]?.location?.split(",")[0] || "").trim();
      if (d) return d;
    }
    return "";
  }, [parsedMessages]);

  // Clear enriched data when switching conversations
  useEffect(() => {
    if (activeId !== prevActiveId.current) {
      prevActiveId.current = activeId;
      setEnrichedData({});
      setLastFailedMessage(null);
      setPlanGenerated(false);
      setCraftingActive(false);
      setCraftingPlan(null);
      if (craftingIntervalRef.current) {
        clearInterval(craftingIntervalRef.current);
        craftingIntervalRef.current = null;
      }
      craftingProgressRef.current = 0;
      streamingDoneRef.current = false;
      lastCraftedMsgIndex.current = -1;
    }
  }, [activeId]);

  // Detect when a full plan has been generated for free users
  useEffect(() => {
    if (isPremium || isLoading || isCraftingPlan) return;
    const hasFullPlan = parsedMessages.some((msg) => {
      if (msg.role !== "assistant") return false;
      const p = msg.parsed;
      let blockTypes = 0;
      if (p.flights.length > 0) blockTypes++;
      if (p.hotels.length > 0) blockTypes++;
      if (p.activities.length > 0) blockTypes++;
      if (p.itinerary.length > 0) blockTypes++;
      return blockTypes >= 2;
    });
    if (hasFullPlan) setPlanGenerated(true);
  }, [parsedMessages, isLoading, isPremium, isCraftingPlan]);

  // Auto-enrich destinations when streaming is done
  // Premium: full enrichment. Free: imageOnly (1 Google photo for the paywall card)
  useEffect(() => {
    if (isLoading) return;
    parsedMessages.forEach((msg) => {
      if (msg.role !== "assistant") return;
      if (msg.parsed.destinationEnrich && !enrichedData[msg.parsed.destinationEnrich.destination]) {
        const { destination, travelMonth } = msg.parsed.destinationEnrich;
        if (isPremium) {
          const activityNames = msg.parsed.activities.map((a: any) => a.name).filter(Boolean);
          const hotelNamesList = msg.parsed.hotels.map((h: any) => h.name).filter(Boolean);
          fetchEnrichment(destination, travelMonth, activityNames, false, hotelNamesList).then((data) => {
            if (data) {
              setEnrichedData((prev) => ({ ...prev, [destination]: data }));
              if (data.images && data.images.length > 0) {
                setWikimediaImage(destination, data.images[0].thumbUrl || data.images[0].url);
              }
            }
          });
        } else {
          // Free users: just fetch 1 real Google image for the paywall card
          fetchEnrichment(destination, undefined, undefined, true).then((data) => {
            if (data) {
              setEnrichedData((prev) => ({ ...prev, [destination]: data }));
            }
          });
        }
      }
    });
  }, [parsedMessages, isLoading, isPremium]);

  // Auto-send query from URL params
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !initialQuerySent.current && messages.length === 0) {
      initialQuerySent.current = true;
      sendMessage(q);
    }
  }, [searchParams, messages.length, sendMessage]);

  const handleFlightClick = (flight: FlightData) => {
    setSelectedFlight(flight);
    setFlightModalOpen(true);
  };

  const handleActivityClick = (activity: ActivityData, msgIdx: number, destination: string) => {
    setSelectedActivity(activity);
    setSelectedActivityMsgIdx(msgIdx);
    setSelectedActivityDest(destination);
    setSelectedSlotRef(null);
    setActivityModalOpen(true);
  };

  const handleItinerarySlotClick = (
    slot: any,
    slotIdx: number,
    day: number,
    msgIdx: number,
    destination: string,
  ) => {
    const pseudo: ActivityData = {
      id: `slot-${msgIdx}-${day}-${slotIdx}`,
      name: slot.venue,
      category: slot.activity || "activity",
      duration: slot.duration || "~1 hour",
      price: slot.cost || 0,
      currency: "$",
      image: "food",
      occasion: "",
      description: `${slot.activity || "Planned stop"} in ${slot.neighborhood || destination}`,
      neighborhood: slot.neighborhood || "",
      hours: slot.time || "",
      bookAhead: !!slot.bookAhead,
      why: "",
    } as ActivityData;
    setSelectedActivity(pseudo);
    setSelectedActivityMsgIdx(msgIdx);
    setSelectedActivityDest(destination);
    setSelectedSlotRef({ day, slotIdx });
    setActivityModalOpen(true);
  };

  const handleHotelClick = (hotel: HotelData) => {
    setSelectedHotel(hotel);
    setHotelModalOpen(true);
  };

  const handleShare = async () => {
    try {
      await shareTripSummary(messages);
      toast.success("Trip summary copied to clipboard!");
    } catch {
      toast.error("Couldn't share trip summary");
    }
  };

  const handleExportPDF = () => {
    if (!isPremium) {
      setPaywallContext({});
      setShowPaywall(true);
      return;
    }
    const title = conversations.find(c => c.id === activeId)?.title || "My Trip Plan";
    exportTripPDF({ title, messages });
    toast.success("PDF downloaded!");
  };

  const handleSaveTrip = async () => {
    if (!user) {
      toast.error("Sign in to save trips", { action: { label: "Sign in", onClick: () => window.location.href = "/auth" } });
      return;
    }
    const convo = conversations.find(c => c.id === activeId);
    if (!convo) return;

    const { error } = await supabase.from("saved_trips").insert({
      user_id: user.id,
      title: convo.title,
      data_json: { messages: convo.messages },
    } as any);

    if (error) {
      toast.error("Failed to save trip");
    } else {
      toast.success("Trip saved to your account!");
    }
  };

  const getSmartSuggestions = () => {
    const month = new Date().getMonth();
    const hour = new Date().getHours();
    
    // Always include local/date options
    const local: string[] = [];
    if (hour >= 17) {
      local.push("Date night ideas in my city");
    } else {
      local.push("Fun things to do this weekend");
    }
    local.push("Best restaurants near me for a date");
    
    // Seasonal travel suggestions
    let travel: string[] = [];
    if (month >= 11 || month <= 1) {
      travel = ["Beach escape in the Maldives", "Christmas markets in Vienna"];
    } else if (month >= 2 && month <= 4) {
      travel = ["Cherry blossoms in Tokyo", "Romantic week in Santorini"];
    } else if (month >= 5 && month <= 7) {
      travel = ["Greek island hopping", "Summer in the Amalfi Coast"];
    } else {
      travel = ["Wine tasting in Tuscany", "Weekend getaway in Istanbul"];
    }
    
    return [...local, ...travel];
  };
  const suggestions = getSmartSuggestions();

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
    if (planGenerated && !isPremium) {
      setShowPaywall(true);
      return;
    }
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setLastFailedMessage(msg);
    sendMessage(msg);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleRetry = useCallback(() => {
    if (lastFailedMessage) {
      sendMessage(lastFailedMessage);
      setLastFailedMessage(null);
    }
  }, [lastFailedMessage, sendMessage]);

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
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground px-2">No previous chats</p>
          ) : (
            <div className="space-y-1">
              {conversations.map(c => (
                <div
                  key={c.id}
                  className={`group flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors ${
                    c.id === activeId ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
                  }`}
                  onClick={() => switchChat(c.id)}
                >
                  <span className="flex-1 truncate">{c.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                    onClick={(e) => { e.stopPropagation(); deleteChat(c.id); }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-3 border-t border-border space-y-2">
          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/my-trips" className="flex-1 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <User className="h-4 w-4" /> My Trips
              </Link>
              <Link to="/settings">
                <Button variant="ghost" size="icon" className="h-7 w-7" title="Settings">
                  <Settings className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={signOut}>
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Link to="/auth" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <User className="h-4 w-4" /> Sign in
            </Link>
          )}
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Compass className="h-4 w-4" /> Back to home
          </Link>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between gap-3 p-3 border-b border-border">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5" />
              <span className="font-semibold">Jolliday</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {compareItems.length > 0 && (
              <Button variant="ghost" size="icon" onClick={() => setCompareOpen(true)} className="h-9 w-9 relative">
                <GitCompare className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                  {compareItems.length}
                </span>
              </Button>
            )}
            {hasMessages && (
              <Button variant="ghost" size="icon" onClick={handleSaveTrip} className="h-9 w-9" title="Save trip">
                <Save className="h-4 w-4" />
              </Button>
            )}
            {hasMessages && (
              <Button variant="ghost" size="icon" onClick={handleExportPDF} className="h-9 w-9" title="Export PDF">
                <Download className="h-4 w-4" />
              </Button>
            )}
            {hasMessages && (
              <Button variant="ghost" size="icon" onClick={handleShare} className="h-9 w-9" title="Share">
                <Share2 className="h-4 w-4" />
              </Button>
            )}
            <ThemeToggle />
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
                <h1 className="text-2xl font-semibold mb-2">
                  {preferences.displayName
                    ? `Hey ${preferences.displayName}, what are we planning?`
                    : "What are you up to?"}
                </h1>
                <p className="text-muted-foreground text-center mb-8">
                  Plan a trip, find a date spot, or discover what's happening near you.
                </p>
                <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                  {suggestions.map((s) => (
                    <button key={s} onClick={() => sendMessage(s)} className="p-3 text-left text-sm border border-border rounded-xl hover:bg-muted active:scale-95 transition-all">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {parsedMessages.map((msg, i) => {
                  // Hide the streaming assistant message while crafting plan
                  const isLastMsg = i === parsedMessages.length - 1;
                  if (isCraftingPlan && isLastMsg && msg.role === "assistant") return null;

                  const parsed = { ...msg.parsed };

                  // Merge enriched live data if available
                 const enrichDest =
                   parsed.destinationEnrich?.destination ||
                   parsed.travelInfo?.destination ||
                   (parsed.itinerary[0] as any)?.destination ||
                   (parsed.places[0]?.location?.split(",")[0] || "").trim() ||
                   undefined;
                  const enrichData = enrichDest ? enrichedData[enrichDest] : null;
                  if (enrichData) {
                    if (enrichData.country && parsed.travelInfo) {
                      parsed.travelInfo = {
                        ...parsed.travelInfo,
                        currency: enrichData.country.currency || parsed.travelInfo.currency,
                        language: enrichData.country.language || parsed.travelInfo.language,
                        timezone: enrichData.country.timezone || parsed.travelInfo.timezone,
                        exchangeRate: enrichData.country.exchangeRate,
                        isLive: true,
                      };
                    }
                    // Enrich AI hotels with verified Google Places photos.
                    // Keep hotels even if no photo match — the card has a graceful
                    // gradient placeholder. Dropping them left users with empty plans.
                    const hotelPhotos = enrichData.hotelPhotos || {};
                    parsed.hotels = parsed.hotels.map((h: HotelData) => {
                      const match = hotelPhotos[h.name];
                      if (match?.hasRealPhoto && (match?.thumbPhoto || match?.photo)) {
                        return {
                          ...h,
                          realImage: match.thumbPhoto || match.photo,
                          rating: match.rating || h.rating,
                          isLive: true,
                          verified: true,
                          verifiedAddress: match.address || null,
                        };
                      }
                      return h;
                    });
                    // Apply destination images to flights
                    const images = enrichData.images || [];
                    if (images.length > 0) {
                      parsed.flights = parsed.flights.map((f: FlightData, idx: number) => {
                        if (f.realPhoto) return f;
                        const img = images[idx % images.length];
                        return { ...f, realPhoto: img.thumbUrl || img.url };
                      });
                    }
                    // Assign verified Google Places photos to activities.
                    // Keep activities without a photo match — they still have name,
                    // description, etc. Card shows a gradient placeholder.
                     const activityPhotos = enrichData.activityPhotos || {};
                    // Build a case-insensitive lookup so renamed venues still match
                    const photoLookup: Record<string, any> = {};
                    for (const [k, v] of Object.entries(activityPhotos)) {
                      photoLookup[k.toLowerCase().trim()] = v;
                       const matchedName = (v as any)?.matchedName;
                       if (typeof matchedName === "string" && matchedName.trim()) {
                         photoLookup[matchedName.toLowerCase().trim()] = v;
                       }
                    }
                    parsed.activities = parsed.activities.map((act: ActivityData) => {
                      const key = (act.name || "").toLowerCase().trim();
                      let match: any = activityPhotos[act.name] || photoLookup[key];
                      // Loose contains-match for renamed venues
                      if (!match?.hasRealPhoto) {
                        for (const [k, v] of Object.entries(photoLookup)) {
                          if (!key) break;
                          if (k.includes(key) || key.includes(k)) { match = v; break; }
                        }
                      }
                      if (match?.hasRealPhoto && (match?.thumbPhoto || match?.photo)) {
                        const heroPhoto = match.photo || match.thumbPhoto;
                        const allPhotos = Array.isArray(match.photos) && match.photos.length > 0
                          ? match.photos.slice(0, 4)
                          : (heroPhoto ? [heroPhoto] : []);
                        return {
                          ...act,
                          realPhoto: heroPhoto,
                          realPhotos: allPhotos,
                          isReal: true,
                          verified: true,
                          verifiedAddress: match.address || null,
                          verifiedRating: match.rating || null,
                        };
                      }
                      // No verified place match — leave the card without a fake/wrong image.
                      // The UI shows a clean gradient placeholder instead.
                      return act;
                    });
                  }

                  const isLastAssistant = msg.role === "assistant" && i === parsedMessages.length - 1;
                  // Hide the latest assistant response entirely while streaming or crafting (free users only)
                  const hideLatestResponse = isLastAssistant && !isPremium && (isLoading || isCraftingPlan);

                  // Determine if this is a "full trip plan" (has multiple card types)
                  const cardTypeCount = [parsed.flights.length > 0, parsed.hotels.length > 0, parsed.activities.length > 0, parsed.itinerary.length > 0].filter(Boolean).length;
                  const isFullPlan = cardTypeCount >= 2;
                  const destination = parsed.travelInfo?.destination
                    || parsed.flights[0]?.cityImage
                    || parsed.hotels[0]?.location?.split(",")[0]
                    || "";

                  return (
                    <div key={i} className="animate-fade-in">
                      {msg.role === "user" ? (
                        <div className="flex justify-end">
                          <div className="bg-muted rounded-2xl px-4 py-2 max-w-[80%]">
                            <p className="text-sm">{parsed.text}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center shrink-0">
                            <Compass className="h-4 w-4 text-background" />
                          </div>
                          <div className="flex-1 min-w-0">
                            {parsed.text && !hideLatestResponse && (
                              <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
                                <ReactMarkdown>{parsed.text}</ReactMarkdown>
                              </div>
                            )}


                            {/* Full plan → show summary card; otherwise show inline cards */}
                            {/* Hide plan cards while crafting animation is still running */}
                            {isFullPlan && destination && !hideLatestResponse ? (
                              isPremium ? (
                                <TripSummaryCard
                                  data={parsed as TripPlanData}
                                  destination={destination}
                                  enrichedImages={enrichData?.images}
                                />
                              ) : (
                                <PlanPreviewGate
                                  data={parsed as TripPlanData}
                                  destination={destination}
                                  enrichedImages={enrichData?.images}
                                  onUpgrade={() => {
                                    setPaywallContext({
                                      destination,
                                      tripStats: {
                                        activities: parsed.activities.length,
                                        hotels: parsed.hotels.length,
                                        days: parsed.itinerary.length,
                                      },
                                    });
                                    setShowPaywall(true);
                                  }}
                                />
                              )
                            ) : !hideLatestResponse && (
                              <>
                                {/* If plan already generated and user is free, gate ALL card blocks */}
                                {planGenerated && !isPremium ? (
                                  (parsed.flights.length > 0 || parsed.hotels.length > 0 || parsed.activities.length > 0 || parsed.itinerary.length > 0) ? (
                                    <div className="mt-4 p-4 rounded-xl border border-border bg-muted/30 text-center">
                                      <p className="text-sm font-medium text-foreground mb-2">🔒 Unlock your full plan</p>
                                      <p className="text-xs text-muted-foreground mb-3">Start your free trial to see everything</p>
                                      <Button size="sm" onClick={() => setShowPaywall(true)} className="gap-1.5">
                                        <Crown className="h-3.5 w-3.5" /> Start Free Trial
                                      </Button>
                                    </div>
                                  ) : null
                                ) : (
                                  <>
                                    {parsed.timeline.length > 0 && (
                                      <TripTimeline legs={parsed.timeline} />
                                    )}
                                    {parsed.places.length > 0 && (
                                      <PlacesGallery places={parsed.places} />
                                    )}
                                    {parsed.flights.length > 0 && (
                                      <HorizontalCarousel>
                                        {parsed.flights.map((f, idx) => (
                                          <FlightCard key={f.id || idx} flight={f} onClick={() => handleFlightClick(f)} />
                                        ))}
                                      </HorizontalCarousel>
                                    )}
                                    {parsed.hotels.length > 0 && (
                                      <HorizontalCarousel>
                                        {parsed.hotels.map((h, idx) => (
                                          <HotelCard key={h.id || idx} hotel={h} onClick={() => handleHotelClick(h)} />
                                        ))}
                                      </HorizontalCarousel>
                                    )}
                                    {parsed.activities.length > 0 && (
                                      <HorizontalCarousel>
                                        {parsed.activities.map((a, idx) => (
                          <ActivityCard key={a.id || idx} activity={a} onClick={() => handleActivityClick(a, i, enrichDest || latestDestination)} />
                                        ))}
                                      </HorizontalCarousel>
                                    )}
                                    {parsed.itinerary.length > 0 && (
                                      <HorizontalCarousel>
                                        {parsed.itinerary.map((item, idx) => (
                                          <ItineraryCard
                                            key={idx}
                                            item={item}
                                            onSlotClick={(slot, slotIdx) =>
                                              handleItinerarySlotClick(slot, slotIdx, item.day, i, enrichDest || latestDestination)
                                            }
                                          />
                                        ))}
                                      </HorizontalCarousel>
                                    )}
                                    {parsed.travelInfo && (
                                      <>
                                        <TravelInfoCard info={parsed.travelInfo} />
                                        {parsed.travelInfo.currency && (
                                          <CurrencyConverter destinationCurrency={parsed.travelInfo.currency} />
                                        )}
                                      </>
                                    )}
                                  </>
                                )}
                              </>
                            )}

                            {isLastAssistant && !isLoading && parsed.quickReplies.length > 0 && !(planGenerated && !isPremium) && (
                              <QuickReplies replies={parsed.quickReplies} onSelect={(reply) => {
                                if (planGenerated && !isPremium) { setShowPaywall(true); return; }
                                sendMessage(reply);
                              }} />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Plan crafting animation — full width, prominent */}
                {isCraftingPlan && craftingPlan && (
                  <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
                    <div className="w-full max-w-md mx-auto text-center">
                      <div className="relative mb-6">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
                          <Compass className="h-8 w-8 text-primary" />
                        </div>
                      </div>
                      <p className="text-lg font-semibold text-foreground mb-1">
                        {craftingPlan.destination
                          ? `Crafting your ${craftingPlan.destination} plan...`
                          : "Crafting your perfect plan..."}
                      </p>
                      <p className="text-sm text-muted-foreground mb-6">
                        {craftingPlanType === "local" ? (
                          craftingPlan.progress < 20
                            ? "Finding the best spots nearby..."
                            : craftingPlan.progress < 40
                            ? "Curating must-see experiences..."
                            : craftingPlan.progress < 60
                            ? "Building your day-by-day plan..."
                            : craftingPlan.progress < 80
                            ? "Adding insider tips & hidden gems..."
                            : "Polishing final details ✨"
                        ) : (
                          craftingPlan.progress < 15
                            ? "Searching flights and routes..."
                            : craftingPlan.progress < 30
                            ? "Scouting the best hotels..."
                            : craftingPlan.progress < 50
                            ? "Curating must-see experiences..."
                            : craftingPlan.progress < 65
                            ? "Building your day-by-day itinerary..."
                            : craftingPlan.progress < 80
                            ? "Adding insider recommendations..."
                            : "Polishing final details ✨"
                        )}
                      </p>
                      <div className="flex items-center gap-3 max-w-xs mx-auto">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${craftingPlan.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-foreground tabular-nums w-10">
                          {Math.round(craftingPlan.progress)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {isLoading && !isCraftingPlan && (!isPremium || !hasStreamedContent) && (
                  <div className="flex gap-3 animate-fade-in">
                    <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center shrink-0 animate-pulse">
                      <Compass className="h-4 w-4 text-background" />
                    </div>
                    <div className="flex gap-1 py-2">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot" />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot" />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot" />
                    </div>
                  </div>
                )}
                {qaStatus && !isCraftingPlan && (
                  <div className="flex gap-3 animate-fade-in">
                    <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center shrink-0">
                      <Compass className="h-4 w-4 text-background animate-spin" style={{ animationDuration: "2s" }} />
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-pulse" />
                      {qaStatus === "verifying" ? "Double-checking places…" : "Polishing a few details…"}
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
            <div className="max-w-3xl mx-auto mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-center gap-3">
              <span>{error}</span>
              {lastFailedMessage && (
                <Button variant="ghost" size="sm" onClick={handleRetry} className="h-7 gap-1 text-destructive hover:text-destructive">
                  <RotateCcw className="h-3 w-3" /> Retry
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="p-4 pb-6">
          <div className="max-w-3xl mx-auto">
            {planGenerated && !isPremium ? (
              <div className="chat-input-container p-4 text-center">
                <p className="text-sm font-medium text-foreground mb-1">
                  ✨ Your plan is ready — don't miss out
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Start your 3-day free trial to unlock everything and keep chatting
                </p>
                <Button
                  onClick={() => setShowPaywall(true)}
                  className="gap-2"
                  variant="default"
                >
                  <Crown className="h-4 w-4" />
                  Start Free Trial — 3 Days Free
                </Button>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit}>
                  <div className="chat-input-container p-2">
                    <div className="flex items-end gap-2">
                      <textarea
                        ref={textareaRef}
                        placeholder="Message Jolliday..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        rows={1}
                        className="flex-1 bg-transparent px-3 py-2 text-sm resize-none focus:outline-none min-h-[40px] max-h-[200px]"
                      />
                      <VoiceInput onTranscript={(t) => setInput(prev => prev ? prev + " " + t : t)} disabled={isLoading} />
                      <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="h-9 w-9 rounded-lg shrink-0">
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </form>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Jolliday can make mistakes. Verify travel details before booking.
                </p>
              </>
            )}
          </div>
        </div>
      </main>

      <BudgetPanel />
      <ComparisonModal open={compareOpen} onOpenChange={setCompareOpen} />
      <FlightDetailModal flight={selectedFlight} open={flightModalOpen} onOpenChange={setFlightModalOpen} />
      <ActivityDetailModal
        activity={selectedActivity}
        open={activityModalOpen}
        onOpenChange={setActivityModalOpen}
        destination={selectedActivityDest}
        excludeNames={(() => {
          const msg: any = selectedActivityMsgIdx >= 0 ? messages[selectedActivityMsgIdx] : null;
          if (!msg) return [];
          const names = new Set<string>();
          const content: string = msg.content || "";
          // Pull names from any ```activities``` and ```itinerary``` blocks in the message.
          const grab = (re: RegExp) => {
            const m = content.match(re);
            if (!m) return;
            try {
              const arr = JSON.parse(m[1]);
              if (Array.isArray(arr)) {
                for (const item of arr) {
                  if (item?.name) names.add(item.name);
                  if (Array.isArray(item?.slots)) {
                    for (const s of item.slots) if (s?.venue) names.add(s.venue);
                  }
                }
              }
            } catch {}
          };
          grab(/```activities\s*([\s\S]*?)```/);
          grab(/```itinerary\s*([\s\S]*?)```/);
          return Array.from(names);
        })()}
        onReplace={selectedActivity && selectedActivityMsgIdx >= 0 ? (newAct) => {
          if (selectedSlotRef) {
            replaceItinerarySlot(selectedActivityMsgIdx, selectedSlotRef.day, selectedSlotRef.slotIdx, newAct);
          } else {
            replaceActivity(selectedActivityMsgIdx, selectedActivity.id, newAct);
          }
        } : undefined}
      />
      <HotelDetailModal hotel={selectedHotel} open={hotelModalOpen} onOpenChange={setHotelModalOpen} />
      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        destination={paywallContext.destination}
        tripStats={paywallContext.tripStats}
      />
    </div>
  );
};

export default Chat;
