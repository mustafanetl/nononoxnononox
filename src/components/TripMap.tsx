import { useEffect, useMemo, useRef, useState } from "react";
import { Bed, MapPin } from "lucide-react";

type MapPoint = {
  name: string;
  lat: number;
  lng: number;
  type: "hotel" | "activity";
  day?: number;
  order?: number;
  slotIdx?: number;
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
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const TripMap = ({ points, onMarkerClick }: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  const disposedRef = useRef(false);
  const LRef = useRef<any>(null);
  const onClickRef = useRef(onMarkerClick);
  const fittedRef = useRef(false);
  const [activeDay, setActiveDay] = useState<number | null>(null);

  // Keep callback ref fresh without retriggering effects
  useEffect(() => { onClickRef.current = onMarkerClick; }, [onMarkerClick]);

  // Stable signature: only re-render layers when coords/days/photos actually change
  const pointsKey = useMemo(
    () => points.map((p) => `${p.type}|${p.day ?? "x"}|${p.order ?? "x"}|${p.lat.toFixed(5)}|${p.lng.toFixed(5)}|${p.photo ? "1" : "0"}`).join("~"),
    [points]
  );

  const days = useMemo(() => {
    const set = new Set<number>();
    for (const p of points) if (p.day != null) set.add(p.day);
    return Array.from(set).sort((a, b) => a - b);
  }, [pointsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mount map ONCE
  useEffect(() => {
    disposedRef.current = false;
    if (!mapRef.current || points.length === 0) return;

    let cleanup = () => {};
    const load = async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (disposedRef.current || !mapRef.current) return;
      LRef.current = L;

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
      fittedRef.current = false;
      renderLayers(true);
    };

    load();
    cleanup = () => {
      disposedRef.current = true;
      try { mapInstanceRef.current?.off(); } catch {}
      try { mapInstanceRef.current?.remove(); } catch {}
      mapInstanceRef.current = null;
      markersRef.current = [];
      polylinesRef.current = [];
      fittedRef.current = false;
    };
    return cleanup;
    // Mount once. Re-renders go through the dedicated effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render layers when filter or stable point data changes — but DON'T refit unless the user changed the filter
  const prevActiveDayRef = useRef<number | null>(null);
  useEffect(() => {
    if (!mapInstanceRef.current || !LRef.current) return;
    const filterChanged = prevActiveDayRef.current !== activeDay;
    prevActiveDayRef.current = activeDay;
    renderLayers(filterChanged || !fittedRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDay, pointsKey]);

  const renderLayers = (shouldFit: boolean) => {
    const L = LRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map || disposedRef.current) return;

    markersRef.current.forEach((m) => { try { m.remove(); } catch {} });
    markersRef.current = [];
    polylinesRef.current.forEach((p) => { try { p.remove(); } catch {} });
    polylinesRef.current = [];

    // Per-day polylines
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
          opacity: isFocus ? 0.8 : 0.15,
          lineCap: "round",
          lineJoin: "round",
          dashArray: activeDay === day ? undefined : "6 6",
          smoothFactor: 1.2,
          interactive: false,
        }
      ).addTo(map);
      polylinesRef.current.push(line);
    }

    const visiblePoints = activeDay == null
      ? points
      : points.filter((p) => p.type === "hotel" || p.day === activeDay);

    const bounds = L.latLngBounds([] as any);
    visiblePoints.forEach((p) => {
      const isHotel = p.type === "hotel";
      const focused = activeDay != null && p.day === activeDay;
      const dim = activeDay != null && !isHotel && p.day !== activeDay;
      const accent = isHotel ? "hsl(var(--primary))" : colorForDay(p.day);
      // Calmer, smaller, more consistent sizing
      const baseSize = isHotel ? 40 : 36;
      const size = focused && !isHotel ? 42 : baseSize;
      const opacity = dim ? 0.4 : 1;
      const photoUrl = typeof p.photo === "string" && p.photo.trim() ? escapeHtml(p.photo) : "";

      const hotelIconSvg = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>`;

      // Inner content: photo if available, otherwise solid accent + icon/number
      const fallbackInner = isHotel
        ? `<div style="width:100%;height:100%;border-radius:9999px;background:${accent};display:flex;align-items:center;justify-content:center;">${hotelIconSvg}</div>`
        : `<div style="width:100%;height:100%;border-radius:9999px;background:${accent};display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:13px;line-height:1;">${p.order ?? ""}</div>`;
      const photoInner = `<div style="width:100%;height:100%;border-radius:9999px;background:#eee url('${photoUrl}') center/cover no-repeat;"></div>`;
      const inner = photoUrl ? photoInner : fallbackInner;

      // Corner badge: number for activity-with-photo, bed icon for hotel-with-photo
      let badge = "";
      if (photoUrl) {
        if (isHotel) {
          badge = `<div style="position:absolute;bottom:-2px;right:-2px;width:16px;height:16px;border-radius:9999px;background:${accent};display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.2);"><svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg></div>`;
        } else if (p.order != null) {
          badge = `<div style="position:absolute;bottom:-2px;right:-2px;min-width:16px;height:16px;padding:0 4px;border-radius:9999px;background:${accent};color:white;font-size:10px;font-weight:700;line-height:1;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.2);">${p.order}</div>`;
        }
      }

      const shadow = dim ? "none" : "0 4px 12px rgba(0,0,0,0.18)";
      const html = `
        <div class="trip-map-pin" style="
          position:relative;
          width:${size}px;height:${size}px;
          border-radius:9999px;
          background:white;
          padding:2px;
          box-shadow:${shadow};
          cursor:pointer;
          opacity:${opacity};
          transition:transform 160ms ease, opacity 160ms ease;
          will-change:transform;
        ">${inner}${badge}</div>
      `;

      const icon = L.divIcon({
        className: "trip-map-pin-wrap",
        html,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([p.lat, p.lng], {
        icon,
        riseOnHover: true,
        zIndexOffset: focused ? 1000 : 0,
        keyboard: false,
      }).addTo(map);

      // Tooltip — Leaflet's built-in, no flicker
      marker.bindTooltip(
        `<div style="font-family:'DM Sans',Inter,sans-serif;font-weight:600;font-size:12px;color:#111;">${escapeHtml(p.name)}<div style="font-weight:400;font-size:10px;color:#666;margin-top:2px;">${isHotel ? "Hotel" : `Day ${p.day ?? "—"}${p.order ? ` · Stop ${p.order}` : ""}`}</div></div>`,
        { direction: "top", offset: [0, -size / 2 + 4], opacity: 1, sticky: false }
      );

      marker.on("click", (e: any) => {
        try { e.originalEvent?.stopPropagation?.(); } catch {}
        try { marker.closeTooltip(); } catch {}
        // Defer slightly so React state update doesn't fight the click
        const payload = { name: p.name, type: p.type, day: p.day, slotIdx: p.slotIdx };
        setTimeout(() => onClickRef.current?.(payload), 0);
      });

      markersRef.current.push(marker);
      if (!dim) bounds.extend([p.lat, p.lng]);
    });

    // Only refit when explicitly requested (mount or filter change), never on incidental re-renders
    if (shouldFit && bounds.isValid()) {
      try {
        map.flyToBounds(bounds, {
          padding: [60, 60],
          maxZoom: 15,
          duration: 0.55,
          easeLinearity: 0.25,
        });
        fittedRef.current = true;
      } catch {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
        fittedRef.current = true;
      }
    }
  };

  if (points.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border overflow-hidden shadow-sm bg-card">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-semibold text-foreground">Interactive Map</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {points.length} stops
        </span>
      </div>

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
