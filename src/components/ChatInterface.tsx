import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, RotateCcw, ArrowUp } from "lucide-react";
import { useRzumaChat } from "@/hooks/useRzumaChat";
import heroImage from "@/assets/hero-adventure.jpeg";

const ChatInterface = () => {
  const [input, setInput] = useState("");
  const { messages, isLoading, error, sendMessage, clearChat } = useRzumaChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    "Plan a week in Bali",
    "Desert safari in Dubai",
    "Hidden gems in Japan",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput("");
  };

  const handleSuggestion = (suggestion: string) => {
    if (isLoading) return;
    sendMessage(suggestion);
  };

  const hasMessages = messages.length > 0;

  return (
    <section className="relative min-h-screen pt-24 pb-8 px-4 flex flex-col">
      <div className="container mx-auto flex-1 flex flex-col max-w-3xl">
        {/* Header - only show when no messages */}
        {!hasMessages && (
          <div className="text-center py-12 animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-medium text-primary mb-6">
              <Sparkles className="h-4 w-4" />
              AI Travel Agent
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Where to next?
            </h1>

            <p className="mt-4 text-lg text-muted-foreground max-w-md mx-auto">
              Tell Rzuma your travel dreams and get personalized trip recommendations instantly.
            </p>
          </div>
        )}

        {/* Chat Messages */}
        {hasMessages && (
          <div className="flex-1 overflow-y-auto py-4 space-y-4 mb-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border"
                  }`}
                >
                  <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary typing-dot" />
                    <span className="w-2 h-2 rounded-full bg-primary typing-dot" />
                    <span className="w-2 h-2 rounded-full bg-primary typing-dot" />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
            {error}
          </div>
        )}

        {/* Input Area */}
        <div className={`${hasMessages ? "mt-auto" : "mt-8"}`}>
          <form onSubmit={handleSubmit}>
            <div className="chat-input-box p-2 md:p-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask Rzuma anything about travel..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 bg-transparent px-3 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none text-base"
                />
                <Button
                  type="submit"
                  variant="hero"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className="h-11 w-11 rounded-xl shrink-0"
                >
                  <ArrowUp className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </form>

          {/* Suggestions - only show when no messages */}
          {!hasMessages && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center animate-fade-up animation-delay-200">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestion(suggestion)}
                  className="px-4 py-2 rounded-full bg-secondary/50 border border-border/50 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Clear chat button */}
          {hasMessages && (
            <div className="flex justify-center mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="text-muted-foreground"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                New conversation
              </Button>
            </div>
          )}
        </div>

        {/* Hero Image - below input when no messages */}
        {!hasMessages && (
          <div className="flex justify-center mt-12 animate-fade-up animation-delay-300">
            <div className="relative animate-float-bounce">
              <div className="absolute inset-0 bg-primary/30 rounded-3xl blur-3xl transform scale-90 -z-10" />
              <img
                src={heroImage}
                alt="Desert adventure"
                className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-3xl border border-border/30"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ChatInterface;
