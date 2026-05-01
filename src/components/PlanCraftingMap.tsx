import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Plane } from "lucide-react";

export type CraftActivity = { name: string; photo?: string };

type Props = {
  originCity: string;
  destinationCity: string;
  activities: CraftActivity[];
  destinationPhoto?: string;
  progress: number;
};

type Point = {
  lat: number;
  lng: number;
  label: string;
  photo?: string;
  primary?: boolean;
};

const DEFAULT_ORIGIN = { lat: 51.5074, lng: -0.1278 };
const DEFAULT_DESTINATION = { lat: 59.3293, lng: 18.0686 };
const ACTIVITY_OFFSETS = [
  { lat: 0.024, lng: 0.02 },
  { lat: -0.012, lng: 0.042 },
  { lat: 0.035, lng: -0.015 },
  { lat: -0.028, lng: -0.025 },
  { lat: 0.01, lng: -0.045 },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "•";

const hashCoords = (input: string, fallback: { lat: number; lng: number }) => {
  const source = input.trim().toLowerCase();
  if (!source) return fallback;
  let hash = 0;
  for (let i = 0; i < source.length; i++) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }
  const latOffset = ((hash % 1600) / 10000) - 0.08;
  const lngOffset = ((((hash / 1600) | 0) % 2200) / 10000) - 0.11;
  return {
    lat: fallback.lat + latOffset,
    lng: fallback.lng + lngOffset,
  };
};

const buildPoints = (originCity: string, destinationCity: string, destinationPhoto: string | undefined, activities: CraftActivity[]) => {
  const origin = hashCoords(originCity, DEFAULT_ORIGIN);
  const destination = hashCoords(destinationCity, DEFAULT_DESTINATION);

  const activityPoints = activities.slice(0, 5).map((activity, index) => {
    const offset = ACTIVITY_OFFSETS[index] || ACTIVITY_OFFSETS[ACTIVITY_OFFSETS.length - 1];
    return {
      lat: destination.lat + offset.lat,
      lng: destination.lng + offset.lng,
      label: activity.name || `Stop ${index + 1}`,
      photo: activity.photo,
    } satisfies Point;
  });

  return {
    origin: { ...origin, label: originCity || "Home" },
    destination: {
      ...destination,
      label: destinationCity || "Destination",
      photo: destinationPhoto,
      primary: true,
    } satisfies Point,
    activities: activityPoints,
  };
};

const progressToVisibleCount = (progress: number, total: number) => {
  if (total <= 0) return 0;
  const raw = Math.floor(((progress - 32) / 54) * total);
  return clamp(raw, 0, total);
};

const PlanCraftingMap = ({ originCity, destinationCity, activities, destinationPhoto, progress }: Props) => {
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const routeRef = useRef<any>(null);
  const completedRouteRef = useRef<any>(null);
  const planeMarkerRef = useRef<any>(null);
  const pointMarkersRef = useRef<any[]>([]);
  const visibleCountRef = useRef(0);
  const [mapReady, setMapReady] = useState(false);

  const stableActivities = useMemo(() => activities.filter((a) => a.name?.trim()).slice(0, 5), [activities]);
  const points = useMemo(
    () => buildPoints(originCity, destinationCity, destinationPhoto, stableActivities),
    [originCity, destinationCity, destinationPhoto, stableActivities]
  );

  const caption = useMemo(() => {
    if (progress < 22) return `Plotting your route to ${destinationCity || "your destination"}…`;
    if (progress >= 90) return "Finalizing your itinerary…";
    const visible = visibleCountRef.current;
    if (visible === 0) return `Arriving in ${destinationCity || "your destination"}…`;
    const current = stableActivities[Math.max(0, visible - 1)];
    return current?.name ? `Adding ${current.name}` : `Pinning your stops (${visible}/${Math.max(1, stableActivities.length)})`;
  }, [progress, destinationCity, stableActivities]);

  useEffect(() => {
    let disposed = false;

    const init = async () => {
      if (!mapElRef.current || mapRef.current) return;
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (disposed || !mapElRef.current) return;

      const map = L.map(mapElRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false,
        zoomSnap: 0.25,
        zoomDelta: 0.25,
        fadeAnimation: false,
        markerZoomAnimation: false,
      });

      tileLayerRef.current = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      setMapReady(true);
    };

    init();

    return () => {
      disposed = true;
      pointMarkersRef.current.forEach((marker) => {
        try { marker.remove(); } catch {}
      });
      pointMarkersRef.current = [];
      try { planeMarkerRef.current?.remove(); } catch {}
      try { routeRef.current?.remove(); } catch {}
      try { completedRouteRef.current?.remove(); } catch {}
      try { tileLayerRef.current?.remove(); } catch {}
      try { mapRef.current?.remove(); } catch {}
      planeMarkerRef.current = null;
      routeRef.current = null;
      completedRouteRef.current = null;
      tileLayerRef.current = null;
      mapRef.current = null;
      visibleCountRef.current = 0;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    let cancelled = false;

    const render = async () => {
      const L = await import("leaflet");
      if (cancelled || !mapRef.current) return;

      const map = mapRef.current;
      const routeLatLngs = [
        [points.origin.lat, points.origin.lng],
        [points.destination.lat, points.destination.lng],
      ];

      if (!completedRouteRef.current) {
        completedRouteRef.current = L.polyline(routeLatLngs as any, {
          color: "hsl(var(--border))",
          weight: 3,
          opacity: 0.8,
        }).addTo(map);
      } else {
        completedRouteRef.current.setLatLngs(routeLatLngs);
      }

      if (!routeRef.current) {
        routeRef.current = L.polyline(routeLatLngs as any, {
          color: "hsl(var(--foreground))",
          weight: 3,
          opacity: 1,
          dashArray: "10 10",
        }).addTo(map);
      } else {
        routeRef.current.setLatLngs(routeLatLngs);
      }

      if (!planeMarkerRef.current) {
        planeMarkerRef.current = L.marker([points.origin.lat, points.origin.lng], {
          icon: L.divIcon({
            className: "",
            html: `<div style="width:34px;height:34px;border-radius:9999px;background:hsl(var(--foreground));color:hsl(var(--background));display:flex;align-items:center;justify-content:center;box-shadow:0 12px 30px rgba(0,0,0,0.2);border:2px solid hsl(var(--background));"><svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M22 2 11 13\"></path><path d=\"M22 2 15 22 11 13 2 9 22 2z\"></path></svg></div>`,
            iconSize: [34, 34],
            iconAnchor: [17, 17],
          }),
        }).addTo(map);
      }

      const bounds = L.latLngBounds(routeLatLngs as any);
      const allPoints = [points.destination, ...points.activities];
      allPoints.forEach((point) => bounds.extend([point.lat, point.lng]));
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 5 });
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [mapReady, points]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !completedRouteRef.current || !routeRef.current || !planeMarkerRef.current) return;

    const map = mapRef.current;
    const origin = points.origin;
    const destination = points.destination;

    const flightProgress = clamp(progress / 24, 0, 1);
    const planeLat = origin.lat + (destination.lat - origin.lat) * flightProgress;
    const planeLng = origin.lng + (destination.lng - origin.lng) * flightProgress;
    planeMarkerRef.current.setLatLng([planeLat, planeLng]);
    routeRef.current.setLatLngs([
      [origin.lat, origin.lng],
      [planeLat, planeLng],
    ]);

    if (progress >= 24) {
      planeMarkerRef.current.setLatLng([destination.lat, destination.lng]);
    }

    const targetVisible = progressToVisibleCount(progress, points.activities.length);
    if (targetVisible <= visibleCountRef.current) return;

    let cancelled = false;

    const addMarkers = async () => {
      const L = await import("leaflet");
      if (cancelled || !mapRef.current) return;

      for (let i = visibleCountRef.current; i < targetVisible; i++) {
        const point = points.activities[i];
        if (!point) continue;

        const nextMarker = L.marker([point.lat, point.lng], {
          icon: L.divIcon({
            className: "",
            html: point.photo
              ? `<div style="width:46px;height:46px;border-radius:9999px;overflow:hidden;border:3px solid hsl(var(--background));box-shadow:0 10px 28px rgba(0,0,0,0.18);background:hsl(var(--muted));"><img src=\"${point.photo}\" alt=\"${point.label.replace(/"/g, "&quot;")}\" style=\"width:100%;height:100%;object-fit:cover;display:block;\" /></div>`
              : `<div style="width:46px;height:46px;border-radius:9999px;display:flex;align-items:center;justify-content:center;border:3px solid hsl(var(--background));box-shadow:0 10px 28px rgba(0,0,0,0.18);background:hsl(var(--foreground));color:hsl(var(--background));font-size:12px;font-weight:700;">${initials(point.label)}</div>`,
            iconSize: [46, 46],
            iconAnchor: [23, 23],
          }),
        }).addTo(map);

        nextMarker.bindTooltip(point.label, {
          permanent: false,
          direction: "top",
          offset: [0, -18],
          opacity: 0.95,
        });

        pointMarkersRef.current.push(nextMarker);

        completedRouteRef.current.addLatLng([point.lat, point.lng]);
        routeRef.current.addLatLng([point.lat, point.lng]);
      }

      visibleCountRef.current = targetVisible;
    };

    addMarkers();

    return () => {
      cancelled = true;
    };
  }, [mapReady, progress, points]);

  return (
    <div className="w-full max-w-3xl mx-auto py-8 animate-fade-in">
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card/95">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{destinationCity || "Building your trip"}</p>
            <p className="text-xs text-muted-foreground truncate">{originCity || "Home"} → {destinationCity || "Destination"}</p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground shrink-0">
            <Plane className="h-3.5 w-3.5" />
            {Math.round(progress)}%
          </div>
        </div>

        <div className="relative">
          <div ref={mapElRef} className="w-full h-[320px] sm:h-[380px]" />

          <div className="pointer-events-none absolute top-4 left-4 flex flex-col gap-2 max-w-[220px]">
            <MapBadge label={originCity || "Home"} subtle />
            <MapBadge label={destinationCity || "Destination"} photo={destinationPhoto} />
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-4 font-medium">{caption}</p>
    </div>
  );
};

const MapBadge = ({ label, photo, subtle = false }: { label: string; photo?: string; subtle?: boolean }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/92 backdrop-blur-sm px-2.5 py-1.5 shadow-sm w-fit">
      <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
        {photo && !imgError ? (
          <img src={photo} alt={label} className="w-full h-full object-cover" onError={() => setImgError(true)} />
        ) : subtle ? (
          <MapPin className="h-4 w-4 text-muted-foreground" />
        ) : (
          <span className="text-[10px] font-semibold text-foreground">{initials(label)}</span>
        )}
      </div>
      <span className="text-xs font-medium text-foreground truncate max-w-[150px]">{label}</span>
    </div>
  );
};

export default PlanCraftingMap;