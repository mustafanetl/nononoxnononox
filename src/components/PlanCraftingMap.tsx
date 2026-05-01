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
// Tight cluster around the destination so activities feel "in the city"
const ACTIVITY_OFFSETS = [
  { lat: 0.012, lng: 0.010 },
  { lat: -0.008, lng: 0.018 },
  { lat: 0.016, lng: -0.009 },
  { lat: -0.014, lng: -0.012 },
  { lat: 0.005, lng: -0.020 },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

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

const buildPhotoMarkerHtml = (label: string, photo: string | undefined, size: number, primary = false) => {
  const border = primary ? 3 : 2;
  const safeLabel = label.replace(/"/g, "&quot;");
  const shadow = primary ? "0 14px 34px rgba(0,0,0,0.22)" : "0 10px 24px rgba(0,0,0,0.18)";

  if (photo) {
    return `<div style="width:${size}px;height:${size}px;border-radius:9999px;overflow:hidden;border:${border}px solid hsl(var(--background));box-shadow:${shadow};background:hsl(var(--muted));transition:transform 400ms ease, opacity 400ms ease;"><img src="${photo}" alt="${safeLabel}" style="width:100%;height:100%;object-fit:cover;display:block;" /></div>`;
  }

  return `<div style="width:${size}px;height:${size}px;border-radius:9999px;display:flex;align-items:center;justify-content:center;border:${border}px solid hsl(var(--background));box-shadow:${shadow};background:hsl(var(--foreground));color:hsl(var(--background));font-size:${primary ? 16 : 12}px;font-weight:700;transition:transform 400ms ease, opacity 400ms ease;">${initials(label)}</div>`;
};

// Curve a great-circle-ish arc between two points so the plane doesn't fly in a flat line
const buildArc = (start: [number, number], end: [number, number], steps = 80): [number, number][] => {
  const [lat1, lng1] = start;
  const [lat2, lng2] = end;
  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;
  const dx = lng2 - lng1;
  const dy = lat2 - lat1;
  // Perpendicular offset for curvature (north-bowing arc)
  const dist = Math.sqrt(dx * dx + dy * dy);
  const curvature = Math.min(0.25, dist * 0.18);
  const normLat = -dx / (dist || 1);
  const normLng = dy / (dist || 1);
  const ctrlLat = midLat + normLat * curvature * dist;
  const ctrlLng = midLng + normLng * curvature * dist;

  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * ctrlLat + t * t * lat2;
    const lng = (1 - t) * (1 - t) * lng1 + 2 * (1 - t) * t * ctrlLng + t * t * lng2;
    pts.push([lat, lng]);
  }
  return pts;
};

const sliceArc = (arc: [number, number][], progress: number) => {
  if (arc.length === 0) return { traveled: [] as [number, number][], position: [0, 0] as [number, number] };
  if (progress <= 0) return { traveled: [arc[0]], position: arc[0] };
  if (progress >= 1) return { traveled: [...arc], position: arc[arc.length - 1] };
  const scaled = progress * (arc.length - 1);
  const idx = Math.floor(scaled);
  const local = scaled - idx;
  const a = arc[idx];
  const b = arc[idx + 1];
  const pos: [number, number] = [a[0] + (b[0] - a[0]) * local, a[1] + (b[1] - a[1]) * local];
  return { traveled: [...arc.slice(0, idx + 1), pos], position: pos };
};

// Phase boundaries (out of 100)
const P_FLIGHT_END = 40;     // 0-40: plane flies origin -> destination
const P_ZOOM_END = 50;       // 40-50: zoom into destination
const P_TOUR_END = 92;       // 50-92: pan between activities revealing them

const PlanCraftingMap = ({ originCity, destinationCity, activities, destinationPhoto, destinationGeo, progress }: Props) => {
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const flightRouteRef = useRef<any>(null);
  const tourRouteRef = useRef<any>(null);
  const planeMarkerRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);
  const pointMarkersRef = useRef<any[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const currentViewRef = useRef<{ center: [number, number]; zoom: number } | null>(null);
  const targetViewRef = useRef<{ center: [number, number]; zoom: number } | null>(null);
  const [activitySlots, setActivitySlots] = useState<CraftActivity[]>([]);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (progress < 5) {
      setActivitySlots([]);
      return;
    }
    setActivitySlots((prev) => {
      const incoming = activities.filter((activity) => activity.name?.trim()).slice(0, 5);
      const nextLength = Math.max(prev.length, incoming.length);
      return Array.from({ length: nextLength }, (_, index) => incoming[index] || prev[index] || { name: "" });
    });
  }, [activities, progress]);

  const stableActivities = useMemo(() => activitySlots.filter((a) => a.name?.trim()).slice(0, 5), [activitySlots]);
  const activityNamesKey = useMemo(() => stableActivities.map((a) => a.name.trim().toLowerCase()).join("|"), [stableActivities]);

  const points = useMemo(
    () => buildPoints(originCity, destinationCity, destinationPhoto, destinationGeo, stableActivities),
    [originCity, destinationCity, destinationPhoto, destinationGeo, stableActivities]
  );
  const geometryPoints = useMemo(
    () => buildPoints(originCity, destinationCity, undefined, destinationGeo, stableActivities.map((a) => ({ name: a.name }))),
    [originCity, destinationCity, destinationGeo, activityNamesKey]
  );

  const flightArc = useMemo(
    () => buildArc(
      [geometryPoints.origin.lat, geometryPoints.origin.lng],
      [geometryPoints.destination.lat, geometryPoints.destination.lng]
    ),
    [geometryPoints.origin.lat, geometryPoints.origin.lng, geometryPoints.destination.lat, geometryPoints.destination.lng]
  );

  // Compute current visible activity count + caption
  const totalActs = stableActivities.length;
  let visibleCount = 0;
  if (progress >= P_ZOOM_END && totalActs > 0) {
    const tourT = clamp((progress - P_ZOOM_END) / (P_TOUR_END - P_ZOOM_END), 0, 1);
    visibleCount = Math.min(totalActs, Math.ceil(easeInOut(tourT) * totalActs));
  }

  const caption = useMemo(() => {
    if (progress < P_FLIGHT_END) return `Flying to ${destinationCity || "your destination"}…`;
    if (progress < P_ZOOM_END) return `Arrived in ${destinationCity || "your destination"}`;
    if (progress >= 92) return "Finalizing your itinerary…";
    if (visibleCount === 0) return `Exploring ${destinationCity || "the city"}…`;
    const current = stableActivities[Math.max(0, visibleCount - 1)];
    return current?.name ? `Adding ${current.name} (${visibleCount}/${totalActs})` : `Pinning stops (${visibleCount}/${totalActs})`;
  }, [progress, destinationCity, stableActivities, visibleCount, totalActs]);

  // Initialize map once
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
        zoomSnap: 0.01,
        zoomDelta: 0.25,
        fadeAnimation: true,
        markerZoomAnimation: true,
        zoomAnimation: true,
        inertia: false,
        preferCanvas: true,
      });

      tileLayerRef.current = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      flightRouteRef.current = L.polyline([], {
        color: "hsl(var(--foreground))",
        weight: 2.5,
        opacity: 0.85,
        dashArray: "6 6",
        lineCap: "round",
      }).addTo(map);

      tourRouteRef.current = L.polyline([], {
        color: "hsl(var(--foreground))",
        weight: 2,
        opacity: 0.5,
        dashArray: "3 5",
        lineCap: "round",
      }).addTo(map);

      planeMarkerRef.current = L.marker([DEFAULT_ORIGIN.lat, DEFAULT_ORIGIN.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div style="width:36px;height:36px;border-radius:9999px;background:hsl(var(--foreground));color:hsl(var(--background));display:flex;align-items:center;justify-content:center;box-shadow:0 12px 30px rgba(0,0,0,0.25);border:2px solid hsl(var(--background));"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9 22 2z"/></svg></div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        }),
        zIndexOffset: 1000,
      }).addTo(map);

      // Initial fit to whole flight
      const bounds = L.latLngBounds([
        [geometryPoints.origin.lat, geometryPoints.origin.lng],
        [geometryPoints.destination.lat, geometryPoints.destination.lng],
      ]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 5, animate: false });
      currentViewRef.current = {
        center: [map.getCenter().lat, map.getCenter().lng],
        zoom: map.getZoom(),
      };

      mapRef.current = map;
      setMapReady(true);
    };

    init();

    return () => {
      disposed = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      pointMarkersRef.current.forEach((m) => { try { m.remove(); } catch {} });
      pointMarkersRef.current = [];
      try { destinationMarkerRef.current?.remove(); } catch {}
      try { planeMarkerRef.current?.remove(); } catch {}
      try { flightRouteRef.current?.remove(); } catch {}
      try { tourRouteRef.current?.remove(); } catch {}
      try { tileLayerRef.current?.remove(); } catch {}
      try { mapRef.current?.remove(); } catch {}
      destinationMarkerRef.current = null;
      planeMarkerRef.current = null;
      flightRouteRef.current = null;
      tourRouteRef.current = null;
      tileLayerRef.current = null;
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  // Maintain destination marker (photo)
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current) return;
      const icon = L.divIcon({
        className: "",
        html: buildPhotoMarkerHtml(points.destination.label, points.destination.photo, 60, true),
        iconSize: [60, 60],
        iconAnchor: [30, 30],
      });
      if (!destinationMarkerRef.current) {
        destinationMarkerRef.current = L.marker([points.destination.lat, points.destination.lng], { icon, opacity: 0, zIndexOffset: 600 }).addTo(mapRef.current);
      } else {
        destinationMarkerRef.current.setLatLng([points.destination.lat, points.destination.lng]);
        destinationMarkerRef.current.setIcon(icon);
      }
    });
    return () => { cancelled = true; };
  }, [mapReady, points.destination.lat, points.destination.lng, points.destination.label, points.destination.photo]);

  // Maintain activity markers
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current) return;
      points.activities.forEach((point, index) => {
        const icon = L.divIcon({
          className: "",
          html: buildPhotoMarkerHtml(point.label, point.photo, 48),
          iconSize: [48, 48],
          iconAnchor: [24, 24],
        });
        const existing = pointMarkersRef.current[index];
        if (!existing) {
          const marker = L.marker([point.lat, point.lng], { icon, opacity: 0, zIndexOffset: 400 }).addTo(mapRef.current);
          marker.bindTooltip(point.label, { permanent: false, direction: "top", offset: [0, -22], opacity: 0.95 });
          pointMarkersRef.current[index] = marker;
        } else {
          existing.setLatLng([point.lat, point.lng]);
          existing.setIcon(icon);
          existing.setTooltipContent(point.label);
        }
      });
      for (let i = points.activities.length; i < pointMarkersRef.current.length; i++) {
        try { pointMarkersRef.current[i]?.remove(); } catch {}
      }
      pointMarkersRef.current = pointMarkersRef.current.slice(0, points.activities.length);
    });
    return () => { cancelled = true; };
  }, [mapReady, points.activities]);

  // Drive animation per progress change
  useEffect(() => {
    if (!mapReady || !mapRef.current || !planeMarkerRef.current || !flightRouteRef.current || !tourRouteRef.current) return;
    const map = mapRef.current;

    // === PHASE 1: flight ===
    if (progress < P_FLIGHT_END) {
      const t = easeInOut(clamp(progress / P_FLIGHT_END, 0, 1));
      const { traveled, position } = sliceArc(flightArc, t);
      flightRouteRef.current.setLatLngs(traveled as any);
      tourRouteRef.current.setLatLngs([] as any);
      planeMarkerRef.current.setLatLng(position);
      planeMarkerRef.current.setOpacity(1);
      if (destinationMarkerRef.current) destinationMarkerRef.current.setOpacity(t > 0.85 ? (t - 0.85) / 0.15 : 0);
      pointMarkersRef.current.forEach((m) => m.setOpacity(0));

      // Keep wide view of full flight
      import("leaflet").then((L) => {
        const bounds = L.latLngBounds([
          [geometryPoints.origin.lat, geometryPoints.origin.lng],
          [geometryPoints.destination.lat, geometryPoints.destination.lng],
        ]);
        const target = bounds.getCenter();
        // Only set view once at start to avoid jitter
        if (!currentViewRef.current || currentViewRef.current.zoom < 4) {
          map.setView([target.lat, target.lng], map.getZoom(), { animate: false });
        }
      });
      return;
    }

    // === PHASE 2: zoom into destination ===
    if (progress < P_ZOOM_END) {
      const t = easeInOut(clamp((progress - P_FLIGHT_END) / (P_ZOOM_END - P_FLIGHT_END), 0, 1));
      flightRouteRef.current.setLatLngs(flightArc as any);
      planeMarkerRef.current.setLatLng(flightArc[flightArc.length - 1]);
      planeMarkerRef.current.setOpacity(1 - t);
      if (destinationMarkerRef.current) destinationMarkerRef.current.setOpacity(1);
      pointMarkersRef.current.forEach((m) => m.setOpacity(0));
      tourRouteRef.current.setLatLngs([] as any);

      // Smoothly fly into the destination
      import("leaflet").then((L) => {
        const startZoom = currentViewRef.current?.zoom ?? map.getZoom();
        const targetZoom = 13;
        const zoom = startZoom + (targetZoom - startZoom) * t;
        map.setView([geometryPoints.destination.lat, geometryPoints.destination.lng], zoom, { animate: false });
        currentViewRef.current = { center: [geometryPoints.destination.lat, geometryPoints.destination.lng], zoom };
      });
      return;
    }

    // === PHASE 3: tour activities ===
    flightRouteRef.current.setLatLngs([] as any); // hide long flight line at city zoom
    if (destinationMarkerRef.current) destinationMarkerRef.current.setOpacity(1);
    planeMarkerRef.current.setOpacity(0);

    const tourT = clamp((progress - P_ZOOM_END) / (P_TOUR_END - P_ZOOM_END), 0, 1);
    const acts = geometryPoints.activities;
    const totalActsLocal = acts.length;

    if (totalActsLocal === 0) {
      // Just hold on destination
      import("leaflet").then(() => {
        map.setView([geometryPoints.destination.lat, geometryPoints.destination.lng], 13, { animate: false });
      });
      return;
    }

    // Reveal markers progressively
    const revealCount = Math.min(totalActsLocal, Math.ceil(easeInOut(tourT) * totalActsLocal));
    pointMarkersRef.current.forEach((m, i) => m.setOpacity(i < revealCount ? 1 : 0));

    // Draw tour line through revealed activities (starting from destination)
    const tourPts: [number, number][] = [
      [geometryPoints.destination.lat, geometryPoints.destination.lng],
      ...acts.slice(0, revealCount).map((p) => [p.lat, p.lng] as [number, number]),
    ];
    tourRouteRef.current.setLatLngs(tourPts as any);

    // Smoothly pan to the latest revealed activity (or destination if none yet)
    const focus: [number, number] = revealCount > 0
      ? [acts[revealCount - 1].lat, acts[revealCount - 1].lng]
      : [geometryPoints.destination.lat, geometryPoints.destination.lng];

    import("leaflet").then(() => {
      const cur = currentViewRef.current;
      const targetZoom = 14;
      if (!cur) {
        map.setView(focus, targetZoom, { animate: false });
        currentViewRef.current = { center: focus, zoom: targetZoom };
        return;
      }
      // Lerp center smoothly between renders
      const lerp = 0.18;
      const newCenter: [number, number] = [
        cur.center[0] + (focus[0] - cur.center[0]) * lerp,
        cur.center[1] + (focus[1] - cur.center[1]) * lerp,
      ];
      const newZoom = cur.zoom + (targetZoom - cur.zoom) * lerp;
      map.setView(newCenter, newZoom, { animate: false });
      currentViewRef.current = { center: newCenter, zoom: newZoom };
    });
  }, [mapReady, progress, flightArc, geometryPoints.destination.lat, geometryPoints.destination.lng, activityNamesKey]);

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
