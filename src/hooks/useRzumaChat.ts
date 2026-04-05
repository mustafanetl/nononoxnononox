import { useState, useCallback, useEffect, useRef } from "react";

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
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rzuma-chat`;
const STORAGE_KEY = "jolliday-conversations";
const PREFS_KEY = "jolliday-preferences";

const generateId = () => crypto.randomUUID?.() || Math.random().toString(36).slice(2);

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
    return raw ? JSON.parse(raw) : { visitedPlaces: [], likedCategories: [], dislikedCategories: [] };
  } catch { return { visitedPlaces: [], likedCategories: [], dislikedCategories: [] }; }
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
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(loadPreferences);
  const convosRef = useRef(conversations);
  convosRef.current = conversations;

  useEffect(() => { saveConversations(conversations); }, [conversations]);
  useEffect(() => { savePreferences(preferences); }, [preferences]);

  const activeConvo = conversations.find(c => c.id === activeId);
  const messages = activeConvo?.messages || [];

  const updatePreferences = useCallback((updater: (prev: UserPreferences) => UserPreferences) => {
    setPreferences(prev => {
      const next = updater(prev);
      return next;
    });
  }, []);

  const newChat = useCallback(() => {
    const id = generateId();
    const convo: Conversation = { id, title: "New chat", messages: [], updatedAt: Date.now() };
    setConversations(prev => [convo, ...prev]);
    setActiveId(id);
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
      const currentMessages = [...(convosRef.current.find(c => c.id === currentId)?.messages || []), userMsg]
        .filter(m => m.role === "user" || m.role === "assistant");

      // Build preferences context
      const prefsContext = preferences.visitedPlaces.length > 0 || preferences.likedCategories.length > 0 || preferences.dislikedCategories.length > 0
        ? preferences : undefined;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: currentMessages, preferences: prefsContext }),
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
            if (content) updateAssistant(content);
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
            if (content) updateAssistant(content);
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      console.error("Chat error:", e);
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setIsLoading(false);
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
    exportLocalData,
  };
};
