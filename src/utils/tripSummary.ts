type Message = { role: string; content: string };

const extractBlock = (content: string, type: string): any[] => {
  const regex = new RegExp("```" + type + "\\s*([\\s\\S]*?)```", "g");
  const items: any[] = [];
  for (const match of content.matchAll(regex)) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) items.push(...parsed);
    } catch { /* skip */ }
  }
  return items;
};

export const generateTripSummary = (messages: Message[]): string => {
  const allFlights: any[] = [];
  const allActivities: any[] = [];
  const allHotels: any[] = [];
  const allItinerary: any[] = [];

  messages.forEach((m) => {
    if (m.role !== "assistant") return;
    allFlights.push(...extractBlock(m.content, "flights"));
    allActivities.push(...extractBlock(m.content, "activities"));
    allHotels.push(...extractBlock(m.content, "hotels"));
    allItinerary.push(...extractBlock(m.content, "itinerary"));
  });

  let summary = "✈️ My Trip Plan (via Rzuma)\n\n";

  if (allFlights.length > 0) {
    summary += "🛫 FLIGHTS\n";
    allFlights.forEach((f) => {
      summary += `  • ${f.airline}: ${f.from} → ${f.to} | ${f.date} | ${f.currency}${f.price}\n`;
    });
    summary += "\n";
  }

  if (allHotels.length > 0) {
    summary += "🏨 HOTELS\n";
    allHotels.forEach((h) => {
      summary += `  • ${h.name} (${"⭐".repeat(h.stars)}) - ${h.location} | ${h.currency}${h.pricePerNight}/night\n`;
    });
    summary += "\n";
  }

  if (allActivities.length > 0) {
    summary += "🎯 ACTIVITIES\n";
    allActivities.forEach((a) => {
      summary += `  • ${a.name} (${a.duration}) - ${a.currency}${a.price}\n`;
    });
    summary += "\n";
  }

  if (allItinerary.length > 0) {
    summary += "📅 ITINERARY\n";
    allItinerary.forEach((d) => {
      summary += `  Day ${d.day}: ${d.title}\n`;
      summary += `    Morning: ${d.morning}\n`;
      summary += `    Afternoon: ${d.afternoon}\n`;
      summary += `    Evening: ${d.evening}\n`;
    });
    summary += "\n";
  }

  summary += "Planned with Rzuma ✨";
  return summary;
};

export const shareTripSummary = async (messages: Message[]) => {
  const summary = generateTripSummary(messages);

  if (navigator.share) {
    try {
      await navigator.share({ title: "My Trip Plan", text: summary });
      return true;
    } catch { /* fall through to clipboard */ }
  }

  await navigator.clipboard.writeText(summary);
  return true;
};
