// Cache for Google Places photos — the ONLY source of images
const placeImageCache: Record<string, string> = {};

export const setPlaceImage = (city: string, url: string) => {
  placeImageCache[city.toLowerCase().replace(/[^a-z]/g, "")] = url;
};

// Keep backward-compatible alias
export const setWikimediaImage = setPlaceImage;

export const getCityImage = (
  city: string,
  _width = 600,
  _height = 300
): string => {
  const key = city.toLowerCase().replace(/[^a-z]/g, "");
  return placeImageCache[key] || "";
};

export const getPlaceImages = (place: string): string[] => {
  const key = place.toLowerCase().replace(/[^a-z]/g, "");
  if (placeImageCache[key]) return [placeImageCache[key]];
  return [];
};

export const getPlaceImageLabels = (_place: string): string[] => {
  return [];
};

// Stock fallback hero photos for popular cities. Used only when Google Places
// enrichment hasn't returned images yet (so the trip hero never looks empty).
const STOCK_CITY_HEROES: Record<string, string> = {
  paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=80&auto=format&fit=crop",
  tokyo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600&q=80&auto=format&fit=crop",
  bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&q=80&auto=format&fit=crop",
  maldives: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1600&q=80&auto=format&fit=crop",
  barcelona: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1600&q=80&auto=format&fit=crop",
  dubai: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&q=80&auto=format&fit=crop",
  london: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1600&q=80&auto=format&fit=crop",
  newyork: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1600&q=80&auto=format&fit=crop",
  rome: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1600&q=80&auto=format&fit=crop",
  lisbon: "https://images.unsplash.com/photo-1580323956656-26bbb1206e34?w=1600&q=80&auto=format&fit=crop",
  amsterdam: "https://images.unsplash.com/photo-1534351590666-13e3e96c5017?w=1600&q=80&auto=format&fit=crop",
  istanbul: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1600&q=80&auto=format&fit=crop",
  bangkok: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1600&q=80&auto=format&fit=crop",
  sydney: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1600&q=80&auto=format&fit=crop",
  reykjavik: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1600&q=80&auto=format&fit=crop",
  santorini: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1600&q=80&auto=format&fit=crop",
};

const GENERIC_STOCK_HERO =
  "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1600&q=80&auto=format&fit=crop";

export const getStockCityImage = (city: string): string => {
  if (!city) return GENERIC_STOCK_HERO;
  const tokens = city.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  for (const t of tokens) {
    if (STOCK_CITY_HEROES[t]) return STOCK_CITY_HEROES[t];
  }
  const flat = city.toLowerCase().replace(/[^a-z]/g, "");
  return STOCK_CITY_HEROES[flat] || GENERIC_STOCK_HERO;
};
