import { useMemo } from "react";
import ReactMarkdown from "react-markdown";

/**
 * Renders streaming AI text with a per-word fade-up reveal.
 * Only the most recently appended words animate — earlier text stays static
 * so the page never re-animates from scratch on every token.
 */
const StreamingText: React.FC<{ text: string; isStreaming: boolean }> = ({ text, isStreaming }) => {
  // When streaming, split into words and animate the last ~14 words.
  const tokens = useMemo(() => {
    if (!isStreaming) return null;
    const parts = text.split(/(\s+)/); // keep whitespace
    const wordIdxs: number[] = [];
    parts.forEach((p, i) => { if (!/^\s+$/.test(p) && p.length > 0) wordIdxs.push(i); });
    const animateFromIdx = Math.max(0, wordIdxs.length - 14);
    const cutoff = wordIdxs[animateFromIdx] ?? 0;
    return { parts, cutoff };
  }, [text, isStreaming]);

  if (!isStreaming || !tokens) {
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
      {tokens.parts.map((p, i) => {
        if (/^\s+$/.test(p)) return <span key={i}>{p}</span>;
        if (i < tokens.cutoff) return <span key={i}>{p}</span>;
        // Stagger the new words slightly
        const delay = (i - tokens.cutoff) * 0.018;
        return (
          <span key={i} className="word-rise" style={{ animationDelay: `${delay}s` }}>
            {p}
          </span>
        );
      })}
    </div>
  );
};

export default StreamingText;
