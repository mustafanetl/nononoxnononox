import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface HeroSearchProps {
  placeholder?: string;
  size?: "default" | "lg";
  className?: string;
}

const HeroSearch = ({
  placeholder = "Where do you want to go?",
  size = "lg",
  className = "",
}: HeroSearchProps) => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const submit = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed) navigate(`/chat?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(query);
      }}
      className={`flex items-center gap-2 max-w-xl border border-border rounded-full pl-5 pr-2 py-2 bg-background hover:border-foreground/30 focus-within:border-foreground transition-colors ${className}`}
    >
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={`flex-1 bg-transparent py-2 text-base ${size === "lg" ? "md:text-lg" : ""} text-foreground placeholder:text-muted-foreground focus:outline-none`}
      />
      <Button type="submit" size={size} className="rounded-full gap-1">
        Plan
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default HeroSearch;