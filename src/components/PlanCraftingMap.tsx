import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Plane } from "lucide-react";

export type CraftActivity = { name: string; photo?: string };
export type CraftGeo = { lat: number; lng: number };

type Props = {
  originCity: string;
  destinationCity: string;
  activities: CraftActivity[];
  destinationPhoto?: string;
  destinationGeo?: CraftGeo;
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

const buildPoints = (
  originCity: string,
  destinationCity: string,
  destinationPhoto: string | undefined,
  destinationGeo: CraftGeo | undefined,
  activities: CraftActivity[]
) => {
  const origin = hashCoords(originCity, DEFAULT_ORIGIN);
  const destination = destinationGeo || hashCoords(destinationCity, DEFAULT_DESTINATION);

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
  if (total <= 0 || progress < 28) return 0;
  const revealProgress = clamp((progress - 28) / 56, 0, 1);
  return clamp(Math.ceil(revealProgress * total), 0, total);
};

const buildPhotoMarkerHtml = (label: string, photo: string | undefined, size: number, primary = false) => {
  const border = primary ? 3 : 2;
  const safeLabel = label.replace(/"/g, "&quot;");
  const shadow = primary ? "0 14px 34px rgba(0,0,0,0.22)" : "0 10px 24px rgba(0,0,0,0.18)";

  if (photo) {
    return `<div style="width:${size}px;height:${size}px;border-radius:9999px;overflow:hidden;border:${border}px solid hsl(var(--background));box-shadow:${shadow};background:hsl(var(--muted));"><img src=\"${photo}\" alt=\"${safeLabel}\" style="width:100%;height:100%;object-fit:cover;display:block;" /></div>`;
  }

  return `<div style="width:${size}px;height:${size}px;border-radius:9999px;display:flex;align-items:center;justify-content:center;border:${border}px solid hsl(var(--background));box-shadow:${shadow};background:hsl(var(--foreground));color:hsl(var(--background));font-size:${primary ? 16 : 12}px;font-weight:700;">${initials(label)}</div>`;
};

const interpolatePath = (path: [number, number][], progress: number) => {
  if (path.length === 0) {
    return { position: [0, 0] as [number, number], traveled: [] as [number, number][] };
  }

  if (path.length === 1 || progress <= 0) {
    return { position: path[0], traveled: [path[0]] };
  }

  if (progress >= 1) {
    return { position: path[path.length - 1], traveled: [...path] };
  }

  const scaled = progress * (path.length - 1);
  const segmentIndex = Math.min(path.length - 2, Math.floor(scaled));
  const localProgress = scaled - segmentIndex;
  const start = path[segmentIndex];
  const end = path[segmentIndex + 1];
  const current: [number, number] = [
    start[0] + (end[0] - start[0]) * localProgress,
    start[1] + (end[1] - start[1]) * localProgress,
  ];

  return {
    position: current,
    traveled: [...path.slice(0, segmentIndex + 1), current],
  };
};

const PlanCraftingMap = ({ originCity, destinationCity, activities, destinationPhoto, destinationGeo, progress }: Props) => {
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const guideRouteRef = useRef<any>(null);
  const routeRef = useRef<any>(null);
  const planeMarkerRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);
  const pointMarkersRef = useRef<any[]>([]);
  const visibleCountRef = useRef(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [activitySlots, setActivitySlots] = useState<CraftActivity[]>([]);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (progress < 5) {
      visibleCountRef.current = 0;
      setVisibleCount(0);
      setActivitySlots([]);
      return;
    }

    setActivitySlots((prev) => {
      const incoming = activities.filter((activity) => activity.name?.trim()).slice(0, 5);
      const nextLength = Math.max(prev.length, incoming.length);
      return Array.from({ length: nextLength }, (_, index) => incoming[index] || prev[index] || { name: "" });
    });
  }, [activities, progress]);

  const stableActivities = useMemo(() => activitySlots.filter((activity) => activity.name?.trim()).slice(0, 5), [activitySlots]);
  const activityNamesKey = useMemo(
    () => stableActivities.map((activity) => activity.name.trim().toLowerCase()).join("|"),
    [stableActivities]
  );

  const points = useMemo(
    () => buildPoints(originCity, destinationCity, destinationPhoto, destinationGeo, stableActivities),
    [originCity, destinationCity, destinationPhoto, destinationGeo, stableActivities]
  );

  const geometryPoints = useMemo(
    () => buildPoints(
      originCity,
      destinationCity,
      undefined,
      destinationGeo,
      stableActivities.map((activity) => ({ name: activity.name }))
    ),
    [originCity, destinationCity, destinationGeo, activityNamesKey]
  );

  useEffect(() => {
    const nextVisible = Math.max(visibleCountRef.current, progressToVisibleCount(progress, stableActivities.length));
    if (nextVisible !== visibleCountRef.current) {
      visibleCountRef.current = nextVisible;
      setVisibleCount(nextVisible);
    }
  }, [progress, stableActivities.length]);

  const caption = useMemo(() => {
    if (progress < 20) return `Plotting your route to ${destinationCity || "your destination"}…`;
    if (progress >= 90) return "Finalizing your itinerary…";
    if (visibleCount === 0) return `Arriving in ${destinationCity || "your destination"}…`;
    const current = stableActivities[Math.max(0, visibleCount - 1)];
    return current?.name ? `Adding ${current.name}` : `Pinning your stops (${visibleCount}/${Math.max(1, stableActivities.length)})`;
  }, [progress, destinationCity, stableActivities, visibleCount]);

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
        fadeAnimation: false,
        markerZoomAnimation: false,
        zoomAnimation: false,
        inertia: false,
        preferCanvas: true,
      });

      tileLayerRef.current = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      guideRouteRef.current = L.polyline([], {
        color: "hsl(var(--border))",
        weight: 3,
        opacity: 0.85,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      routeRef.current = L.polyline([], {
        color: "hsl(var(--foreground))",
        weight: 3,
        opacity: 1,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      planeMarkerRef.current = L.marker([DEFAULT_ORIGIN.lat, DEFAULT_ORIGIN.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div style="width:34px;height:34px;border-radius:9999px;background:hsl(var(--foreground));color:hsl(var(--background));display:flex;align-items:center;justify-content:center;box-shadow:0 12px 30px rgba(0,0,0,0.2);border:2px solid hsl(var(--background));"><svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M22 2 11 13\"></path><path d=\"M22 2 15 22 11 13 2 9 22 2z\"></path></svg></div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        }),
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
      try { destinationMarkerRef.current?.remove(); } catch {}
      try { planeMarkerRef.current?.remove(); } catch {}
      try { guideRouteRef.current?.remove(); } catch {}
      try { routeRef.current?.remove(); } catch {}
      try { tileLayerRef.current?.remove(); } catch {}
      try { mapRef.current?.remove(); } catch {}
      destinationMarkerRef.current = null;
      planeMarkerRef.current = null;
      guideRouteRef.current = null;
      routeRef.current = null;
      tileLayerRef.current = null;
      mapRef.current = null;
      visibleCountRef.current = 0;
      setVisibleCount(0);
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !guideRouteRef.current) return;

    const fullPath: [number, number][] = [
      [geometryPoints.origin.lat, geometryPoints.origin.lng],
      [geometryPoints.destination.lat, geometryPoints.destination.lng],
      ...geometryPoints.activities.map((point) => [point.lat, point.lng] as [number, number]),
    ];

    guideRouteRef.current.setLatLngs(fullPath as any);

    import("leaflet").then((L) => {
      if (!mapRef.current || fullPath.length === 0) return;
      const bounds = L.latLngBounds(fullPath as any);
      mapRef.current.fitBounds(bounds, { padding: [48, 48], maxZoom: 5, animate: false });
    });
  }, [mapReady, geometryPoints.origin.lat, geometryPoints.origin.lng, geometryPoints.destination.lat, geometryPoints.destination.lng, activityNamesKey]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current) return;

      const icon = L.divIcon({
        className: "",
        html: buildPhotoMarkerHtml(points.destination.label, points.destination.photo, 58, true),
        iconSize: [58, 58],
        iconAnchor: [29, 29],
      });

      if (!destinationMarkerRef.current) {
        destinationMarkerRef.current = L.marker([points.destination.lat, points.destination.lng], { icon }).addTo(mapRef.current);
      } else {
        destinationMarkerRef.current.setLatLng([points.destination.lat, points.destination.lng]);
        destinationMarkerRef.current.setIcon(icon);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [mapReady, points.destination.lat, points.destination.lng, points.destination.label, points.destination.photo]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current) return;

      points.activities.forEach((point, index) => {
        const icon = L.divIcon({
          className: "",
          html: buildPhotoMarkerHtml(point.label, point.photo, 46),
          iconSize: [46, 46],
          iconAnchor: [23, 23],
        });

        const existing = pointMarkersRef.current[index];

        if (!existing) {
          const marker = L.marker([point.lat, point.lng], { icon, opacity: index < visibleCount ? 1 : 0 }).addTo(mapRef.current);
          marker.bindTooltip(point.label, {
            permanent: false,
            direction: "top",
            offset: [0, -18],
            opacity: 0.95,
          });
          pointMarkersRef.current[index] = marker;
        } else {
          existing.setLatLng([point.lat, point.lng]);
          existing.setIcon(icon);
          existing.setOpacity(index < visibleCount ? 1 : 0);
          existing.setTooltipContent(point.label);
        }
      });

      for (let index = points.activities.length; index < pointMarkersRef.current.length; index++) {
        try { pointMarkersRef.current[index]?.remove(); } catch {}
      }
      pointMarkersRef.current = pointMarkersRef.current.slice(0, points.activities.length);
    });

    return () => {
      cancelled = true;
    };
  }, [mapReady, points.activities, visibleCount]);

  useEffect(() => {
    if (!mapReady || !routeRef.current || !planeMarkerRef.current) return;

    const flightPath: [number, number][] = [
      [geometryPoints.origin.lat, geometryPoints.origin.lng],
      [geometryPoints.destination.lat, geometryPoints.destination.lng],
    ];
    const activityPath: [number, number][] = [
      [geometryPoints.destination.lat, geometryPoints.destination.lng],
      ...geometryPoints.activities.map((point) => [point.lat, point.lng] as [number, number]),
    ];

    if (progress < 24 || activityPath.length <= 1) {
      const { position, traveled } = interpolatePath(flightPath, clamp(progress / 24, 0, 1));
      routeRef.current.setLatLngs(traveled as any);
      planeMarkerRef.current.setLatLng(position);
      return;
    }

    const activityProgress = clamp((progress - 24) / 62, 0, 1);
    const { position, traveled } = interpolatePath(activityPath, activityProgress);
    routeRef.current.setLatLngs([
      flightPath[0],
      flightPath[1],
      ...traveled.slice(1),
    ] as any);
    planeMarkerRef.current.setLatLng(position);
  }, [mapReady, progress, geometryPoints.origin.lat, geometryPoints.origin.lng, geometryPoints.destination.lat, geometryPoints.destination.lng, activityNamesKey]);

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

const MapBadge = forwardRef<HTMLDivElement, { label: string; photo?: string; subtle?: boolean }>(function MapBadge(
  { label, photo, subtle = false },
  ref
) {
  const [imgError, setImgError] = useState(false);

  return (
    <div ref={ref} className="inline-flex items-center gap-2 rounded-full border border-border bg-background/92 px-2.5 py-1.5 shadow-sm w-fit">
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
});

MapBadge.displayName = "MapBadge";

export default PlanCraftingMap;
