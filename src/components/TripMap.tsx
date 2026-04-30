import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";

type MapPoint = {
  name: string;
  lat: number;
  lng: number;
  type: "hotel" | "activity";
  day?: number;
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
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        { attribution: '© OpenStreetMap © CARTO' }
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
      const size = isActive ? 34 : 28;
      const icon = L.divIcon({
        className: "",
        html: `<div class="${isActive ? "animate-pin-bounce" : ""}" style="background:${
          p.type === "hotel"
            ? "hsl(var(--primary))"
            : "hsl(var(--destructive))"
        };color:white;width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:${isActive ? 13 : 11}px;font-weight:700;border:2.5px solid white;box-shadow:0 3px 12px rgba(0,0,0,0.25);transition:all 0.3s ease">${
          p.type === "hotel" ? "H" : "A"
        }</div>`,

        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([p.lat, p.lng], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:Inter,sans-serif;padding:2px 0"><b style="font-size:13px">${p.name}</b><br/><span style="font-size:11px;opacity:0.7">${p.type}${p.day ? ` • Day ${p.day}` : ""}</span></div>`
        );

      marker.on("click", () => {
        onMarkerClick?.(p.name);
      });

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
