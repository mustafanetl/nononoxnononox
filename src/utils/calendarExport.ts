/**
 * Generate a Google Calendar URL for a trip itinerary.
 * Creates an all-day event spanning the trip duration with the itinerary summary.
 */
export function getGoogleCalendarUrl(opts: {
  destination: string;
  days: number;
  startDate?: string; // ISO date string, defaults to tomorrow
  activities?: string[];
}): string {
  const { destination, days, startDate, activities } = opts;

  // Default to tomorrow if no start date
  const start = startDate ? new Date(startDate) : new Date(Date.now() + 86400000);
  const end = new Date(start.getTime() + days * 86400000);

  const formatDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split("T")[0];

  const title = `Trip to ${destination}`;
  const details = activities?.length
    ? `Planned with Jolliday AI\n\nHighlights:\n${activities.slice(0, 10).map((a) => `• ${a}`).join("\n")}`
    : `Planned with Jolliday AI — ${days} days in ${destination}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatDate(start)}/${formatDate(end)}`,
    details,
    location: destination,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate an .ics file content for calendar import (Apple Calendar, Outlook, etc.)
 */
export function generateICSContent(opts: {
  destination: string;
  days: number;
  startDate?: string;
  activities?: string[];
}): string {
  const { destination, days, startDate, activities } = opts;

  const start = startDate ? new Date(startDate) : new Date(Date.now() + 86400000);
  const end = new Date(start.getTime() + days * 86400000);

  const formatDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const formatDateOnly = (d: Date) =>
    d.toISOString().split("T")[0].replace(/-/g, "");

  const description = activities?.length
    ? `Planned with Jolliday AI\\n\\nHighlights:\\n${activities.slice(0, 10).map((a) => `- ${a}`).join("\\n")}`
    : `Planned with Jolliday AI - ${days} days in ${destination}`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Jolliday//Trip Planner//EN",
    "BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${formatDateOnly(start)}`,
    `DTEND;VALUE=DATE:${formatDateOnly(end)}`,
    `SUMMARY:Trip to ${destination}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${destination}`,
    `DTSTAMP:${formatDate(new Date())}`,
    `UID:jolliday-${Date.now()}@jolliday.online`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * Download an .ics file for the trip
 */
export function downloadICS(opts: {
  destination: string;
  days: number;
  startDate?: string;
  activities?: string[];
}): void {
  const content = generateICSContent(opts);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `trip-to-${opts.destination.toLowerCase().replace(/\s+/g, "-")}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
