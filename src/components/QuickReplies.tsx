const QuickReplies = ({ replies, onSelect }: { replies: string[]; onSelect: (reply: string) => void }) => {
  if (!replies.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {replies.map((reply, i) => (
        <button
          key={i}
          onClick={() => onSelect(reply)}
          className="px-3 py-1.5 text-xs font-medium border border-border rounded-full bg-card hover:bg-muted transition-colors"
        >
          {reply}
        </button>
      ))}
    </div>
  );
};

export default QuickReplies;
