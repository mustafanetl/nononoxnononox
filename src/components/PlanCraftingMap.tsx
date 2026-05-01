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
  { lat: 0.012, lng: 0.010 },
  { lat: -0.008, lng: 0.018 },
  { lat: 0.016, lng: -0.009 },
  { lat: -0.014, lng: -0.012 },
  { lat: 0.005, lng: -0.020 },
];

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "•";

const hashCoords = (input: string, fallback: { lat: number; lng: number }) => {
  const source = input.trim().toLowerCase();
  if (!source) return fallback;
  let hash = 0;
  for (let i = 0; i < source.length; i++) hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  const latOffset = ((hash % 1600) / 10000) - 0.08;
  const lngOffset = ((((hash / 1600) | 0) % 2200) / 10000) - 0.11;
  return { lat: fallback.lat + latOffset, lng: fallback.lng + lngOffset };
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
    destination: { ...destination, label: destinationCity || "Destination", photo: destinationPhoto, primary: true } satisfies Point,
    activities: activityPoints,
  };
};

const buildPhotoMarkerHtml = (label: string, photo: string | undefined, size: number, primary = false) => {
  const border = primary ? 3 : 2;
  const safeLabel = label.replace(/"/g, "&quot;");
  const shadow = primary ? "0 14px 34px rgba(0,0,0,0.22)" : "0 10px 24px rgba(0,0,0,0.18)";
  if (photo) {
    return `<div style="width:${size}px;height:${size}px;border-radius:9999px;overflow:hidden;border:${border}px solid hsl(var(--background));box-shadow:${shadow};background:hsl(var(--muted));will-change:transform,opacity;"><img src="${photo}" alt="${safeLabel}" style="width:100%;height:100%;object-fit:cover;display:block;" /></div>`;
  }
  return `<div style="width:${size}px;height:${size}px;border-radius:9999px;display:flex;align-items:center;justify-content:center;border:${border}px solid hsl(var(--background));box-shadow:${shadow};background:hsl(var(--foreground));color:hsl(var(--background));font-size:${primary ? 16 : 12}px;font-weight:700;will-change:transform,opacity;">${initials(label)}</div>`;
};

// Quadratic bezier arc — north-bowing curve between origin and destination
const buildArc = (start: [number, number], end: [number, number], steps = 120): [number, number][] => {
  const [lat1, lng1] = start;
  const [lat2, lng2] = end;
  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;
  const dx = lng2 - lng1;
  const dy = lat2 - lat1;
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
const P_FLIGHT_END = 38;
const P_ZOOM_END = 58; // wider window so the flyTo glide has room to breathe
const P_TOUR_END = 92;

const PlanCraftingMap = ({ originCity, destinationCity, activities, destinationPhoto, destinationGeo, progress }: Props) => {
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const flightRouteRef = useRef<any>(null);
  const tourRouteRef = useRef<any>(null);
  const planeMarkerRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);
  const pointMarkersRef = useRef<any[]>([]);

  // rAF state
  const rafRef = useRef<number | null>(null);
  const displayedProgressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const currentViewRef = useRef<{ center: [number, number]; zoom: number } | null>(null);
  // Precomputed view targets so the rAF loop never recomputes bounds per frame
  const flightViewRef = useRef<{ center: [number, number]; zoom: number } | null>(null);
  const cityViewRef = useRef<{ center: [number, number]; zoom: number } | null>(null);
  // Track which phase we're in so we only kick off flyTo once per transition
  const phaseRef = useRef<0 | 1 | 2 | 3>(0);
  const flyStartedRef = useRef(false);

  // Accumulate activity slots so the count never shrinks (prevents flicker)
  const [activitySlots, setActivitySlots] = useState<CraftActivity[]>([]);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (progress < 5) {
      setActivitySlots([]);
      return;
    }
    setActivitySlots((prev) => {
      const incoming = activities.filter((a) => a.name?.trim()).slice(0, 5);
      const nextLength = Math.max(prev.length, incoming.length);
      return Array.from({ length: nextLength }, (_, i) => incoming[i] || prev[i] || { name: "" });
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

  // Caption based on smoothed progress
  const totalActs = stableActivities.length;
  const [caption, setCaption] = useState("");

  // Initialize map once
  useEffect(() => {
    let disposed = false;
    const init = async () => {
      if (!mapElRef.current || mapRef.current) return;
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (disposed || !mapElRef.current) return;
      LRef.current = L;

      const map = L.map(mapElRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false,
        zoomSnap: 0,
        zoomDelta: 0.1,
        wheelPxPerZoomLevel: 120,
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
          html: `<div style="width:36px;height:36px;border-radius:9999px;background:hsl(var(--foreground));color:hsl(var(--background));display:flex;align-items:center;justify-content:center;box-shadow:0 12px 30px rgba(0,0,0,0.25);border:2px solid hsl(var(--background));will-change:transform;"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9 22 2z"/></svg></div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        }),
        zIndexOffset: 1000,
      }).addTo(map);

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
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
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

  // Maintain destination marker (photo + position) imperatively
  useEffect(() => {
    if (!mapReady || !mapRef.current || !LRef.current) return;
    const L = LRef.current;
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
  }, [mapReady, points.destination.lat, points.destination.lng, points.destination.label, points.destination.photo]);

  // Maintain activity markers imperatively
  useEffect(() => {
    if (!mapReady || !mapRef.current || !LRef.current) return;
    const L = LRef.current;
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
  }, [mapReady, points.activities]);

  // Update target progress whenever prop changes
  useEffect(() => {
    targetProgressRef.current = clamp(progress, 0, 100);
  }, [progress]);

  // Single rAF loop drives EVERYTHING — smooth interpolation toward target
  useEffect(() => {
    if (!mapReady || !mapRef.current || !planeMarkerRef.current || !flightRouteRef.current || !tourRouteRef.current || !LRef.current) return;
    const L = LRef.current;
    const map = mapRef.current;

    const tick = () => {
      // Smoothly chase the target progress (~12% of remaining distance per frame ≈ 250ms time-constant)
      const target = targetProgressRef.current;
      const current = displayedProgressRef.current;
      const diff = target - current;
      const next = Math.abs(diff) < 0.01 ? target : current + diff * 0.12;
      displayedProgressRef.current = next;

      const p = next;

      // Compute target view for the city (used in phases 2 + 3)
      const acts = geometryPoints.activities;
      const cityPts: [number, number][] = [
        [geometryPoints.destination.lat, geometryPoints.destination.lng],
        ...acts.map((a) => [a.lat, a.lng] as [number, number]),
      ];
      const cityBounds = L.latLngBounds(cityPts as any);
      const fitInfo = (map as any)._getBoundsCenterZoom
        ? (map as any)._getBoundsCenterZoom(cityBounds, { padding: [60, 60], maxZoom: 14 })
        : { center: cityBounds.getCenter(), zoom: 13 };
      const targetCityCenter: [number, number] = [fitInfo.center.lat, fitInfo.center.lng];
      const targetCityZoom = clamp(fitInfo.zoom ?? 13, 11, 14);

      const flightBounds = L.latLngBounds([
        [geometryPoints.origin.lat, geometryPoints.origin.lng],
        [geometryPoints.destination.lat, geometryPoints.destination.lng],
      ]);
      const flightFit = (map as any)._getBoundsCenterZoom
        ? (map as any)._getBoundsCenterZoom(flightBounds, { padding: [60, 60], maxZoom: 5 })
        : { center: flightBounds.getCenter(), zoom: 4 };
      const flightCenter: [number, number] = [flightFit.center.lat, flightFit.center.lng];
      const flightZoom = clamp(flightFit.zoom ?? 4, 2, 5);

      // === PHASE 1: Flight (0-40) ===
      if (p < P_FLIGHT_END) {
        const t = easeInOut(clamp(p / P_FLIGHT_END, 0, 1));
        const { traveled, position } = sliceArc(flightArc, t);
        flightRouteRef.current.setLatLngs(traveled as any);
        tourRouteRef.current.setLatLngs([] as any);
        planeMarkerRef.current.setLatLng(position);
        planeMarkerRef.current.setOpacity(1);
        if (destinationMarkerRef.current) {
          const fadeIn = clamp((t - 0.85) / 0.15, 0, 1);
          destinationMarkerRef.current.setOpacity(fadeIn);
        }
        pointMarkersRef.current.forEach((m) => m.setOpacity(0));

        // Lock flight view (set once, no per-frame movement during phase 1)
        const cur = currentViewRef.current;
        if (!cur || cur.zoom > flightZoom + 0.5) {
          map.setView(flightCenter, flightZoom, { animate: false });
          currentViewRef.current = { center: flightCenter, zoom: flightZoom };
        }

        setCaption(`Flying to ${destinationCity || "your destination"}…`);
      }
      // === PHASE 2: Zoom into city (40-55) ===
      else if (p < P_ZOOM_END) {
        const t = easeInOut(clamp((p - P_FLIGHT_END) / (P_ZOOM_END - P_FLIGHT_END), 0, 1));
        flightRouteRef.current.setLatLngs(flightArc as any);
        planeMarkerRef.current.setLatLng(flightArc[flightArc.length - 1]);
        planeMarkerRef.current.setOpacity(1 - t);
        if (destinationMarkerRef.current) destinationMarkerRef.current.setOpacity(1);
        pointMarkersRef.current.forEach((m) => m.setOpacity(0));
        tourRouteRef.current.setLatLngs([] as any);

        const cur = currentViewRef.current ?? { center: flightCenter, zoom: flightZoom };
        const newCenter: [number, number] = [
          lerp(cur.center[0], targetCityCenter[0], t),
          lerp(cur.center[1], targetCityCenter[1], t),
        ];
        const newZoom = lerp(cur.zoom, targetCityZoom, t);
        map.setView(newCenter, newZoom, { animate: false });
        if (t >= 0.999) currentViewRef.current = { center: targetCityCenter, zoom: targetCityZoom };

        setCaption(`Arrived in ${destinationCity || "your destination"}`);
      }
      // === PHASE 3: City tour — pins & dashed route reveal (55-92) ===
      else {
        flightRouteRef.current.setLatLngs([] as any);
        if (destinationMarkerRef.current) destinationMarkerRef.current.setOpacity(1);
        planeMarkerRef.current.setOpacity(0);

        // Lock map to city view — no chasing
        const cur = currentViewRef.current;
        if (!cur ||
            Math.abs(cur.zoom - targetCityZoom) > 0.05 ||
            Math.abs(cur.center[0] - targetCityCenter[0]) > 0.0005 ||
            Math.abs(cur.center[1] - targetCityCenter[1]) > 0.0005) {
          map.setView(targetCityCenter, targetCityZoom, { animate: false });
          currentViewRef.current = { center: targetCityCenter, zoom: targetCityZoom };
        }

        const tourT = clamp((p - P_ZOOM_END) / (P_TOUR_END - P_ZOOM_END), 0, 1);
        const totalActsLocal = acts.length;
        if (totalActsLocal === 0) {
          tourRouteRef.current.setLatLngs([] as any);
          setCaption(p >= 92 ? "Finalizing your itinerary…" : `Exploring ${destinationCity || "the city"}…`);
        } else {
          // Continuous reveal: each pin fades in over its slice; route grows progressively
          const eased = easeInOut(tourT);
          const exact = eased * totalActsLocal; // e.g. 2.4 means 2 fully shown + 40% of next
          pointMarkersRef.current.forEach((m, i) => {
            const opacity = clamp(exact - i, 0, 1);
            m.setOpacity(opacity);
          });

          // Build a smoothly-extending tour route (origin = destination -> each activity)
          const fullSteps = Math.floor(exact);
          const partial = exact - fullSteps;
          const route: [number, number][] = [[geometryPoints.destination.lat, geometryPoints.destination.lng]];
          for (let i = 0; i < Math.min(fullSteps, totalActsLocal); i++) {
            route.push([acts[i].lat, acts[i].lng]);
          }
          if (fullSteps < totalActsLocal && partial > 0) {
            const from = fullSteps === 0
              ? [geometryPoints.destination.lat, geometryPoints.destination.lng] as [number, number]
              : [acts[fullSteps - 1].lat, acts[fullSteps - 1].lng] as [number, number];
            const to: [number, number] = [acts[fullSteps].lat, acts[fullSteps].lng];
            route.push([lerp(from[0], to[0], partial), lerp(from[1], to[1], partial)]);
          }
          tourRouteRef.current.setLatLngs(route as any);

          if (p >= 92) {
            setCaption("Finalizing your itinerary…");
          } else {
            const visibleIdx = clamp(Math.ceil(exact) - 1, 0, totalActsLocal - 1);
            const current = stableActivities[visibleIdx];
            setCaption(current?.name
              ? `Adding ${current.name} (${Math.min(totalActsLocal, Math.ceil(exact))}/${totalActsLocal})`
              : `Pinning stops (${Math.min(totalActsLocal, Math.ceil(exact))}/${totalActsLocal})`);
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [mapReady, flightArc, geometryPoints.destination.lat, geometryPoints.destination.lng, geometryPoints.origin.lat, geometryPoints.origin.lng, activityNamesKey, destinationCity, stableActivities]);

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

      <p className="text-center text-sm text-muted-foreground mt-4 font-medium min-h-[1.25rem]">{caption}</p>
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
