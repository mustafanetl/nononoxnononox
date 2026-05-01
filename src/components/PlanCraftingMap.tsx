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
const DEFAULT_DESTINATION = { lat: 20, lng: 0 };
const ACTIVITY_OFFSETS = [
  { lat: 0.012, lng: 0.010 },
  { lat: -0.008, lng: 0.018 },
  { lat: 0.016, lng: -0.009 },
  { lat: -0.014, lng: -0.012 },
  { lat: 0.005, lng: -0.020 },
];

// Lightweight built-in geocoder for common origin cities so the plane doesn't
// always launch from London when the user's home city is something else.
// Keys are normalized: lowercase, no diacritics, trimmed.
const KNOWN_CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "stockholm": { lat: 59.3293, lng: 18.0686 },
  "gothenburg": { lat: 57.7089, lng: 11.9746 },
  "goteborg": { lat: 57.7089, lng: 11.9746 },
  "malmo": { lat: 55.6050, lng: 13.0038 },
  "oslo": { lat: 59.9139, lng: 10.7522 },
  "copenhagen": { lat: 55.6761, lng: 12.5683 },
  "kobenhavn": { lat: 55.6761, lng: 12.5683 },
  "helsinki": { lat: 60.1699, lng: 24.9384 },
  "reykjavik": { lat: 64.1466, lng: -21.9426 },
  "london": { lat: 51.5074, lng: -0.1278 },
  "manchester": { lat: 53.4808, lng: -2.2426 },
  "edinburgh": { lat: 55.9533, lng: -3.1883 },
  "dublin": { lat: 53.3498, lng: -6.2603 },
  "paris": { lat: 48.8566, lng: 2.3522 },
  "lyon": { lat: 45.7640, lng: 4.8357 },
  "marseille": { lat: 43.2965, lng: 5.3698 },
  "nice": { lat: 43.7102, lng: 7.2620 },
  "amsterdam": { lat: 52.3676, lng: 4.9041 },
  "rotterdam": { lat: 51.9244, lng: 4.4777 },
  "brussels": { lat: 50.8503, lng: 4.3517 },
  "berlin": { lat: 52.5200, lng: 13.4050 },
  "munich": { lat: 48.1351, lng: 11.5820 },
  "munchen": { lat: 48.1351, lng: 11.5820 },
  "hamburg": { lat: 53.5511, lng: 9.9937 },
  "frankfurt": { lat: 50.1109, lng: 8.6821 },
  "cologne": { lat: 50.9375, lng: 6.9603 },
  "vienna": { lat: 48.2082, lng: 16.3738 },
  "wien": { lat: 48.2082, lng: 16.3738 },
  "zurich": { lat: 47.3769, lng: 8.5417 },
  "geneva": { lat: 46.2044, lng: 6.1432 },
  "prague": { lat: 50.0755, lng: 14.4378 },
  "warsaw": { lat: 52.2297, lng: 21.0122 },
  "krakow": { lat: 50.0647, lng: 19.9450 },
  "budapest": { lat: 47.4979, lng: 19.0402 },
  "rome": { lat: 41.9028, lng: 12.4964 },
  "milan": { lat: 45.4642, lng: 9.1900 },
  "venice": { lat: 45.4408, lng: 12.3155 },
  "florence": { lat: 43.7696, lng: 11.2558 },
  "firenze": { lat: 43.7696, lng: 11.2558 },
  "naples": { lat: 40.8518, lng: 14.2681 },
  "madrid": { lat: 40.4168, lng: -3.7038 },
  "barcelona": { lat: 41.3851, lng: 2.1734 },
  "valencia": { lat: 39.4699, lng: -0.3763 },
  "seville": { lat: 37.3891, lng: -5.9845 },
  "lisbon": { lat: 38.7223, lng: -9.1393 },
  "porto": { lat: 41.1579, lng: -8.6291 },
  "athens": { lat: 37.9838, lng: 23.7275 },
  "istanbul": { lat: 41.0082, lng: 28.9784 },
  "moscow": { lat: 55.7558, lng: 37.6173 },
  "saint petersburg": { lat: 59.9311, lng: 30.3609 },
  "kyiv": { lat: 50.4501, lng: 30.5234 },
  "kiev": { lat: 50.4501, lng: 30.5234 },
  "bucharest": { lat: 44.4268, lng: 26.1025 },
  "sofia": { lat: 42.6977, lng: 23.3219 },
  "new york": { lat: 40.7128, lng: -74.0060 },
  "nyc": { lat: 40.7128, lng: -74.0060 },
  "los angeles": { lat: 34.0522, lng: -118.2437 },
  "san francisco": { lat: 37.7749, lng: -122.4194 },
  "chicago": { lat: 41.8781, lng: -87.6298 },
  "miami": { lat: 25.7617, lng: -80.1918 },
  "seattle": { lat: 47.6062, lng: -122.3321 },
  "boston": { lat: 42.3601, lng: -71.0589 },
  "washington": { lat: 38.9072, lng: -77.0369 },
  "atlanta": { lat: 33.7490, lng: -84.3880 },
  "dallas": { lat: 32.7767, lng: -96.7970 },
  "houston": { lat: 29.7604, lng: -95.3698 },
  "denver": { lat: 39.7392, lng: -104.9903 },
  "las vegas": { lat: 36.1699, lng: -115.1398 },
  "toronto": { lat: 43.6532, lng: -79.3832 },
  "vancouver": { lat: 49.2827, lng: -123.1207 },
  "montreal": { lat: 45.5017, lng: -73.5673 },
  "mexico city": { lat: 19.4326, lng: -99.1332 },
  "buenos aires": { lat: -34.6037, lng: -58.3816 },
  "sao paulo": { lat: -23.5505, lng: -46.6333 },
  "rio de janeiro": { lat: -22.9068, lng: -43.1729 },
  "lima": { lat: -12.0464, lng: -77.0428 },
  "santiago": { lat: -33.4489, lng: -70.6693 },
  "bogota": { lat: 4.7110, lng: -74.0721 },
  "tokyo": { lat: 35.6762, lng: 139.6503 },
  "osaka": { lat: 34.6937, lng: 135.5023 },
  "kyoto": { lat: 35.0116, lng: 135.7681 },
  "seoul": { lat: 37.5665, lng: 126.9780 },
  "beijing": { lat: 39.9042, lng: 116.4074 },
  "shanghai": { lat: 31.2304, lng: 121.4737 },
  "hong kong": { lat: 22.3193, lng: 114.1694 },
  "taipei": { lat: 25.0330, lng: 121.5654 },
  "singapore": { lat: 1.3521, lng: 103.8198 },
  "bangkok": { lat: 13.7563, lng: 100.5018 },
  "kuala lumpur": { lat: 3.1390, lng: 101.6869 },
  "jakarta": { lat: -6.2088, lng: 106.8456 },
  "manila": { lat: 14.5995, lng: 120.9842 },
  "ho chi minh city": { lat: 10.8231, lng: 106.6297 },
  "hanoi": { lat: 21.0285, lng: 105.8542 },
  "delhi": { lat: 28.7041, lng: 77.1025 },
  "new delhi": { lat: 28.6139, lng: 77.2090 },
  "mumbai": { lat: 19.0760, lng: 72.8777 },
  "bangalore": { lat: 12.9716, lng: 77.5946 },
  "bengaluru": { lat: 12.9716, lng: 77.5946 },
  "dubai": { lat: 25.2048, lng: 55.2708 },
  "abu dhabi": { lat: 24.4539, lng: 54.3773 },
  "doha": { lat: 25.2854, lng: 51.5310 },
  "riyadh": { lat: 24.7136, lng: 46.6753 },
  "tel aviv": { lat: 32.0853, lng: 34.7818 },
  "jerusalem": { lat: 31.7683, lng: 35.2137 },
  "cairo": { lat: 30.0444, lng: 31.2357 },
  "casablanca": { lat: 33.5731, lng: -7.5898 },
  "marrakech": { lat: 31.6295, lng: -7.9811 },
  "cape town": { lat: -33.9249, lng: 18.4241 },
  "johannesburg": { lat: -26.2041, lng: 28.0473 },
  "nairobi": { lat: -1.2921, lng: 36.8219 },
  "lagos": { lat: 6.5244, lng: 3.3792 },
  "sydney": { lat: -33.8688, lng: 151.2093 },
  "melbourne": { lat: -37.8136, lng: 144.9631 },
  "brisbane": { lat: -27.4698, lng: 153.0251 },
  "auckland": { lat: -36.8485, lng: 174.7633 },
  "baghdad": { lat: 33.3152, lng: 44.3661 },
};

const normalizeCityKey = (s: string) =>
  s.trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[,.;].*$/, "") // drop everything after first comma (e.g. "Paris, France")
    .replace(/\s+/g, " ").trim();

const lookupCityCoords = (name: string): { lat: number; lng: number } | null => {
  const key = normalizeCityKey(name);
  if (!key) return null;
  if (KNOWN_CITY_COORDS[key]) return KNOWN_CITY_COORDS[key];
  // try first token (e.g. "Stockholm Arlanda" -> "stockholm")
  const first = key.split(" ")[0];
  if (first && KNOWN_CITY_COORDS[first]) return KNOWN_CITY_COORDS[first];
  return null;
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Bearing in degrees from point A to point B (0 = north, 90 = east)
const bearingDeg = (a: [number, number], b: [number, number]) => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const dLng = toRad(b[1] - a[1]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "•";

const hashCoords = (input: string, fallback: { lat: number; lng: number }, spread?: { lat: number; lng: number }) => {
  const source = input.trim().toLowerCase();
  if (!source) return fallback;
  let hash = 0;
  for (let i = 0; i < source.length; i++) hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  const latSpread = spread?.lat ?? 0.08;
  const lngSpread = spread?.lng ?? 0.11;
  const latOffset = (((hash % 2000) / 1999) * 2 - 1) * latSpread;
  const lngOffset = (((((hash / 2000) | 0) % 4000) / 3999) * 2 - 1) * lngSpread;
  return { lat: fallback.lat + latOffset, lng: fallback.lng + lngOffset };
};

const buildPoints = (
  originCity: string,
  destinationCity: string,
  destinationPhoto: string | undefined,
  destinationGeo: CraftGeo | undefined,
  activities: CraftActivity[]
) => {
  // Prefer a real lookup over hashing so the plane actually launches from the
  // user's home city (Stockholm, NYC, Tokyo…) instead of always around London.
  const originLookup = lookupCityCoords(originCity);
  const origin = originLookup
    ? { ...originLookup }
    // For unknown origins, spread globally instead of jittering around London.
    : hashCoords(originCity, { lat: 20, lng: 0 }, { lat: 50, lng: 140 });
  const destinationLookup = !destinationGeo ? lookupCityCoords(destinationCity) : null;
  const destination =
    destinationGeo ||
    destinationLookup ||
    hashCoords(destinationCity, DEFAULT_DESTINATION, { lat: 50, lng: 140 });
  const activityPoints = activities.slice(0, 5).map((activity, index) => {
    const offset = ACTIVITY_OFFSETS[index] || ACTIVITY_OFFSETS[ACTIVITY_OFFSETS.length - 1];
    const lngScale = Math.max(0.45, Math.cos((destination.lat * Math.PI) / 180));
    return {
      lat: destination.lat + offset.lat,
      lng: destination.lng + offset.lng / lngScale,
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
  const lastTickRef = useRef<number | null>(null);
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
  // Avoid re-rendering on every rAF frame: only push captions to React state
  // when the text actually changes.
  const lastCaptionRef = useRef("");
  const setCaptionThrottled = (text: string) => {
    if (text === lastCaptionRef.current) return;
    lastCaptionRef.current = text;
    setCaption(text);
  };

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
          html: `<div class="plan-plane-icon" style="width:40px;height:40px;border-radius:9999px;background:hsl(var(--foreground));color:hsl(var(--background));display:flex;align-items:center;justify-content:center;box-shadow:0 12px 30px rgba(0,0,0,0.28);border:2px solid hsl(var(--background));will-change:transform;"><div class="plan-plane-rot" style="width:20px;height:20px;display:flex;align-items:center;justify-content:center;transform:rotate(0deg);transition:transform 180ms linear;will-change:transform;"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" stroke="none"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16z" transform="rotate(-45 12 12)"/></svg></div></div>`,
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
      // Wait for the first tiles to paint before starting the rAF loop —
      // otherwise the first 200-400ms of animation runs while tiles are still
      // loading, which looks like a stutter/lag at the very start.
      const ready = () => { if (!disposed) setMapReady(true); };
      let readyFired = false;
      const fire = () => { if (readyFired) return; readyFired = true; ready(); };
      tileLayerRef.current?.once?.("load", fire);
      // Hard fallback in case "load" never fires (cached tiles, offline, etc.)
      setTimeout(fire, 600);
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

  // Precompute flight + city target views whenever geometry changes (NOT every frame)
  useEffect(() => {
    if (!mapReady || !mapRef.current || !LRef.current) return;
    const L = LRef.current;
    const map = mapRef.current;

    const flightBounds = L.latLngBounds([
      [geometryPoints.origin.lat, geometryPoints.origin.lng],
      [geometryPoints.destination.lat, geometryPoints.destination.lng],
    ]);
    const flightFit = (map as any)._getBoundsCenterZoom
      ? (map as any)._getBoundsCenterZoom(flightBounds, { padding: [60, 60], maxZoom: 5 })
      : { center: flightBounds.getCenter(), zoom: 4 };
    flightViewRef.current = {
      center: [flightFit.center.lat, flightFit.center.lng],
      zoom: clamp(flightFit.zoom ?? 4, 2, 5),
    };

    const acts = geometryPoints.activities;
    const cityPts: [number, number][] = [
      [geometryPoints.destination.lat, geometryPoints.destination.lng],
      ...acts.map((a) => [a.lat, a.lng] as [number, number]),
    ];
    const cityBounds = L.latLngBounds(cityPts as any);
    const cityFit = (map as any)._getBoundsCenterZoom
      ? (map as any)._getBoundsCenterZoom(cityBounds, { padding: [60, 60], maxZoom: 14 })
      : { center: cityBounds.getCenter(), zoom: 13 };
    cityViewRef.current = {
      center: [cityFit.center.lat, cityFit.center.lng],
      zoom: clamp(cityFit.zoom ?? 13, 11, 14),
    };

    // Reset transition guard if geometry changed mid-flight
    flyStartedRef.current = false;
  }, [
    mapReady,
    geometryPoints.origin.lat,
    geometryPoints.origin.lng,
    geometryPoints.destination.lat,
    geometryPoints.destination.lng,
    activityNamesKey,
  ]);

  // Single rAF loop drives EVERYTHING — smooth interpolation toward target
  useEffect(() => {
    if (!mapReady || !mapRef.current || !planeMarkerRef.current || !flightRouteRef.current || !tourRouteRef.current || !LRef.current) return;
    const L = LRef.current;
    const map = mapRef.current;

    const tick = () => {
      // Time-based exponential smoothing — frame-rate independent, no jitter
      const now = performance.now();
      const lastT = (lastTickRef.current ?? now);
      const dt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000)); // clamp dt to 1–50ms
      lastTickRef.current = now;
      const target = targetProgressRef.current;
      const current = displayedProgressRef.current;
      const diff = target - current;
      const absDiff = Math.abs(diff);
      // Half-life smoothing: ~180ms when far, ~320ms when close
      const halfLife = absDiff > 5 ? 0.18 : 0.32;
      const alpha = 1 - Math.pow(0.5, dt / halfLife);
      const next = absDiff < 0.01 ? target : current + diff * alpha;
      displayedProgressRef.current = next;

      const p = next;
      const flightView = flightViewRef.current;
      const cityView = cityViewRef.current;
      const acts = geometryPoints.activities;

      // === PHASE 1: Flight (0 -> P_FLIGHT_END) ===
      if (p < P_FLIGHT_END) {
        if (phaseRef.current !== 1) {
          phaseRef.current = 1;
          flyStartedRef.current = false;
          // Snap to the world flight view immediately so the first frame isn't half-zoomed
          if (flightView) {
            try { (map as any).stop?.(); } catch {}
            map.setView(flightView.center, flightView.zoom, { animate: false });
            currentViewRef.current = { ...flightView };
          }
        }
        const t = easeInOut(clamp(p / P_FLIGHT_END, 0, 1));
        const { traveled, position } = sliceArc(flightArc, t);
        flightRouteRef.current.setLatLngs(traveled as any);
        tourRouteRef.current.setLatLngs([] as any);
        planeMarkerRef.current.setLatLng(position);
        planeMarkerRef.current.setOpacity(1);
        // Rotate plane to face flight direction
        {
          const scaled = clamp(t, 0, 1) * (flightArc.length - 1);
          const i = Math.min(Math.floor(scaled), flightArc.length - 2);
          const ahead = flightArc[Math.min(i + 2, flightArc.length - 1)];
          const bearing = bearingDeg(position, ahead);
          const el = (planeMarkerRef.current as any)?.getElement?.();
          const rot = el?.querySelector?.(".plan-plane-rot") as HTMLElement | null;
          if (rot) rot.style.transform = `rotate(${bearing}deg)`;
        }
        if (destinationMarkerRef.current) {
          const fadeIn = clamp((t - 0.85) / 0.15, 0, 1);
          destinationMarkerRef.current.setOpacity(fadeIn);
        }
        pointMarkersRef.current.forEach((m) => m.setOpacity(0));
        setCaption(`Plotting your route to ${destinationCity || "your destination"}…`);
      }
      // === PHASE 2: Cinematic flyTo into the city ===
      else if (p < P_ZOOM_END) {
        const t = clamp((p - P_FLIGHT_END) / (P_ZOOM_END - P_FLIGHT_END), 0, 1);
        flightRouteRef.current.setLatLngs(flightArc as any);
        planeMarkerRef.current.setLatLng(flightArc[flightArc.length - 1]);
        planeMarkerRef.current.setOpacity(clamp(1 - t * 1.5, 0, 1));
        if (destinationMarkerRef.current) destinationMarkerRef.current.setOpacity(1);
        pointMarkersRef.current.forEach((m) => m.setOpacity(0));
        tourRouteRef.current.setLatLngs([] as any);

        // Kick off ONE flyTo with parabolic easing — Leaflet handles all in-between frames
        if (phaseRef.current !== 2) {
          phaseRef.current = 2;
          flyStartedRef.current = false;
        }
        if (!flyStartedRef.current && cityView) {
          flyStartedRef.current = true;
          try {
            map.flyTo(cityView.center, cityView.zoom, {
              duration: 1.8,
              easeLinearity: 0.3,
              animate: true,
              noMoveStart: true,
            });
          } catch {
            map.setView(cityView.center, cityView.zoom, { animate: false });
          }
          currentViewRef.current = { ...cityView };
        }
        setCaption(`Touching down in ${destinationCity || "your destination"}…`);
      }
      // === PHASE 3: City tour — pins & dashed route reveal ===
      else {
        if (phaseRef.current !== 3) {
          phaseRef.current = 3;
        }
        flightRouteRef.current.setLatLngs([] as any);
        if (destinationMarkerRef.current) destinationMarkerRef.current.setOpacity(1);
        planeMarkerRef.current.setOpacity(0);

        // Snap to city view ONLY if Leaflet's flyTo isn't currently animating
        if (cityView && !(map as any)._animatingZoom) {
          const cur = currentViewRef.current;
          if (!cur ||
              Math.abs(cur.zoom - cityView.zoom) > 0.05 ||
              Math.abs(cur.center[0] - cityView.center[0]) > 0.0005 ||
              Math.abs(cur.center[1] - cityView.center[1]) > 0.0005) {
            map.setView(cityView.center, cityView.zoom, { animate: false });
            currentViewRef.current = { ...cityView };
          }
        }

        const tourT = clamp((p - P_ZOOM_END) / (P_TOUR_END - P_ZOOM_END), 0, 1);
        const totalActsLocal = acts.length;
        if (totalActsLocal === 0) {
          tourRouteRef.current.setLatLngs([] as any);
          setCaption(p >= 92 ? "Wrapping up your itinerary…" : `Scouting the best spots in ${destinationCity || "the city"}…`);
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
            setCaption("Polishing your itinerary…");
          } else {
            const visibleIdx = clamp(Math.ceil(exact) - 1, 0, totalActsLocal - 1);
            const current = stableActivities[visibleIdx];
            setCaption(current?.name
              ? `Adding ${current.name}  ·  ${Math.min(totalActsLocal, Math.ceil(exact))}/${totalActsLocal}`
              : `Pinning your stops  ·  ${Math.min(totalActsLocal, Math.ceil(exact))}/${totalActsLocal}`);
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
