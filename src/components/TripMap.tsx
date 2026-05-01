import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";

type MapPoint = {
  name: string;
  lat: number;
  lng: number;
  type: "hotel" | "activity";
  day?: number;
  photo?: string;
};

type Props = {
  points: MapPoint[];
  activeDay?: number | null;
  onMarkerClick?: (name: string) => void;
};

const TripMap = ({ points, activeDay, onMarkerClick }: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const disposedRef = useRef(false);

  useEffect(() => {
    disposedRef.current = false;
    if (!mapRef.current || points.length === 0) return;

    const loadMap = async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (disposedRef.current || !mapRef.current) return;

      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove(); } catch {}
      }

      const map = L.map(mapRef.current!, {
        zoomControl: false,
        zoomAnimation: false,
        fadeAnimation: false,
        markerZoomAnimation: false,
      }).setView(
        [points[0].lat, points[0].lng],
        13
      );
      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        { attribution: '© OpenStreetMap © CARTO', subdomains: 'abcd', maxZoom: 20 }
      ).addTo(map);

      mapInstanceRef.current = map;
      updateMarkers(L, map);
    };

    loadMap();

    return () => {
      disposedRef.current = true;
      try { mapInstanceRef.current?.off(); } catch {}
      try { mapInstanceRef.current?.remove(); } catch {}
      mapInstanceRef.current = null;
      markersRef.current = [];
      polylineRef.current = null;
    };
  }, [points]);

  // Update markers when activeDay changes
  useEffect(() => {
    if (!mapInstanceRef.current || disposedRef.current) return;

    const updateAsync = async () => {
      if (!mapInstanceRef.current || disposedRef.current) return;
      const L = await import("leaflet");
      if (!mapInstanceRef.current || disposedRef.current) return;
      updateMarkers(L, mapInstanceRef.current);
    };
    updateAsync();
  }, [activeDay, points]);

  const updateMarkers = (L: any, map: any) => {
    if (!map || disposedRef.current) return;
    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    const filtered =
      activeDay != null
        ? points.filter((p) => p.day === activeDay)
        : points;

    if (filtered.length === 0) return;

    const bounds = L.latLngBounds([]);

    filtered.forEach((p, idx) => {
      const isActive = activeDay != null;
      const size = isActive ? 48 : 40;
      const ringColor = p.type === "hotel" ? "hsl(var(--primary))" : "hsl(var(--foreground))";
      const safePhoto = (p.photo || "").replace(/"/g, "&quot;");
      const inner = safePhoto
        ? `<div style="width:100%;height:100%;border-radius:9999px;background-image:url('${safePhoto}');background-size:cover;background-position:center;"></div>`
        : `<div style="width:100%;height:100%;border-radius:9999px;background:${
            p.type === "hotel" ? "hsl(var(--primary))" : "hsl(var(--foreground))"
          };color:hsl(var(--background));display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;">${p.type === "hotel" ? "H" : (p.day ?? idx + 1)}</div>`;
      const badge = p.day != null
        ? `<div style="position:absolute;bottom:-4px;right:-4px;min-width:18px;height:18px;padding:0 5px;border-radius:9999px;background:hsl(var(--foreground));color:hsl(var(--background));font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid hsl(var(--background));box-shadow:0 2px 6px rgba(0,0,0,0.2);">${p.day}</div>`
        : "";
      const icon = L.divIcon({
        className: "",
        html: `<div class="${isActive ? "animate-pin-bounce" : ""}" style="position:relative;width:${size}px;height:${size}px;cursor:pointer;"><div style="width:100%;height:100%;border-radius:9999px;padding:2px;background:hsl(var(--background));border:2px solid ${ringColor};box-shadow:0 6px 18px rgba(0,0,0,0.22);overflow:hidden;transition:transform 0.2s ease;">${inner}</div>${badge}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([p.lat, p.lng], { icon, riseOnHover: true }).addTo(map);
      marker.on("click", () => { onMarkerClick?.(p.name); });

      markersRef.current.push(marker);
      bounds.extend([p.lat, p.lng]);
    });

    // Draw polyline connecting points in order
    if (filtered.length > 1) {
      const latLngs = filtered.map((p) => [p.lat, p.lng]);
      polylineRef.current = L.polyline(latLngs as any, {
        color: "hsl(var(--primary))",
        weight: 2.5,
        opacity: 0.5,
        dashArray: "8 6",
        smoothFactor: 1.5,
      }).addTo(map);
    }

    if (filtered.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } else {
      map.setView([filtered[0].lat, filtered[0].lng], 14);
    }
  };

  if (points.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-card border-b border-border">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-semibold text-foreground">Interactive Map</span>
        {activeDay != null && (
          <span className="text-xs text-primary font-medium ml-1">
            Day {activeDay}
          </span>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {points.length} locations
        </span>
      </div>
      <div ref={mapRef} className="h-[250px] sm:h-[400px] w-full" />
    </div>
  );
};

export default TripMap;
export type { MapPoint };
