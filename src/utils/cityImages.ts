const cityImageIds: Record<string, string> = {
  dubai: "photo-1512453979798-5ea266f8880c",
  paris: "photo-1502602898657-3e91760cbb34",
  tokyo: "photo-1540959733332-eab4deabeeaf",
  bali: "photo-1537996194471-e657df975ab4",
  rome: "photo-1552832230-c0197dd311b5",
  london: "photo-1513635269975-59663e0ac1ad",
  newyork: "photo-1496442226666-8d4d0e62e6e9",
  sydney: "photo-1506973035872-a4ec16b8e8d9",
  maldives: "photo-1514282401047-d79a71a590e8",
  singapore: "photo-1525625293386-3f8f99389edd",
  barcelona: "photo-1583422409516-2895a77efded",
  amsterdam: "photo-1534351590666-13e3e96b5017",
  santorini: "photo-1570077188670-e3a8d69ac5ff",
  japan: "photo-1493976040374-85c8e12f0c0e",
  thailand: "photo-1528181304800-259b08848526",
  hawaii: "photo-1507876466758-bc54f384809c",
  default: "photo-1488646953014-85cb44e25828",
};

// Cache for real Wikimedia images fetched dynamically
const wikimediaCache: Record<string, string> = {};

export const setWikimediaImage = (city: string, url: string) => {
  wikimediaCache[city.toLowerCase().replace(/[^a-z]/g, "")] = url;
};

export const getCityImage = (
  city: string,
  width = 600,
  height = 300
): string => {
  const key = city.toLowerCase().replace(/[^a-z]/g, "");

  // Prefer real Wikimedia image if available
  if (wikimediaCache[key]) {
    return wikimediaCache[key];
  }

  const id = cityImageIds[key] || cityImageIds.default;
  return `https://images.unsplash.com/${id}?w=${width}&h=${height}&fit=crop`;
};
