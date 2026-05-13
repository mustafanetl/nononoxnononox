import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAuthHeader } from "@/lib/authFetch";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
};

export type UserPreferences = {
  visitedPlaces: { name: string; rating: string; category: string }[];
  likedCategories: string[];
  dislikedCategories: string[];
  homeCity: string;
  travelStyle: string;
  dietaryRestrictions: string[];
  pastTrips: string[];
  displayName: string;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rzuma-chat`;
const REVIEW_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/review-trip-plan`;

export type QaStatus = null | "verifying";

const hasStructuredPlan = (text: string): boolean => {
  return /```(activities|itinerary|hotels|flights)\b/.test(text);
};

const extractDestinationHint = (text: string): string => {
  const m = text.match(/```destination_enrich\s*([\s\S]*?)```/) || text.match(/```travelinfo\s*([\s\S]*?)```/);
  if (!m) return "";
  try {
    const j = JSON.parse(m[1].trim());
    return j.destination || "";
  } catch { return ""; }
};
const STORAGE_KEY = "jolliday-conversations";
const PREFS_KEY = "jolliday-preferences";

const generateId = () => crypto.randomUUID?.() || Math.random().toString(36).slice(2);

const defaultPrefs = (): UserPreferences => ({
  visitedPlaces: [],
  likedCategories: [],
  dislikedCategories: [],
  homeCity: "",
  travelStyle: "",
  dietaryRestrictions: [],
  pastTrips: [],
  displayName: "",
});

const loadConversations = (): Conversation[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveConversations = (convos: Conversation[]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(convos)); } catch { /* quota */ }
};

const loadPreferences = (): UserPreferences => {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return { ...defaultPrefs(), ...parsed };
  } catch { return defaultPrefs(); }
};

const savePreferences = (prefs: UserPreferences) => {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* quota */ }
};

const titleFromMessage = (msg: string) => msg.slice(0, 40) + (msg.length > 40 ? "…" : "");

export const useRzumaChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeId, setActiveId] = useState<string | null>(() => {
    const convos = loadConversations();
    return convos.length > 0 ? convos[0].id : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [qaStatus, setQaStatus] = useState<QaStatus>(null);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(loadPreferences);
  const convosRef = useRef(conversations);
  convosRef.current = conversations;
  const dbSyncedRef = useRef(false);

  useEffect(() => { saveConversations(conversations); }, [conversations]);
  useEffect(() => { savePreferences(preferences); }, [preferences]);

  // Listen for preference changes from Settings page
  useEffect(() => {
    const handler = () => {
      setPreferences(loadPreferences());
    };
    window.addEventListener("jolliday-preferences-updated", handler);
    return () => window.removeEventListener("jolliday-preferences-updated", handler);
  }, []);

  // Load preferences from DB on mount (if user is logged in)
  useEffect(() => {
    if (dbSyncedRef.current) return;
    const loadFromDb = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      dbSyncedRef.current = true;

      // Load profile display name
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", session.user.id)
        .maybeSingle();

      // Load user preferences from DB
      const { data: dbPrefs } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (dbPrefs || profile) {
        setPreferences((prev) => {
          const merged: UserPreferences = { ...prev };
          if (profile?.display_name) merged.displayName = profile.display_name;
          if (dbPrefs) {
            merged.homeCity = (dbPrefs as any).home_city || prev.homeCity || "";
            merged.travelStyle = (dbPrefs as any).travel_style || prev.travelStyle || "";
            merged.dietaryRestrictions = (dbPrefs as any).dietary_restrictions || prev.dietaryRestrictions || [];
            merged.pastTrips = (dbPrefs as any).past_trips || prev.pastTrips || [];
            // Merge visited/liked/disliked — DB takes priority if non-empty
            const dbVisited = (dbPrefs.visited_places as any[]) || [];
            const dbLiked = (dbPrefs.liked_categories as string[]) || [];
            const dbDisliked = (dbPrefs.disliked_categories as string[]) || [];
            if (dbVisited.length > 0) merged.visitedPlaces = dbVisited;
            if (dbLiked.length > 0) merged.likedCategories = dbLiked;
            if (dbDisliked.length > 0) merged.dislikedCategories = dbDisliked;
          }
          return merged;
        });
      }
    };
    loadFromDb();
  }, []);

  const activeConvo = conversations.find(c => c.id === activeId);
  const messages = activeConvo?.messages || [];

  const updatePreferences = useCallback((updater: (prev: UserPreferences) => UserPreferences) => {
    setPreferences(prev => updater(prev));
  }, []);

  // Save preferences to DB (debounced via caller)
  const syncPrefsToDb = useCallback(async (prefs: UserPreferences) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data: existing } = await supabase
      .from("user_preferences")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    const payload = {
      user_id: session.user.id,
      home_city: prefs.homeCity || null,
      travel_style: prefs.travelStyle || null,
      dietary_restrictions: prefs.dietaryRestrictions,
      past_trips: prefs.pastTrips,
      display_name: prefs.displayName || null,
      visited_places: prefs.visitedPlaces,
      liked_categories: prefs.likedCategories,
      disliked_categories: prefs.dislikedCategories,
      updated_at: new Date().toISOString(),
    } as any;

    if (existing) {
      await supabase.from("user_preferences").update(payload).eq("user_id", session.user.id);
    } else {
      await supabase.from("user_preferences").insert(payload);
    }
  }, []);

  const newChat = useCallback(() => {
    // Don't create an empty conversation — just reset activeId.
    // sendMessage will create one on the first message.
    setActiveId(null);
    setError(null);
  }, []);

  const switchChat = useCallback((id: string) => {
    setActiveId(id);
    setError(null);
  }, []);

  const deleteChat = useCallback((id: string) => {
    setConversations(prev => {
      const next = prev.filter(c => c.id !== id);
      if (id === activeId) {
        setActiveId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
  }, [activeId]);

  const sendMessage = useCallback(async (input: string) => {
    let currentId = activeId;

    if (!currentId) {
      const id = generateId();
      const convo: Conversation = { id, title: titleFromMessage(input), messages: [], updatedAt: Date.now() };
      setConversations(prev => [convo, ...prev]);
      setActiveId(id);
      currentId = id;
    }

    const userMsg: Message = { role: "user", content: input };

    setConversations(prev => prev.map(c => {
      if (c.id !== currentId) return c;
      const isFirst = c.messages.length === 0;
      return {
        ...c,
        title: isFirst ? titleFromMessage(input) : c.title,
        messages: [...c.messages, userMsg],
        updatedAt: Date.now(),
      };
    }));

    setIsLoading(true);
    setError(null);

    let assistantContent = "";

    // rAF-batched conversation update so streaming tokens don't re-render
    // (and re-parse) the whole plan on every delta. The chat edge function
    // can deliver 100+ tiny chunks per second for a 2000-token plan; without
    // this throttle, parseMessageContent runs once per token which is a
    // noticeable frame drop on slower devices.
    let pendingContent: string | null = null;
    let rafId: number | null = null;

    const flushPending = () => {
      rafId = null;
      if (pendingContent === null) return;
      const content = pendingContent;
      pendingContent = null;
      setConversations(prev => prev.map(c => {
        if (c.id !== currentId) return c;
        const msgs = c.messages;
        const last = msgs[msgs.length - 1];
        if (last?.role === "assistant") {
          return { ...c, messages: msgs.map((m, i) => i === msgs.length - 1 ? { ...m, content } : m), updatedAt: Date.now() };
        }
        return { ...c, messages: [...msgs, { role: "assistant", content }], updatedAt: Date.now() };
      }));
    };

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      pendingContent = assistantContent;
      if (rafId === null && typeof requestAnimationFrame === "function") {
        rafId = requestAnimationFrame(flushPending);
      } else if (rafId === null) {
        // SSR / test environment fallback — flush synchronously.
        flushPending();
      }
    };

    // Ensures the final chunk lands even if the last rAF was scheduled.
    const finalizeStream = () => {
      if (rafId !== null && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(rafId);
      }
      rafId = null;
      flushPending();
    };

    try {
      const baseMessages = [...(convosRef.current.find(c => c.id === currentId)?.messages || []), userMsg]
        .filter(m => m.role === "user" || m.role === "assistant");

      // Build full preferences context for the AI
      const prefsContext = {
        displayName: preferences.displayName || undefined,
        homeCity: preferences.homeCity || undefined,
        travelStyle: preferences.travelStyle || undefined,
        dietaryRestrictions: preferences.dietaryRestrictions?.length > 0 ? preferences.dietaryRestrictions : undefined,
        pastTrips: preferences.pastTrips?.length > 0 ? preferences.pastTrips : undefined,
        visitedPlaces: preferences.visitedPlaces?.length > 0 ? preferences.visitedPlaces : undefined,
        likedCategories: preferences.likedCategories?.length > 0 ? preferences.likedCategories : undefined,
        dislikedCategories: preferences.dislikedCategories?.length > 0 ? preferences.dislikedCategories : undefined,
      };
      const hasPrefs = Object.values(prefsContext).some(v => v !== undefined);

      // Build preferences payload. We deliberately do NOT include isPremium
      // from the client — the edge function resolves premium server-side via
      // the JWT in resolveAuth(). Trusting a client flag would be a security
      // hole. Client still reads sub state for UI (paywall gating) elsewhere.
      const fullPrefs = hasPrefs ? prefsContext : undefined;

      // Stream the AI response. Returns the full text streamed.
      const runStream = async (): Promise<string> => {
        const authHeader = await getAuthHeader();
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({ messages: baseMessages, preferences: fullPrefs }),
        });
        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to get response");
        }
        if (!resp.body) throw new Error("No response body");

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";
        let streamDone = false;
        let collected = "";

        const handleContent = (chunk: string) => {
          collected += chunk;
          updateAssistant(chunk);
        };

        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") { streamDone = true; break; }
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) handleContent(content);
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        if (textBuffer.trim()) {
          for (let raw of textBuffer.split("\n")) {
            if (!raw) continue;
            if (raw.endsWith("\r")) raw = raw.slice(0, -1);
            if (raw.startsWith(":") || raw.trim() === "") continue;
            if (!raw.startsWith("data: ")) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) handleContent(content);
            } catch { /* ignore */ }
          }
        }

        // Flush any pending rAF update so the final content is committed
        // before downstream QA logic reads `collected`.
        finalizeStream();
        return collected;
      };

      // === First pass (AI1) ===
      let planText = await runStream();

      // === QA review — verify and enrich with Google Places data ===
      // Single pass only: if approved, swap in enriched coords/names.
      // No revision loops — they caused flickering and broken state.
      if (hasStructuredPlan(planText)) {
        try {
          setQaStatus("verifying");
          const reviewAuth = await getAuthHeader();
          const reviewResp = await fetch(REVIEW_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: reviewAuth,
            },
            body: JSON.stringify({
              planText,
              destinationHint: extractDestinationHint(planText),
            }),
          });
          if (reviewResp.ok) {
            const review = await reviewResp.json();
            // Only swap in the enriched plan if it was approved (has verified coords)
            if (review.approved && review.enrichedPlan && review.enrichedPlan !== planText) {
              assistantContent = review.enrichedPlan;
              const finalContent = review.enrichedPlan;
              setConversations(prev => prev.map(c => {
                if (c.id !== currentId) return c;
                const msgs = c.messages;
                const last = msgs[msgs.length - 1];
                if (last?.role === "assistant") {
                  return { ...c, messages: msgs.map((m, i) => i === msgs.length - 1 ? { ...m, content: finalContent } : m), updatedAt: Date.now() };
                }
                return c;
              }));
            }
          }
        } catch (err) {
          console.warn("Reviewer failed, fail-open:", err);
        }
        setQaStatus(null);
      }
    } catch (e) {
      console.error("Chat error:", e);
      // Don't show error to user if we already have a valid plan displayed
      if (!assistantContent || !hasStructuredPlan(assistantContent)) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    } finally {
      // Guarantee: no leaked rAF, no stuck QA spinner, no stuck loader —
      // even if the stream aborts mid-revision.
      try {
        if (rafId !== null && typeof cancelAnimationFrame === "function") {
          cancelAnimationFrame(rafId);
        }
        flushPending();
      } catch { /* best-effort */ }
      setIsLoading(false);
      setQaStatus(null);
    }
  }, [activeId, preferences]);

  const clearChat = useCallback(() => {
    newChat();
  }, [newChat]);

  const openSavedTrip = useCallback((title: string, savedMessages: Message[]) => {
    const id = generateId();
    const convo: Conversation = { id, title, messages: savedMessages, updatedAt: Date.now() };
    setConversations(prev => [convo, ...prev]);
    setActiveId(id);
    setError(null);
  }, []);

  const exportLocalData = useCallback(() => {
    return { conversations, preferences };
  }, [conversations, preferences]);

  // Replace an activity inside a specific assistant message's `activities` JSON block.
  // Used by the "Find alternatives" / swap feature.
  const replaceActivity = useCallback((messageIndex: number, oldActivityId: string, newActivity: any) => {
    setConversations(prev => prev.map(c => {
      if (c.id !== activeId) return c;
      const msgs = c.messages;
      if (messageIndex < 0 || messageIndex >= msgs.length) return c;
      const target = msgs[messageIndex];
      if (!target || target.role !== "assistant") return c;

      const blockRegex = /```activities\s*([\s\S]*?)```/;
      const match = target.content.match(blockRegex);
      if (!match) return c;
      let arr: any[] = [];
      try { arr = JSON.parse(match[1].trim()); } catch { return c; }
      if (!Array.isArray(arr)) return c;

      const idx = arr.findIndex((a) => a?.id === oldActivityId);
      if (idx === -1) return c;
      // Preserve the old id so downstream references (trip context, etc.) stay stable
      arr[idx] = { ...newActivity, id: oldActivityId };
      const newBlock = "```activities\n" + JSON.stringify(arr) + "\n```";
      const newContent = target.content.replace(blockRegex, newBlock);

      return {
        ...c,
        messages: msgs.map((m, i) => i === messageIndex ? { ...m, content: newContent } : m),
        updatedAt: Date.now(),
      };
    }));
  }, [activeId]);

  // Replace a single slot inside a specific day of a message's `itinerary` JSON block.
  // Used by the swap feature on day-by-day itinerary cards.
  const replaceItinerarySlot = useCallback((messageIndex: number, dayNumber: number, slotIndex: number, newActivity: any) => {
    setConversations(prev => prev.map(c => {
      if (c.id !== activeId) return c;
      const msgs = c.messages;
      if (messageIndex < 0 || messageIndex >= msgs.length) return c;
      const target = msgs[messageIndex];
      if (!target || target.role !== "assistant") return c;

      const blockRegex = /```itinerary\s*([\s\S]*?)```/;
      const match = target.content.match(blockRegex);
      if (!match) return c;
      let arr: any[] = [];
      try { arr = JSON.parse(match[1].trim()); } catch { return c; }
      if (!Array.isArray(arr)) return c;

      const dayIdx = arr.findIndex((d) => d?.day === dayNumber);
      if (dayIdx === -1) return c;
      const day = arr[dayIdx];
      if (!day?.slots || !Array.isArray(day.slots) || slotIndex < 0 || slotIndex >= day.slots.length) return c;

      const oldSlot = day.slots[slotIndex];
      day.slots[slotIndex] = {
        ...oldSlot,
        venue: newActivity.name || oldSlot.venue,
        activity: newActivity.category || oldSlot.activity,
        neighborhood: newActivity.neighborhood || oldSlot.neighborhood,
        duration: newActivity.duration || oldSlot.duration,
        cost: typeof newActivity.price === "number" ? newActivity.price : oldSlot.cost,
        bookAhead: typeof newActivity.bookAhead === "boolean" ? newActivity.bookAhead : oldSlot.bookAhead,
      };
      arr[dayIdx] = day;

      const newBlock = "```itinerary\n" + JSON.stringify(arr) + "\n```";
      const newContent = target.content.replace(blockRegex, newBlock);

      return {
        ...c,
        messages: msgs.map((m, i) => i === messageIndex ? { ...m, content: newContent } : m),
        updatedAt: Date.now(),
      };
    }));
  }, [activeId]);

  return {
    messages,
    isLoading,
    qaStatus,
    error,
    sendMessage,
    clearChat,
    conversations,
    activeId,
    newChat,
    switchChat,
    deleteChat,
    openSavedTrip,
    preferences,
    updatePreferences,
    syncPrefsToDb,
    exportLocalData,
    replaceActivity,
    replaceItinerarySlot,
  };
};
