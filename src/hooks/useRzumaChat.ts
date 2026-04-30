import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export type QaStatus = null | "verifying" | "fixing";
const MAX_REVISIONS = 3;

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

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      const content = assistantContent;
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

      let isPremiumUser = false;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: sub } = await supabase
            .from("subscriptions")
            .select("plan, status, expires_at")
            .eq("user_id", session.user.id)
            .eq("status", "active")
            .maybeSingle();
          if (sub && (!sub.expires_at || new Date(sub.expires_at) > new Date())) {
            isPremiumUser = true;
          }
        }
      } catch { /* ignore */ }

      const fullPrefs = hasPrefs ? { ...prefsContext, isPremium: isPremiumUser } : (isPremiumUser ? { isPremium: true } : undefined);

      // Stream one AI1 response. Returns the full text streamed.
      const runStream = async (revisionRequest?: string[]): Promise<string> => {
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: baseMessages, preferences: fullPrefs, revisionRequest }),
        });
        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to get response");
        }
        if (!resp.body) throw new Error("No response body");

        // On a revision, we are REPLACING the previous assistant message content.
        if (revisionRequest && revisionRequest.length) {
          assistantContent = "";
          setConversations(prev => prev.map(c => {
            if (c.id !== currentId) return c;
            const msgs = c.messages;
            const last = msgs[msgs.length - 1];
            if (last?.role === "assistant") {
              return { ...c, messages: msgs.map((m, i) => i === msgs.length - 1 ? { ...m, content: "" } : m), updatedAt: Date.now() };
            }
            return c;
          }));
        }

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

        return collected;
      };

      // === First pass (AI1) ===
      let planText = await runStream();

      // === QA loop (AI2) — only if AI1 produced a structured plan ===
      if (hasStructuredPlan(planText)) {
        for (let attempt = 0; attempt < MAX_REVISIONS; attempt++) {
          setQaStatus("verifying");
          let review: { approved: boolean; issues?: string[] } = { approved: true };
          try {
            const reviewResp = await fetch(REVIEW_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
              body: JSON.stringify({
                planText,
                destinationHint: extractDestinationHint(planText),
              }),
            });
            if (reviewResp.ok) {
              review = await reviewResp.json();
            }
          } catch (err) {
            console.warn("Reviewer failed, fail-open:", err);
            break;
          }

          if (review.approved || !review.issues || review.issues.length === 0) {
            break;
          }

          // Need a revision
          setQaStatus("fixing");
          try {
            planText = await runStream(review.issues);
          } catch (err) {
            console.warn("Revision stream failed:", err);
            break;
          }
          if (!hasStructuredPlan(planText)) break;
        }
        setQaStatus(null);
      }
    } catch (e) {
      console.error("Chat error:", e);
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
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
  };
};
