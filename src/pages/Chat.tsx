import { useState, useRef, useEffect, useMemo, useCallback, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, Plus, Menu, ChevronLeft, ChevronRight, Share2, Trash2, GitCompare, Download, Save, User, LogOut, MapPin, Settings, RotateCcw, Crown, MoreHorizontal, Sparkles, Plane, Calendar, Users, Mountain, Utensils, PanelLeftClose } from "lucide-react";
import Logo, { LogoMark } from "@/components/Logo";
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
import TripTimeline, { TimelineLeg } from "@/components/TripTimeline";
import TravelInfoCard, { TravelInfoData } from "@/components/TravelInfoCard";
import QuickReplies from "@/components/QuickReplies";
import ComparisonModal from "@/components/ComparisonModal";
import VoiceInput from "@/components/VoiceInput";
import StreamingText from "@/components/StreamingText";
import CurrencyConverter from "@/components/CurrencyConverter";
import TripMap, { type MapPoint } from "@/components/TripMap";
import TripSummaryCard, { TripPlanData } from "@/components/TripSummaryCard";
import PlanPreviewGate from "@/components/PlanPreviewGate";
import PlanCraftingMap, { type CraftActivity } from "@/components/PlanCraftingMap";
import PlacesGallery, { PlaceItem } from "@/components/PlacesGallery";
import PaywallModal from "@/components/PaywallModal";
import { extractBlock as extractBlockShared, stripFencedBlocks } from "@/utils/planParser";
import { useSubscription } from "@/hooks/useSubscription";
import { HotelData, useTripContext } from "@/contexts/TripContext";
import { shareTripSummary } from "@/utils/tripSummary";
import { exportTripPDF } from "@/utils/pdfExport";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { getAuthHeader } from "@/lib/authFetch";
import { setWikimediaImage } from "@/utils/cityImages";
import { Link, useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

// Enrichment cache to avoid re-fetching
const enrichmentCache: Record<string, any> = {};
const warmedImageUrls = new Set<string>();

const warmImage = (url?: string) => {
  if (typeof window === "undefined" || !url || warmedImageUrls.has(url)) return;
  warmedImageUrls.add(url);
  const img = new Image();
  img.decoding = "async";
  img.src = url;
};

const warmEnrichmentAssets = (data: any) => {
  data?.images?.slice?.(0, 4)?.forEach?.((img: any) => warmImage(img?.thumbUrl || img?.url));
  Object.values(data?.activityPhotos || {}).forEach((photo: any) => {
    warmImage(photo?.thumbPhoto || photo?.photo);
    if (Array.isArray(photo?.photos)) {
      photo.photos.slice(0, 3).forEach((url: string) => warmImage(url));
    }
  });
};

const mergeEnrichmentData = (prev: any, next: any) => {
  if (!prev) return next;
  if (!next) return prev;

  const mergedActivityPhotos = {
    ...(prev.activityPhotos || {}),
    ...(next.activityPhotos || {}),
  };

  return {
    ...prev,
    ...next,
    geo: next.geo ?? prev.geo,
    images: Array.isArray(next.images) && next.images.length > 0 ? next.images : prev.images,
    places: Array.isArray(next.places) && next.places.length > 0 ? next.places : prev.places,
    hotels: Array.isArray(next.hotels) && next.hotels.length > 0 ? next.hotels : prev.hotels,
    activityPhotos: mergedActivityPhotos,
  };
};

const fetchEnrichment = async (destination: string, travelMonth?: string, activityNames?: string[], imageOnly?: boolean, hotelNames?: string[]) => {
  // Cache key includes activity/hotel names to avoid stale photo reuse
  const namesHash = [...(activityNames || []), ...(hotelNames || [])].sort().join("|").slice(0, 100);
  const cacheKey = imageOnly ? `${destination}-imageOnly` : `${destination}-${travelMonth || ""}-${namesHash}`;
  if (enrichmentCache[cacheKey]) return enrichmentCache[cacheKey];

  try {
    const authHeader = await getAuthHeader();
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enrich-destination`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
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

// Parse message content to extract all block types.
// Uses the shared planParser util so backticks inside JSON strings can't
// prematurely close a fence. See src/utils/planParser.ts for details.
const parseMessageContent = (content: string) => {
  if (!content) {
    return { text: "", flights: [], activities: [], hotels: [], itinerary: [], timeline: [], travelInfo: null, weather: null, quickReplies: [], destinationEnrich: null, placeImages: [] as { place: string; vibes?: string[] }[], places: [] as PlaceItem[] };
  }
  const allRanges: [number, number][] = [];

  const pick = (type: string) => {
    const { items, ranges } = extractBlockShared(content, type);
    allRanges.push(...ranges);
    return items;
  };

  const flights: FlightData[] = pick("flights");
  const activities: ActivityData[] = pick("activities");
  const hotels: HotelData[] = pick("hotels");
  const itinerary: ItineraryData[] = pick("itinerary");
  const timeline: TimelineLeg[] = pick("timeline");

  const enrichArr = pick("destination_enrich");
  const destinationEnrich: { destination: string; travelMonth?: string } | null =
    enrichArr.length > 0 ? enrichArr[0] : null;

  const travelInfoArr = pick("travelinfo");
  const travelInfo: TravelInfoData | null = travelInfoArr.length > 0 ? travelInfoArr[0] : null;

  const weatherArr = pick("weather");
  const weather: any = weatherArr.length > 0 ? weatherArr[0] : null;

  const qrArr = pick("quickreplies");
  let quickReplies: string[] =
    qrArr.length > 0 ? (Array.isArray(qrArr[0]) ? qrArr[0] : qrArr) : [];

  const placesArr = pick("places");
  const places: PlaceItem[] =
    placesArr.length > 0
      ? placesArr
          .filter((p: any) => p && typeof p.name === "string" && typeof p.location === "string")
          .slice(0, 12)
          .map((p: any) => ({ name: p.name, location: p.location, why: p.why, category: p.category }))
      : [];

  let text = stripFencedBlocks(content, allRanges);

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

  // NOTE: the legacy `place_images` block was removed — the system prompt
  // forbids it and no UI renders it.
  return {
    text: text.trim(),
    flights,
    activities,
    hotels,
    itinerary,
    timeline,
    travelInfo,
    weather,
    quickReplies,
    destinationEnrich,
    placeImages: [] as { place: string; vibes?: string[] }[],
    places,
  };
};

const cleanTripLocation = (value: string) =>
  value
    .replace(/\b(?:for\s+)?\d+\s*(?:day|days|night|nights|week|weeks)\b.*$/i, "")
    .replace(/\b(?:solo traveler|with a partner|with friends|with family|mid-range|budget|luxury|architecture-focused|foodie)\b.*$/i, "")
    .replace(/[.,]$/, "")
    .trim();

const inferCitiesFromPrompt = (text: string) => {
  const source = text || "";
  const routeMatch = source.match(/\bfrom\s+([^,.\n]+?)\s+to\s+([^,.\n]+?)(?:\s+(?:for\s+)?\d+\s*(?:day|days|night|nights|week|weeks)\b|\s+for\s+|\s+on\s+|\.|,|$)/i);
  const shorthandRouteMatch = source.match(/^\s*([^,.\n]+?)\s+to\s+([^,.\n]+?)(?:\s+(?:for\s+)?\d+\s*(?:day|days|night|nights|week|weeks)\b|\s+for\s+|\s+on\s+|\.|,|$)/i);

  const destinationMatch =
    routeMatch?.[2] ||
    shorthandRouteMatch?.[2] ||
    source.match(/\btrip to\s+([^,.\n]+?)(?:\s+from\s+|\s+for\s+|\s+on\s+|\s+leaving\s+|\.|,|$)/i)?.[1] ||
    source.match(/\bto\s+([^,.\n]+?)(?:\s+from\s+|\s+for\s+|\s+on\s+|\s+leaving\s+|\.|,|$)/i)?.[1] ||
    "";

  const originMatch =
    routeMatch?.[1] ||
    shorthandRouteMatch?.[1] ||
    source.match(/\bfrom\s+([^,.\n]+?)(?:\s+for\s+|\s+on\s+|\s+to\s+|\.|,|$)/i)?.[1] ||
    source.match(/\bdeparting from\s+([^,.\n]+?)(?:\s+for\s+|\s+on\s+|\s+to\s+|\.|,|$)/i)?.[1] ||
    "";

  return {
    destination: cleanTripLocation(destinationMatch),
    origin: cleanTripLocation(originMatch),
  };
};

const extractStructuredDestination = (content: string) => {
  const destinationEnrichMatch = content.match(/```destination_enrich\s*([\s\S]*?)(```|$)/i);
  if (destinationEnrichMatch) {
    try {
      const parsed = JSON.parse(destinationEnrichMatch[1].trim());
      if (typeof parsed?.destination === "string") return parsed.destination.trim();
    } catch {
      // ignore partial streamed JSON
    }
  }

  const travelInfoMatch = content.match(/```travelinfo\s*([\s\S]*?)(```|$)/i);
  if (travelInfoMatch) {
    try {
      const parsed = JSON.parse(travelInfoMatch[1].trim());
      if (typeof parsed?.destination === "string") return parsed.destination.trim();
    } catch {
      // ignore partial streamed JSON
    }
  }

  // Only accept the plain-regex fallback when it's clearly a COMPLETED field
  // (closing quote present). Without this, during streaming "destination":"Stock
  // matches and the crafting map flickers "Stock" → "Stockholm".
  const plainMatch = content.match(/"destination"\s*:\s*"([^"]+)"\s*(,|\})/i);
  return plainMatch?.[1]?.trim() || "";
};

const isPlanConfirmationMessage = (text: string) => {
  const normalized = text.trim().toLowerCase();
  return (
    normalized === "yes, prepare the plan" ||
    normalized === "prepare the plan" ||
    normalized === "yes prepare the plan" ||
    /\b(prepare|create|make|build)\b.{0,24}\bplan\b/i.test(text)
  );
};

const hasCraftingSignals = (content: string) => /(?:```)?(activities|itinerary|hotels|flights|travelinfo|destination_enrich)\b/i.test(content);

// Cheap heuristic to detect a "full" plan during streaming. Previously this
// ran parseMessageContent which does all the JSON work and is expensive;
// all we need is a presence check of 2+ block fences.
const hasRenderableFullPlan = (content: string) => {
  const types = ["flights", "hotels", "activities", "itinerary"];
  let count = 0;
  for (const t of types) {
    // Opening fence with any content after it is enough — even a partially
    // streamed block means the model committed to that block type.
    if (new RegExp("```" + t + "\\s", "i").test(content)) count++;
    if (count >= 2) return true;
  }
  return false;
};

const HorizontalCarousel = forwardRef<HTMLDivElement, { children: React.ReactNode }>(({ children }, ref) => {
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
    <div ref={ref} className="relative mt-4">
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
});

HorizontalCarousel.displayName = "HorizontalCarousel";

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
  const { isPremium, loading: subLoading } = useSubscription();
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
  const [enrichedData, setEnrichedData] = useState<Record<string, any>>({});
  const [craftingPlan, setCraftingPlan] = useState<{ destination: string; progress: number } | null>(null);
  const prevActiveId = useRef(activeId);
  const prefsSynced = useRef(false);

  const originCity = useMemo(() => {
    try {
      const raw = localStorage.getItem("jolliday-preferences");
      const p = raw ? JSON.parse(raw) : {};
      // Empty string signals "no known origin" — the map will skip the flight
      // phase instead of pretending the user is in London.
      return (p?.homeCity as string)?.trim() || "";
    } catch {
      return "";
    }
  }, []);

  // Track whether assistant has started streaming content for current response
  const hasStreamedContent = useMemo(() => {
    if (!isLoading) return false;
    const lastMsg = messages[messages.length - 1];
    return lastMsg?.role === "assistant" && lastMsg.content.length > 0;
  }, [isLoading, messages]);

  // Crafting active state — fully decoupled from isLoading
  const [craftingActive, setCraftingActive] = useState(false);
  const [craftingPlanType, setCraftingPlanType] = useState<"full" | "local">("full");
  const [craftingOriginCity, setCraftingOriginCity] = useState<string>("");
  const lastCraftedMsgIndex = useRef(-1);
  const craftingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const craftingFinalizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const craftingProgressRef = useRef(0);
  const streamingDoneRef = useRef(false);
  const craftingStartTimeRef = useRef(0);
  const pendingCraftSeedRef = useRef<string>("");

  const startCrafting = useCallback((destination: string, origin: string, content = "") => {
    const cleanedDestination = destination.trim();
    if (!cleanedDestination || craftingIntervalRef.current) return;

    craftingProgressRef.current = 0;
    streamingDoneRef.current = false;
    if (craftingFinalizeTimeoutRef.current) {
      clearTimeout(craftingFinalizeTimeoutRef.current);
      craftingFinalizeTimeoutRef.current = null;
    }
    craftingStartTimeRef.current = Date.now();
    setCraftingPlanType(/```(flights|hotels)/s.test(content) ? "full" : "local");
    setCraftingOriginCity(origin.trim());
    // Seed with a small non-zero progress so the bar looks alive from frame 1.
    // The curve then eases up toward 90% until the AI actually streams back.
    craftingProgressRef.current = 12;
    setCraftingPlan({ destination: cleanedDestination, progress: 12 });
    setCraftingActive(true);

    craftingIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - craftingStartTimeRef.current;
      // Adaptive min duration: quick but not jarring.
      // 4s baseline, 2.5s if streaming is already done.
      const minDuration = streamingDoneRef.current ? 2500 : 4000;

      if (craftingProgressRef.current < 90) {
        craftingProgressRef.current = Math.min(90, craftingProgressRef.current + (90 - craftingProgressRef.current) * 0.08);
        setCraftingPlan(prev => prev ? { ...prev, progress: craftingProgressRef.current } : null);
      }

      if (streamingDoneRef.current && elapsed >= minDuration && craftingProgressRef.current >= 60) {
        craftingProgressRef.current = 100;
        setCraftingPlan(prev => prev ? { ...prev, progress: 100 } : null);

        if (craftingIntervalRef.current) {
          clearInterval(craftingIntervalRef.current);
          craftingIntervalRef.current = null;
        }

        // Wait two animation frames so React can mount + paint the plan card
        // BEFORE we tear the crafting map down. Eliminates the white flicker
        // between the two states.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            pendingCraftSeedRef.current = "";
            setCraftingActive(false);
            setCraftingPlan(null);
            setCraftingOriginCity("");
          });
        });
      }
    }, 300);
  }, []);

  // Start crafting as soon as a full-plan request is in flight, even before blocks stream back.
  useEffect(() => {
    if (!isLoading || craftingIntervalRef.current) return;

    const userMessages = messages.filter((msg) => msg.role === "user");
    const latestUser = userMessages[userMessages.length - 1];
    const previousUser = userMessages[userMessages.length - 2];
    if (!latestUser) return;

    const latestCities = inferCitiesFromPrompt(latestUser.content);
    const previousCities = inferCitiesFromPrompt(previousUser?.content || "");
    const origin = latestCities.origin || previousCities.origin || originCity;

    // Try to recover a destination from the most recent assistant message that
    // already mentioned one (e.g., during a follow-up "yes, prepare the plan").
    let recoveredDestination = "";
    for (let i = messages.length - 1; i >= 0 && !recoveredDestination; i--) {
      const m = messages[i];
      if (m.role === "assistant") {
        recoveredDestination = extractStructuredDestination(m.content) || "";
      }
    }

    const destination =
      latestCities.destination ||
      previousCities.destination ||
      recoveredDestination ||
      "your trip";

    // Start the crafting animation the instant we're confident the AI will
    // build a plan this turn. We don't wait for the AI to start streaming
    // fenced blocks (that's the "hang" the user hated). Triggers:
    //  1) Explicit "prepare/create/make the plan" phrasing.
    //  2) Prior assistant message asked to prepare; user replied yes.
    //  3) The user message itself *is* a plan request — contains both a
    //     destination AND some duration signal ("3 days", "a week",
    //     "weekend", a date-range), OR contains explicit travel verbs
    //     ("plan a trip to...", "trip to X for Y days", "from X to Y").
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    const lastAssistantAskedToPrepare = lastAssistant
      ? /(shall i (prepare|build|create|make) (the )?(full )?plan|ready to (prepare|build|create|make) (your |the )?plan|prepare the (full )?plan\??)/i.test(lastAssistant.content)
      : false;
    const userSaidYes = /^\s*(yes|yep|yeah|sure|ok(ay)?|do it|go ahead|please do|sounds good|let's go|let's do it|prepare it|make it)\b[\s.!?]*$/i.test(latestUser.content);

    const userMsgText = latestUser.content || "";
    const hasDestinationInUserMsg = !!latestCities.destination;
    const hasDurationHint =
      /\b\d+\s*(?:day|days|night|nights|week|weeks)\b/i.test(userMsgText) ||
      /\b(?:weekend|long\s*weekend|a\s+week|two\s+weeks|couple\s+of\s+days|few\s+days|quick\s+getaway)\b/i.test(userMsgText);
    const hasTravelVerb =
      /\b(?:trip|travel|vacation|holiday|plan\s+a|visit|explore|itinerary)\b/i.test(userMsgText) ||
      /\bfrom\s+[^.\n]+?\s+to\s+[^.\n]+/i.test(userMsgText);
    const looksLikePlanRequest =
      hasDestinationInUserMsg && (hasDurationHint || hasTravelVerb);

    const shouldStart =
      isPlanConfirmationMessage(latestUser.content) ||
      (lastAssistantAskedToPrepare && userSaidYes) ||
      looksLikePlanRequest;

    if (!shouldStart) return;

    const seed = `${latestUser.content}|${destination}|${origin}`;
    if (pendingCraftSeedRef.current !== seed) {
      pendingCraftSeedRef.current = seed;
      startCrafting(destination, origin);
    }
  }, [isLoading, messages, originCity, startCrafting]);

  // Upgrade the in-flight loader once the assistant starts streaming structured plan data.
  useEffect(() => {
    const lastIdx = messages.length - 1;
    if (lastIdx < 0) return;
    const lastMsg = messages[lastIdx];
    if (!lastMsg || lastMsg.role !== "assistant") return;

    const content = lastMsg.content;
    if (!hasCraftingSignals(content)) return;

    const structuredDestination = extractStructuredDestination(content);
    const fallback = craftingPlan?.destination || inferCitiesFromPrompt(messages.filter((msg) => msg.role === "user").slice(-1)[0]?.content || "").destination;
    const nextDestination = structuredDestination || fallback;
    if (!nextDestination) return;

    // Only START a new crafting session here if the early-start effect didn't
    // already kick one off for the current user turn. Otherwise we'd show the
    // animation twice (once on send, once when structured blocks stream in).
    if (
      isLoading &&
      !craftingIntervalRef.current &&
      !pendingCraftSeedRef.current &&
      lastIdx !== lastCraftedMsgIndex.current
    ) {
      lastCraftedMsgIndex.current = lastIdx;
      startCrafting(nextDestination, craftingOriginCity || originCity, content);
      return;
    }

    setCraftingPlan((prev) => prev ? {
      ...prev,
      destination: structuredDestination || prev.destination,
    } : prev);
    setCraftingPlanType(/```(flights|hotels)/s.test(content) ? "full" : "local");
  }, [messages, isLoading, craftingPlan?.destination, craftingOriginCity, originCity, startCrafting]);

  // When streaming ends, mark it and update plan type from final content
  useEffect(() => {
    if (!isLoading && craftingIntervalRef.current && !streamingDoneRef.current) {
      streamingDoneRef.current = true;
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === "assistant") {
        const hasFlightsOrHotels = /```(flights|hotels)/s.test(lastMsg.content);
        setCraftingPlanType(hasFlightsOrHotels ? "full" : "local");
        if (hasRenderableFullPlan(lastMsg.content)) {
          craftingProgressRef.current = Math.max(craftingProgressRef.current, 58);
          setCraftingPlan((prev) => prev ? { ...prev, progress: Math.max(prev.progress, 58) } : prev);
          if (craftingIntervalRef.current) {
            clearInterval(craftingIntervalRef.current);
            craftingIntervalRef.current = null;
          }
          if (craftingFinalizeTimeoutRef.current) {
            clearTimeout(craftingFinalizeTimeoutRef.current);
          }
          // Quick handoff: rAF-chain so the plan paints before crafting tears down.
          craftingFinalizeTimeoutRef.current = setTimeout(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                pendingCraftSeedRef.current = "";
                setCraftingActive(false);
                setCraftingPlan(null);
                setCraftingOriginCity("");
                craftingFinalizeTimeoutRef.current = null;
              });
            });
          }, 200);
        }
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
      if (craftingFinalizeTimeoutRef.current) {
        clearTimeout(craftingFinalizeTimeoutRef.current);
        craftingFinalizeTimeoutRef.current = null;
      }
    };
  }, []);

  const isCraftingPlan = craftingActive;
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [searchParams] = useSearchParams();
  const initialQuerySent = useRef(false);

  // Activities being streamed for the current crafting message — fed to PlanCraftingMap.
  const craftingActivities = useMemo<CraftActivity[]>(() => {
    if (!craftingActive) return [];
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return [];
    const c = last.content;
    const names: string[] = [];
    const seen = new Set<string>();

    // Extract from ```activities blocks
    const actBlocks = c.match(/```activities\s*([\s\S]*?)(```|$)/g) || [];
    for (const block of actBlocks) {
      const inner = block.replace(/```activities\s*/, "").replace(/```$/, "");
      const matches = inner.match(/"name"\s*:\s*"([^"]+)"/g) || [];
      for (const m of matches) {
        const n = m.replace(/"name"\s*:\s*"/, "").replace(/"$/, "").trim();
        if (n && !seen.has(n.toLowerCase())) {
          seen.add(n.toLowerCase());
          names.push(n);
        }
      }
    }
    // Extract from ```itinerary blocks (venues)
    const itinBlocks = c.match(/```itinerary\s*([\s\S]*?)(```|$)/g) || [];
    for (const block of itinBlocks) {
      const inner = block.replace(/```itinerary\s*/, "").replace(/```$/, "");
      const matches = inner.match(/"venue"\s*:\s*"([^"]+)"/g) || [];
      for (const m of matches) {
        const n = m.replace(/"venue"\s*:\s*"/, "").replace(/"$/, "").trim();
        if (n && !seen.has(n.toLowerCase())) {
          seen.add(n.toLowerCase());
          names.push(n);
        }
      }
    }

    const dest = craftingPlan?.destination || "";
    const enrich = dest ? enrichedData[dest] : null;
    const photoFor = (name: string): string | undefined => {
      if (!enrich) return undefined;
      const lower = name.toLowerCase();
      // 1) activityPhotos is keyed by activity name from enrich-destination
      const ap = enrich?.activityPhotos || {};
      const direct = ap[name] || ap[lower];
      if (direct?.thumbPhoto || direct?.photo) return direct.thumbPhoto || direct.photo;
      for (const [k, v] of Object.entries(ap)) {
        const kl = k.toLowerCase();
        if (kl === lower || kl.includes(lower) || lower.includes(kl)) {
          const photo = (v as any)?.thumbPhoto || (v as any)?.photo;
          if (photo) return photo;
        }
      }
      // 2) Legacy places array fallback
      const place =
        enrich?.places?.find?.((p: any) => p?.name?.toLowerCase() === lower) ||
        enrich?.places?.find?.((p: any) => p?.name?.toLowerCase()?.includes(lower)) ||
        null;
      return place?.photo || place?.image || place?.thumbUrl || undefined;
    };

    const parsedNames = names.slice(0, 5).map((n) => ({ name: n, photo: photoFor(n) }));
    const placeholderCount = craftingPlan?.progress ? Math.min(5, Math.max(0, Math.ceil((craftingPlan.progress - 24) / 14))) : 0;
    const targetCount = Math.max(parsedNames.length, placeholderCount);

    return Array.from({ length: targetCount }, (_, index) => {
      const existing = parsedNames[index];
      if (existing) return existing;
      return { name: `Planned stop ${index + 1}` };
    });
  }, [craftingActive, messages, enrichedData, craftingPlan?.destination, craftingPlan?.progress]);

  // Destination photo for the crafting map (uses cached city image if present)
  const craftingDestinationPhoto = useMemo<string | undefined>(() => {
    const dest = craftingPlan?.destination || "";
    if (!dest) return undefined;
    const enrich = enrichedData[dest];
    return (
      enrich?.images?.[0]?.thumbUrl ||
      enrich?.images?.[0]?.url ||
      undefined
    );
  }, [craftingPlan?.destination, enrichedData]);

  const craftingDestinationGeo = useMemo<{ lat: number; lng: number } | undefined>(() => {
    const dest = craftingPlan?.destination || "";
    if (!dest) return undefined;
    const geo = enrichedData[dest]?.geo;
    if (typeof geo?.lat === "number" && typeof geo?.lng === "number") {
      return { lat: geo.lat, lng: geo.lng };
    }
    return undefined;
  }, [craftingPlan?.destination, enrichedData]);

  const shouldShowCraftingMap = isCraftingPlan && !!craftingPlan;

  // When the crafting map first appears, gently scroll it into view so the
  // user actually sees the animation instead of a static prompt above the fold.
  const craftingScrollFiredRef = useRef(false);
  useEffect(() => {
    if (shouldShowCraftingMap && !craftingScrollFiredRef.current) {
      craftingScrollFiredRef.current = true;
      requestAnimationFrame(() => {
        try {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        } catch {}
      });
    }
    if (!shouldShowCraftingMap) {
      craftingScrollFiredRef.current = false;
    }
  }, [shouldShowCraftingMap]);

  // Eager enrichment during crafting so the map shows real photos in real time.
  // Fires whenever we have a destination + at least one activity name and we haven't
  // already enriched this destination. Premium-only (matches main enrichment policy).
  const eagerEnrichRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!craftingActive) return;
    const dest = craftingPlan?.destination || "";
    if (!dest) return;
    const names = craftingActivities.map((a) => a.name).filter(Boolean);
    // Re-fire when the set of names grows (signature changes)
    const sig = `${dest}|${isPremium ? "full" : "imageOnly"}|${[...names].sort().join("|")}`;
    if (eagerEnrichRef.current.has(sig)) return;
    eagerEnrichRef.current.add(sig);
    fetchEnrichment(dest, undefined, names.length > 0 ? names : undefined, !isPremium).then((data) => {
      if (data) {
        warmEnrichmentAssets(data);
        setEnrichedData((prev) => ({ ...prev, [dest]: mergeEnrichmentData(prev[dest], data) }));
        if (data.images && data.images.length > 0) {
          setWikimediaImage(dest, data.images[0].thumbUrl || data.images[0].url);
        }
      }
    });
  }, [craftingActive, isPremium, craftingPlan?.destination, craftingActivities]);

  // Memoize parsed messages to avoid re-parsing on every render
  const parsedMessages = useMemo(() => {
    return messages.map((msg) => {
      try {
        return {
          ...msg,
          parsed: msg.role === "assistant"
            ? parseMessageContent(msg.content || "")
            : { text: msg.content || "", flights: [], activities: [], hotels: [], itinerary: [], timeline: [], travelInfo: null, weather: null, quickReplies: [], destinationEnrich: null, placeImages: [], places: [] },
        };
      } catch (e) {
        console.error("parseMessageContent crashed:", e);
        return {
          ...msg,
          parsed: { text: msg.content || "", flights: [], activities: [], hotels: [], itinerary: [], timeline: [], travelInfo: null, weather: null, quickReplies: [], destinationEnrich: null, placeImages: [], places: [] },
        };
      }
    });
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
      if (craftingFinalizeTimeoutRef.current) {
        clearTimeout(craftingFinalizeTimeoutRef.current);
        craftingFinalizeTimeoutRef.current = null;
      }
      craftingProgressRef.current = 0;
      streamingDoneRef.current = false;
      lastCraftedMsgIndex.current = -1;
    }
  }, [activeId]);

  // Detect when a full plan has been generated for free users.
  // PAYWALL DISABLED FOR NOW — all users see all plans.
  // Will re-implement with a better UX later.
  const [planCount, setPlanCount] = useState(0);
  useEffect(() => {
    if (isPremium || isLoading || shouldShowCraftingMap) return;
    let count = 0;
    parsedMessages.forEach((msg) => {
      if (msg.role !== "assistant") return;
      const p = msg.parsed;
      let blockTypes = 0;
      if (p.flights.length > 0) blockTypes++;
      if (p.hotels.length > 0) blockTypes++;
      if (p.activities.length > 0) blockTypes++;
      if (p.itinerary.length > 0) blockTypes++;
      if (blockTypes >= 2) count++;
    });
    setPlanCount(count);
    // Paywall disabled — never gate
    setPlanGenerated(false);
  }, [parsedMessages, isLoading, isPremium, shouldShowCraftingMap]);

  // Auto-enrich destinations when streaming is done
  // Premium: full enrichment. Free: imageOnly (1 Google photo for the paywall card)
  useEffect(() => {
    if (isLoading) return;
    parsedMessages.forEach((msg) => {
      if (msg.role !== "assistant") return;
      if (msg.parsed.destinationEnrich && !enrichedData[msg.parsed.destinationEnrich.destination]) {
        const { destination, travelMonth } = msg.parsed.destinationEnrich;
        if (isPremium) {
          // Include BOTH activity names AND itinerary slot venues so every
          // stop in the plan gets a chance to resolve to a real Google Places
          // photo. Without this, a short trip where day 2 has slots that
          // aren't also in the activities block ends up with no photos.
          const activityNames = msg.parsed.activities.map((a: any) => a.name).filter(Boolean);
          const slotVenues = msg.parsed.itinerary.flatMap((d: any) =>
            Array.isArray(d?.slots) ? d.slots.map((s: any) => s?.venue).filter(Boolean) : [],
          );
          const uniqueNames = Array.from(new Set([...activityNames, ...slotVenues]));
          const hotelNamesList = msg.parsed.hotels.map((h: any) => h.name).filter(Boolean);
          fetchEnrichment(destination, travelMonth, uniqueNames, false, hotelNamesList).then((data) => {
            if (data) {
              warmEnrichmentAssets(data);
              setEnrichedData((prev) => ({ ...prev, [destination]: mergeEnrichmentData(prev[destination], data) }));
              if (data.images && data.images.length > 0) {
                setWikimediaImage(destination, data.images[0].thumbUrl || data.images[0].url);
              }
            }
          });
        } else {
          // Free users: just fetch 1 real Google image for the paywall card
          fetchEnrichment(destination, undefined, undefined, true).then((data) => {
            if (data) {
              warmEnrichmentAssets(data);
              setEnrichedData((prev) => ({ ...prev, [destination]: mergeEnrichmentData(prev[destination], data) }));
            }
          });
        }
      }
    });
  }, [parsedMessages, isLoading, isPremium]);

  // Auto-send query from URL params. If the user typed on the homepage
  // search box and landed here with ?q=..., always start a fresh chat so
  // they don't see a stale conversation from localStorage.
  const forceNewChatRef = useRef(false);
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !initialQuerySent.current) {
      initialQuerySent.current = true;
      // Always clear existing chat first so the user gets a fresh slate.
      clearChat();
      // Mark that we need to send after the clear takes effect.
      forceNewChatRef.current = true;
    }
  }, [searchParams, clearChat]);

  // Once clearChat has flushed (messages becomes empty), fire the query.
  useEffect(() => {
    if (forceNewChatRef.current && messages.length === 0) {
      forceNewChatRef.current = false;
      const q = searchParams.get("q");
      if (q) sendMessage(q);
    }
  }, [messages.length, searchParams, sendMessage]);

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
      <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} fixed md:relative md:translate-x-0 z-40 w-72 h-full bg-[hsl(0_0%_98%)] border-r border-border flex flex-col transition-transform duration-200`}>
        {/* Sidebar header with logo */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo size="sm" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden h-8 w-8"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>

        {/* New chat button */}
        <div className="p-3">
          <Button
            onClick={clearChat}
            className="w-full justify-start gap-2 h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-sm"
          >
            <Plus className="h-4 w-4" /> New trip
          </Button>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground px-2 mb-2 mt-1">
            Recent trips
          </p>
          {conversations.length === 0 ? (
            <div className="px-2 py-6 text-center">
              <p className="text-xs text-muted-foreground">
                Your trips will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {conversations.map(c => (
                <div
                  key={c.id}
                  className={`group flex items-center gap-1 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                    c.id === activeId
                      ? "bg-white border border-border text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-white hover:text-foreground"
                  }`}
                  onClick={() => switchChat(c.id)}
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  <span className="flex-1 truncate">{c.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); deleteChat(c.id); }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-border space-y-1">
          {user ? (
            <>
              <Link
                to="/my-trips"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-white hover:text-foreground transition-colors"
              >
                <User className="h-4 w-4" /> My Trips
              </Link>
              <Link
                to="/settings"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-white hover:text-foreground transition-colors"
              >
                <Settings className="h-4 w-4" /> Settings
              </Link>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-white hover:text-foreground transition-colors"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-white hover:text-foreground transition-colors"
            >
              <User className="h-4 w-4" /> Sign in
            </Link>
          )}
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <main className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-white/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 md:hidden">
              <Logo size="sm" variant="mark-only" />
              <span className="font-bold text-base">Jolliday</span>
            </div>
            {hasMessages && (
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-foreground">
                  {conversations.find(c => c.id === activeId)?.title || "New trip"}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            {compareItems.length > 0 && (
              <Button variant="ghost" size="icon" onClick={() => setCompareOpen(true)} className="h-9 w-9 relative">
                <GitCompare className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                  {compareItems.length}
                </span>
              </Button>
            )}
            {hasMessages && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9" title="Trip actions">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleSaveTrip}>
                    <Save className="h-4 w-4 mr-2" /> Save trip
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <Download className="h-4 w-4 mr-2" /> Export PDF
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" /> Share
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-8">
            {!hasMessages ? (
              <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
                {/* Big logo */}
                <div className="mb-6">
                  <Logo size="xl" variant="mark-only" />
                </div>

                {/* Greeting */}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground text-center mb-3">
                  {preferences.displayName
                    ? `Hey ${preferences.displayName},`
                    : "Where to next?"}
                </h1>
                <p className="text-base md:text-lg text-muted-foreground text-center mb-10 max-w-lg">
                  {preferences.displayName
                    ? "Where are we going today? Tell me about your dream trip."
                    : "I'm Jolliday, your AI travel planner. Tell me about the trip you want."}
                </p>

                {/* Quick start categories */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 w-full max-w-2xl mb-8">
                  {[
                    { icon: Plane, label: "Weekend trip", q: "Plan a quick weekend getaway" },
                    { icon: Mountain, label: "Adventure", q: "Plan an adventure trip" },
                    { icon: Utensils, label: "Food & culture", q: "Plan a food & culture trip" },
                    { icon: Users, label: "Family", q: "Plan a family vacation" },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.label}
                        onClick={() => sendMessage(cat.q)}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border bg-white hover:border-primary/30 hover:bg-primary/[0.02] hover:-translate-y-0.5 transition-all duration-200 group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all">
                          <Icon className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-foreground">
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Smart suggestions */}
                <div className="w-full max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3 text-center">
                    Or try one of these
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="px-4 py-2 text-sm rounded-full border border-border bg-white text-muted-foreground hover:border-primary/30 hover:text-primary hover:bg-primary/5 active:scale-95 transition-all duration-200"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {parsedMessages.map((msg, i) => {
                  // Hide the streaming assistant message while the plane map is
                  // showing. This prevents flights/hotels/activities cards from
                  // flashing through during the crafting animation.
                  const isLastMsg = i === parsedMessages.length - 1;
                  if (shouldShowCraftingMap && isLastMsg && msg.role === "assistant") return null;

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

                  // Determine if this is a "full trip plan" (has multiple card types)
                  const cardTypeCount = [parsed.flights.length > 0, parsed.hotels.length > 0, parsed.activities.length > 0, parsed.itinerary.length > 0].filter(Boolean).length;
                  // Treat as a "plan" when we have an itinerary OR multiple card types — local plans (activities + itinerary, no flights/hotels) count too.
                  const isFullPlan = cardTypeCount >= 2 || parsed.itinerary.length > 0;

                  const isLastAssistant = msg.role === "assistant" && i === parsedMessages.length - 1;
                  // Hide all inline cards while the plane map is active OR while
                  // the AI is still streaming and we haven't detected a full plan
                  // yet (prevents partial cards from flashing before the summary
                  // card takes over).
                  const hideLatestResponse = isLastAssistant && (shouldShowCraftingMap || (isLoading && !isFullPlan && cardTypeCount >= 1));
                  // Resolve a CITY-level destination — prefer user prompt + destination_enrich
                  // over neighborhood-scoped fallbacks (activities[0].neighborhood was often
                  // a district like "Jordaan" instead of "Amsterdam", which broke city hero
                  // image lookup and share cards).
                  const lastUserMsg = [...parsedMessages].reverse().find((m) => m.role === "user");
                  const promptDest = lastUserMsg ? inferCitiesFromPrompt(lastUserMsg.content || "").destination : "";
                  const destination = parsed.travelInfo?.destination
                    || (parsed as any).destinationEnrich?.destination
                    || craftingPlan?.destination
                    || promptDest
                    || parsed.hotels[0]?.location?.split(",")[0]
                    || parsed.flights[0]?.cityImage
                    || parsed.activities[0]?.neighborhood
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
                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm" style={{ background: "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))" }}>
                            <LogoMark size={16} color="white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            {parsed.text && !hideLatestResponse && (
                              <div className={isLastAssistant && isLoading ? "streaming-spotlight" : ""}>
                                <StreamingText
                                  text={parsed.text}
                                  isStreaming={isLastAssistant && isLoading}
                                />
                              </div>
                            )}


                            {/* Full plan → show summary card; otherwise show inline cards */}
                            {/* Hide plan cards while crafting animation is still running */}
                            {isFullPlan && destination && !hideLatestResponse ? (
                                <TripSummaryCard
                                  data={parsed as TripPlanData}
                                  destination={destination}
                                  enrichedImages={enrichData?.images}
                                  itineraryVenuePhotos={enrichData?.activityPhotos}
                                  origin={
                                    promptDest && lastUserMsg
                                      ? inferCitiesFromPrompt(lastUserMsg.content || "").origin || originCity || undefined
                                      : originCity || undefined
                                  }
                                />
                            ) : !hideLatestResponse && (
                              <>
                                {/* Show all card blocks — paywall disabled */}
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

                            {isLastAssistant && !isLoading && parsed.quickReplies.length > 0 && (
                              <QuickReplies replies={parsed.quickReplies} onSelect={(reply) => {
                                sendMessage(reply);
                              }} />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Plane map — shows only when crafting is active */}
                {shouldShowCraftingMap && craftingPlan && (
                  <PlanCraftingMap
                    originCity={craftingOriginCity || originCity}
                    destinationCity={craftingPlan.destination || "your destination"}
                    activities={craftingActivities}
                    destinationPhoto={craftingDestinationPhoto}
                    destinationGeo={craftingDestinationGeo}
                    progress={craftingPlan.progress}
                  />
                )}

                {/* Simple typing dots when loading but crafting hasn't started */}
                {isLoading && !shouldShowCraftingMap && !hasStreamedContent && (
                  <div className="flex items-center gap-1.5 px-2 py-3">
                    <span className="w-2 h-2 rounded-full bg-primary/60 typing-dot" />
                    <span className="w-2 h-2 rounded-full bg-primary/60 typing-dot" />
                    <span className="w-2 h-2 rounded-full bg-primary/60 typing-dot" />
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

        <div className="px-4 pt-2 pb-4 bg-gradient-to-t from-white via-white to-transparent">
          <div className="max-w-3xl mx-auto">
            {planGenerated && !isPremium && !subLoading ? (
              <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-5 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-primary/20 mb-3">
                  <Crown className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">
                    Plan ready
                  </span>
                </div>
                <p className="text-base font-bold text-foreground mb-1">
                  Your trip is ready to unlock
                </p>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                  Start your 3-day free trial to view the full plan and keep chatting
                </p>
                <Button
                  onClick={() => setShowPaywall(true)}
                  size="lg"
                  className="gap-2 h-12 px-6 rounded-full font-semibold shadow-lg shadow-primary/20"
                  style={{ background: "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))" }}
                >
                  <Crown className="h-4 w-4" />
                  Start Free Trial
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  3 days free · Cancel anytime
                </p>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit}>
                  <div className="relative rounded-3xl border-2 border-border bg-white shadow-[0_4px_24px_-4px_rgba(45,66,179,0.08)] hover:border-primary/30 focus-within:border-primary focus-within:shadow-[0_8px_32px_-8px_rgba(45,66,179,0.2)] transition-all duration-200">
                    <textarea
                      ref={textareaRef}
                      placeholder="Message Jolliday..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isLoading}
                      rows={1}
                      className="w-full bg-transparent px-5 pt-4 pb-2 text-base text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none min-h-[56px] max-h-[200px] leading-relaxed"
                    />
                    <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-1">
                      <div className="flex items-center gap-1">
                        <VoiceInput onTranscript={(t) => setInput(prev => prev ? prev + " " + t : t)} disabled={isLoading} />
                      </div>
                      <Button
                        type="submit"
                        size="icon"
                        disabled={!input.trim() || isLoading}
                        className="h-10 w-10 rounded-xl shrink-0 shadow-md disabled:opacity-40 disabled:shadow-none"
                        style={input.trim() && !isLoading ? { background: "linear-gradient(135deg, hsl(234 62% 52%), hsl(234 62% 42%))" } : undefined}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </form>
                <p className="text-[11px] text-muted-foreground text-center mt-2.5">
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
