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
