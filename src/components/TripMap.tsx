import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";

type MapPoint = {
  name: string;
  lat: number;
  lng: number;
  type: "hotel" | "activity";
};

type Props = { points: MapPoint[] };

const TripMap = ({ points }: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || points.length === 0) return;

    const loadMap = async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapRef.current!, { zoomControl: false }).setView([points[0].lat, points[0].lng], 13);
      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap',
      }).addTo(map);

      const bounds = L.latLngBounds([]);

      points.forEach(p => {
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:${p.type === "hotel" ? "hsl(0,0%,9%)" : "hsl(0,84%,60%)"};color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${p.type === "hotel" ? "🏨" : "🎯"}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        L.marker([p.lat, p.lng], { icon }).addTo(map).bindPopup(`<b>${p.name}</b><br/>${p.type}`);
        bounds.extend([p.lat, p.lng]);
      });

      if (points.length > 1) map.fitBounds(bounds, { padding: [30, 30] });

      mapInstanceRef.current = map;
    };

    loadMap();

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, [points]);

  if (points.length === 0) return null;

  return (
    <div className="mt-3 rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-card border-b border-border">
        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Map View</span>
        <span className="text-xs text-muted-foreground ml-auto">{points.length} locations</span>
      </div>
      <div ref={mapRef} className="h-[300px] w-full" />
    </div>
  );
};

export default TripMap;
export type { MapPoint };
