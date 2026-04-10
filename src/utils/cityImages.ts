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
  istanbul: "photo-1541432901042-2d8bd64b4a9b",
  seoul: "photo-1534274988757-a28bf1a57c17",
  lisbon: "photo-1536663815808-535e2280d2c2",
  marrakech: "photo-1489749798305-4fea3ae63d43",
  cairo: "photo-1572252009286-268acec5ca0a",
  prague: "photo-1519677100203-a0e668c92439",
  vienna: "photo-1516550893923-42d28e5677af",
  berlin: "photo-1560969184-10fe8719e047",
  budapest: "photo-1551867633-194f125bddfa",
  athens: "photo-1555993539-1732b0258235",
  miami: "photo-1533106418989-88406c7cc8ca",
  losangeles: "photo-1534190760961-74e8c1c5c3da",
  capetown: "photo-1580060839134-75a5edca2e99",
  kyoto: "photo-1493976040374-85c8e12f0c0e",
  cancun: "photo-1510097467424-192d713fd8b2",
  phuket: "photo-1589394815804-964ed0be2eb5",
  default: "photo-1488646953014-85cb44e25828",
};

// Multi-image sets per destination for visual discovery carousel
export const cityImageSets: Record<string, { id: string; label: string }[]> = {
  dubai: [
    { id: "photo-1512453979798-5ea266f8880c", label: "Skyline" },
    { id: "photo-1518684079-3c830dcef090", label: "Desert" },
    { id: "photo-1582672060674-bc2bd808a8b5", label: "Marina" },
    { id: "photo-1597659840241-37e2b9c2f55f", label: "Souks" },
  ],
  paris: [
    { id: "photo-1502602898657-3e91760cbb34", label: "Eiffel Tower" },
    { id: "photo-1499856871958-5b9627545d1a", label: "Louvre" },
    { id: "photo-1550340499-a6c60fc8287c", label: "Café culture" },
    { id: "photo-1431274172761-fca41d930114", label: "Seine River" },
  ],
  tokyo: [
    { id: "photo-1540959733332-eab4deabeeaf", label: "Shibuya" },
    { id: "photo-1536098561742-ca998e48cbcc", label: "Temples" },
    { id: "photo-1551641506-ee5bf4cb45f1", label: "Street food" },
    { id: "photo-1542051841857-5f90071e7989", label: "Neon lights" },
  ],
  bali: [
    { id: "photo-1537996194471-e657df975ab4", label: "Rice terraces" },
    { id: "photo-1573790387438-4da905039392", label: "Beach" },
    { id: "photo-1555400038-63f5ba517a47", label: "Temple" },
    { id: "photo-1544644181-1484b3fdfc62", label: "Sunset" },
  ],
  rome: [
    { id: "photo-1552832230-c0197dd311b5", label: "Colosseum" },
    { id: "photo-1531572753322-ad063cecc140", label: "Trevi Fountain" },
    { id: "photo-1515542622106-78bda8ba0e5b", label: "Pasta & wine" },
    { id: "photo-1529260830199-42c24126f198", label: "Streets" },
  ],
  london: [
    { id: "photo-1513635269975-59663e0ac1ad", label: "Big Ben" },
    { id: "photo-1520986606214-8b456906c813", label: "Tower Bridge" },
    { id: "photo-1533929736458-ca588d08c8be", label: "Pubs" },
    { id: "photo-1486299267070-83823f5448dd", label: "Thames" },
  ],
  newyork: [
    { id: "photo-1496442226666-8d4d0e62e6e9", label: "Manhattan" },
    { id: "photo-1534430480872-3498386e7856", label: "Brooklyn Bridge" },
    { id: "photo-1485871981521-5b1fd3805eee", label: "Times Square" },
    { id: "photo-1522083165195-3424ed14428d", label: "Central Park" },
  ],
  sydney: [
    { id: "photo-1506973035872-a4ec16b8e8d9", label: "Opera House" },
    { id: "photo-1524293581917-878a6d017c71", label: "Bondi Beach" },
    { id: "photo-1506973035872-a4ec16b8e8d9", label: "Harbour" },
  ],
  maldives: [
    { id: "photo-1514282401047-d79a71a590e8", label: "Overwater villa" },
    { id: "photo-1573843981267-be1999ff37cd", label: "Crystal water" },
    { id: "photo-1540202404-a2f29016b523", label: "Sunset" },
  ],
  singapore: [
    { id: "photo-1525625293386-3f8f99389edd", label: "Marina Bay" },
    { id: "photo-1508964942454-1a56f76e6b58", label: "Gardens" },
    { id: "photo-1565967511849-76a60a516170", label: "Hawker food" },
  ],
  barcelona: [
    { id: "photo-1583422409516-2895a77efded", label: "Sagrada Familia" },
    { id: "photo-1523531294919-4bcd7c65e216", label: "Park Güell" },
    { id: "photo-1562883676-8c7feb83f09b", label: "La Rambla" },
    { id: "photo-1558642452-9d2a7deb7f62", label: "Beach" },
  ],
  amsterdam: [
    { id: "photo-1534351590666-13e3e96b5017", label: "Canals" },
    { id: "photo-1576924542622-772281b13aa8", label: "Bikes" },
    { id: "photo-1583037189850-1921ae7c6c22", label: "Tulips" },
  ],
  santorini: [
    { id: "photo-1570077188670-e3a8d69ac5ff", label: "Blue domes" },
    { id: "photo-1613395877344-13d4a8e0d49e", label: "Sunset" },
    { id: "photo-1580502304784-8985b7eb7260", label: "Caldera view" },
  ],
  istanbul: [
    { id: "photo-1541432901042-2d8bd64b4a9b", label: "Blue Mosque" },
    { id: "photo-1524231757912-21f4fe3a7200", label: "Bosphorus" },
    { id: "photo-1527838832700-5059252407fa", label: "Grand Bazaar" },
  ],
  thailand: [
    { id: "photo-1528181304800-259b08848526", label: "Temples" },
    { id: "photo-1504214208698-ea1916a2195a", label: "Islands" },
    { id: "photo-1559592413-7cec4d0cae2b", label: "Street food" },
  ],
  hawaii: [
    { id: "photo-1507876466758-bc54f384809c", label: "Beach" },
    { id: "photo-1542259009477-d625272157b7", label: "Volcano" },
    { id: "photo-1505852679233-d9fd70aff56d", label: "Surfing" },
  ],
  seoul: [
    { id: "photo-1534274988757-a28bf1a57c17", label: "Skyline" },
    { id: "photo-1583167616082-b5d1deb781c0", label: "Palaces" },
    { id: "photo-1517154421773-0529f29ea451", label: "Street food" },
  ],
  lisbon: [
    { id: "photo-1536663815808-535e2280d2c2", label: "Trams" },
    { id: "photo-1548707309-dcebeab426c8", label: "Tiles" },
    { id: "photo-1555881400-74d7acaacd8b", label: "Pastéis de nata" },
  ],
  marrakech: [
    { id: "photo-1489749798305-4fea3ae63d43", label: "Souks" },
    { id: "photo-1539020140153-e479b8c22e70", label: "Riads" },
    { id: "photo-1587974928442-77dc3e0748b1", label: "Medina" },
  ],
};

// Cache for Google Places photos or other real images
const placeImageCache: Record<string, string> = {};

export const setPlaceImage = (city: string, url: string) => {
  placeImageCache[city.toLowerCase().replace(/[^a-z]/g, "")] = url;
};

// Keep backward-compatible alias
export const setWikimediaImage = setPlaceImage;

export const getCityImage = (
  city: string,
  width = 600,
  height = 300
): string => {
  const key = city.toLowerCase().replace(/[^a-z]/g, "");

  // Prefer real Google Places image if available
  if (placeImageCache[key]) {
    return placeImageCache[key];
  }

  const id = cityImageIds[key] || cityImageIds.default;
  return `https://images.unsplash.com/${id}?w=${width}&h=${height}&fit=crop`;
};

export const getPlaceImages = (place: string): string[] => {
  const key = place.toLowerCase().replace(/[^a-z]/g, "");
  const set = cityImageSets[key];
  if (set) {
    return set.map((img) => `https://images.unsplash.com/${img.id}?w=600&h=400&fit=crop`);
  }
  // Fallback: return the single default image
  const id = cityImageIds[key] || cityImageIds.default;
  return [`https://images.unsplash.com/${id}?w=600&h=400&fit=crop`];
};

export const getPlaceImageLabels = (place: string): string[] => {
  const key = place.toLowerCase().replace(/[^a-z]/g, "");
  const set = cityImageSets[key];
  return set ? set.map((img) => img.label) : [];
};
