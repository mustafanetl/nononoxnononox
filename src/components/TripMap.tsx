import { useEffect, useMemo, useRef, useState } from "react";
import { Bed, MapPin } from "lucide-react";

type MapPoint = {
  name: string;
  lat: number;
  lng: number;
  type: "hotel" | "activity";
  /** Day number this stop belongs to (activity slots only). */
  day?: number;
  /** 1-based order within the day. Used as the visible pin number. */
  order?: number;
  /** Original slot index inside `day.slots`. Forwarded back on click. */
  slotIdx?: number;
  /** Optional thumbnail used in the hover popup. */
  photo?: string;
};

type ClickPayload = {
  name: string;
  type: "hotel" | "activity";
  day?: number;
  slotIdx?: number;
};

type Props = {
  points: MapPoint[];
  onMarkerClick?: (payload: ClickPayload) => void;
};

// Calm, day-specific accent colors. Cycles if more than 6 days.
const DAY_COLORS = [
  "hsl(220, 70%, 50%)",
  "hsl(160, 60%, 42%)",
  "hsl(20, 80%, 55%)",
  "hsl(280, 55%, 55%)",
  "hsl(340, 70%, 55%)",
  "hsl(45, 85%, 50%)",
];
const colorForDay = (day?: number) =>
  day == null ? "hsl(var(--foreground))" : DAY_COLORS[(day - 1) % DAY_COLORS.length];

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const TripMap = ({ points, onMarkerClick }: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  const disposedRef = useRef(false);
  const LRef = useRef<any>(null);
  const [activeDay, setActiveDay] = useState<number | null>(null);

  const days = useMemo(() => {
    const set = new Set<number>();
    for (const p of points) if (p.day != null) set.add(p.day);
    return Array.from(set).sort((a, b) => a - b);
  }, [points]);

  // Mount map once
  useEffect(() => {
    disposedRef.current = false;
    if (!mapRef.current || points.length === 0) return;

    const load = async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (disposedRef.current || !mapRef.current) return;
      LRef.current = L;

      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove(); } catch {}
      }

      const map = L.map(mapRef.current!, {
        zoomControl: false,
        scrollWheelZoom: true,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        fadeAnimation: true,
        zoomAnimation: true,
        markerZoomAnimation: true,
      }).setView([points[0].lat, points[0].lng], 13);

      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap © CARTO", subdomains: "abcd", maxZoom: 20 }
      ).addTo(map);

      mapInstanceRef.current = map;
      renderLayers();
    };

    load();
    return () => {
      disposedRef.current = true;
      try { mapInstanceRef.current?.off(); } catch {}
      try { mapInstanceRef.current?.remove(); } catch {}
      mapInstanceRef.current = null;
      markersRef.current = [];
      polylinesRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  // Re-render layers when filter changes
  useEffect(() => {
    if (!mapInstanceRef.current || !LRef.current) return;
    renderLayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDay, points]);

  const renderLayers = () => {
    const L = LRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map || disposedRef.current) return;

    // Wipe previous
    markersRef.current.forEach((m) => { try { m.remove(); } catch {} });
    markersRef.current = [];
    polylinesRef.current.forEach((p) => { try { p.remove(); } catch {} });
    polylinesRef.current = [];

    // Per-day polylines (activity slots, in order)
    const slotsByDay = new Map<number, MapPoint[]>();
    for (const p of points) {
      if (p.type !== "activity" || p.day == null) continue;
      if (!slotsByDay.has(p.day)) slotsByDay.set(p.day, []);
      slotsByDay.get(p.day)!.push(p);
    }
    for (const [day, list] of slotsByDay) {
      list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      if (list.length < 2) continue;
      const isFocus = activeDay == null || activeDay === day;
      const line = L.polyline(
        list.map((p) => [p.lat, p.lng]),
        {
          color: colorForDay(day),
          weight: isFocus ? 3 : 2,
          opacity: isFocus ? 0.8 : 0.18,
          lineCap: "round",
          lineJoin: "round",
          dashArray: activeDay === day ? undefined : "6 6",
          smoothFactor: 1.2,
          interactive: false,
        }
      ).addTo(map);
      polylinesRef.current.push(line);
    }

    // Markers
    const visiblePoints = activeDay == null
      ? points
      : points.filter((p) => p.type === "hotel" || p.day === activeDay);

    const bounds = L.latLngBounds([] as any);
    visiblePoints.forEach((p) => {
      const isHotel = p.type === "hotel";
      const focused = activeDay != null && p.day === activeDay;
      const dim = activeDay != null && !isHotel && p.day !== activeDay;
      const accent = isHotel ? "hsl(var(--primary))" : colorForDay(p.day);
      const size = focused ? 32 : 28;
      const ringWidth = focused ? 3 : 2;
      const opacity = dim ? 0.35 : 1;

      const inner = isHotel
        ? `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>`
        : `<span style="font-size:12px;font-weight:700;line-height:1;color:white;">${p.order ?? ""}</span>`;

      const tooltip = escapeHtml(p.name);

      const html = `
        <div class="trip-map-pin" data-name="${tooltip}" style="
          position:relative;
          width:${size}px;height:${size}px;
          border-radius:9999px;
          background:${accent};
          border:${ringWidth}px solid white;
          box-shadow:0 4px 14px rgba(0,0,0,0.22);
          display:flex;align-items:center;justify-content:center;
          cursor:pointer;
          opacity:${opacity};
          transition:transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
          will-change:transform;
        ">${inner}</div>
      `;

      const icon = L.divIcon({
        className: "trip-map-pin-wrap",
        html,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([p.lat, p.lng], { icon, riseOnHover: true, zIndexOffset: focused ? 1000 : 0 })
        .addTo(map);

      // Hover popup — name + day + tiny photo
      const popupHtml = `
        <div style="font-family:'DM Sans',Inter,sans-serif;min-width:160px;max-width:220px;">
          ${p.photo ? `<div style="width:100%;height:90px;background:url('${escapeHtml(p.photo)}') center/cover no-repeat;border-radius:8px;margin-bottom:6px;"></div>` : ""}
          <div style="font-weight:700;font-size:13px;color:#111;line-height:1.2;">${tooltip}</div>
          <div style="font-size:11px;color:#666;margin-top:2px;">
            ${isHotel ? "Hotel" : `Day ${p.day ?? "—"}${p.order ? ` · Stop ${p.order}` : ""}`}
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml, { closeButton: false, offset: [0, -4], maxWidth: 240 });
      marker.on("mouseover", () => marker.openPopup());
      marker.on("mouseout", () => marker.closePopup());

      marker.on("click", () => {
        onMarkerClick?.({
          name: p.name,
          type: p.type,
          day: p.day,
          slotIdx: p.slotIdx,
        });
      });

      markersRef.current.push(marker);
      if (!dim) bounds.extend([p.lat, p.lng]);
    });

    // Smooth fit
    if (bounds.isValid()) {
      try {
        map.flyToBounds(bounds, {
          padding: [60, 60],
          maxZoom: 15,
          duration: 0.6,
          easeLinearity: 0.25,
        });
      } catch {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
      }
    }
  };

  if (points.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border overflow-hidden shadow-sm bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-semibold text-foreground">Interactive Map</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {points.length} stops
        </span>
      </div>

      {/* Day filter */}
      {days.length > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
          <button
            type="button"
            onClick={() => setActiveDay(null)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              activeDay == null
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            All days
          </button>
          {days.map((d) => {
            const active = activeDay === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setActiveDay(active ? null : d)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  active ? "text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
                style={active ? { background: colorForDay(d) } : undefined}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ background: active ? "white" : colorForDay(d) }}
                />
                Day {d}
              </button>
            );
          })}
          {points.some((p) => p.type === "hotel") && (
            <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
              <Bed className="h-3 w-3" /> Hotel
            </span>
          )}
        </div>
      )}

      <div ref={mapRef} className="h-[280px] sm:h-[440px] w-full" />
    </div>
  );
};

export default TripMap;
export type { MapPoint, ClickPayload };
