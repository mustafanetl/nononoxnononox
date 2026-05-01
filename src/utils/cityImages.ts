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

// Curated, hand-picked iconic Unsplash hero photos per city. Each one is a
// landscape skyline / landmark shot so the trip hero always looks like a real
// magazine cover for that city — never a random close-up of food or a sign.
const STOCK_CITY_HEROES: Record<string, string> = {
  // Europe
  paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=2000&q=85&auto=format&fit=crop",
  london: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=2000&q=85&auto=format&fit=crop",
  rome: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=2000&q=85&auto=format&fit=crop",
  milan: "https://images.unsplash.com/photo-1520440229-6469a149ac59?w=2000&q=85&auto=format&fit=crop",
  venice: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=2000&q=85&auto=format&fit=crop",
  florence: "https://images.unsplash.com/photo-1543429776-2782fc8e1acd?w=2000&q=85&auto=format&fit=crop",
  firenze: "https://images.unsplash.com/photo-1543429776-2782fc8e1acd?w=2000&q=85&auto=format&fit=crop",
  naples: "https://images.unsplash.com/photo-1633544571030-a3ba74dfeec9?w=2000&q=85&auto=format&fit=crop",
  barcelona: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=2000&q=85&auto=format&fit=crop",
  madrid: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=2000&q=85&auto=format&fit=crop",
  seville: "https://images.unsplash.com/photo-1559682468-a6a29e7d9517?w=2000&q=85&auto=format&fit=crop",
  lisbon: "https://images.unsplash.com/photo-1580323956656-26bbb1206e34?w=2000&q=85&auto=format&fit=crop",
  porto: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=2000&q=85&auto=format&fit=crop",
  amsterdam: "https://images.unsplash.com/photo-1534351590666-13e3e96c5017?w=2000&q=85&auto=format&fit=crop",
  brussels: "https://images.unsplash.com/photo-1559113202-c916b8e44373?w=2000&q=85&auto=format&fit=crop",
  berlin: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=2000&q=85&auto=format&fit=crop",
  munich: "https://images.unsplash.com/photo-1595867818082-083862f3d630?w=2000&q=85&auto=format&fit=crop",
  munchen: "https://images.unsplash.com/photo-1595867818082-083862f3d630?w=2000&q=85&auto=format&fit=crop",
  hamburg: "https://images.unsplash.com/photo-1554072675-66db59dba46f?w=2000&q=85&auto=format&fit=crop",
  vienna: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=2000&q=85&auto=format&fit=crop",
  prague: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=2000&q=85&auto=format&fit=crop",
  budapest: "https://images.unsplash.com/photo-1551867633-194f125bddfa?w=2000&q=85&auto=format&fit=crop",
  warsaw: "https://images.unsplash.com/photo-1607427293702-036933bbf746?w=2000&q=85&auto=format&fit=crop",
  krakow: "https://images.unsplash.com/photo-1607197109166-3ab4ee30982e?w=2000&q=85&auto=format&fit=crop",
  copenhagen: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=2000&q=85&auto=format&fit=crop",
  stockholm: "https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=2000&q=85&auto=format&fit=crop",
  oslo: "https://images.unsplash.com/photo-1583425423320-eb8836b62e80?w=2000&q=85&auto=format&fit=crop",
  helsinki: "https://images.unsplash.com/photo-1559060017-445fb9722f2a?w=2000&q=85&auto=format&fit=crop",
  reykjavik: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=2000&q=85&auto=format&fit=crop",
  dublin: "https://images.unsplash.com/photo-1549918864-48ac978761a4?w=2000&q=85&auto=format&fit=crop",
  edinburgh: "https://images.unsplash.com/photo-1568740450762-22ae6dd5cabb?w=2000&q=85&auto=format&fit=crop",
  zurich: "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=2000&q=85&auto=format&fit=crop",
  geneva: "https://images.unsplash.com/photo-1589875735937-4cb83eda9990?w=2000&q=85&auto=format&fit=crop",
  athens: "https://images.unsplash.com/photo-1555993539-1732b0258235?w=2000&q=85&auto=format&fit=crop",
  santorini: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=2000&q=85&auto=format&fit=crop",
  mykonos: "https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=2000&q=85&auto=format&fit=crop",
  istanbul: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=2000&q=85&auto=format&fit=crop",
  // Americas
  newyork: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=2000&q=85&auto=format&fit=crop",
  nyc: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=2000&q=85&auto=format&fit=crop",
  losangeles: "https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=2000&q=85&auto=format&fit=crop",
  sanfrancisco: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=2000&q=85&auto=format&fit=crop",
  chicago: "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=2000&q=85&auto=format&fit=crop",
  miami: "https://images.unsplash.com/photo-1535498730771-e735b998cd64?w=2000&q=85&auto=format&fit=crop",
  seattle: "https://images.unsplash.com/photo-1502175353174-a7a1a8b66ba6?w=2000&q=85&auto=format&fit=crop",
  boston: "https://images.unsplash.com/photo-1572989919479-018ada5d6a8c?w=2000&q=85&auto=format&fit=crop",
  washington: "https://images.unsplash.com/photo-1617581629397-a72507c3de9e?w=2000&q=85&auto=format&fit=crop",
  lasvegas: "https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?w=2000&q=85&auto=format&fit=crop",
  neworleans: "https://images.unsplash.com/photo-1571893544028-06b07af6dade?w=2000&q=85&auto=format&fit=crop",
  toronto: "https://images.unsplash.com/photo-1517090504586-fde19ea6066f?w=2000&q=85&auto=format&fit=crop",
  vancouver: "https://images.unsplash.com/photo-1559511260-66a654ae982a?w=2000&q=85&auto=format&fit=crop",
  montreal: "https://images.unsplash.com/photo-1519178614-68673b201f36?w=2000&q=85&auto=format&fit=crop",
  mexicocity: "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=2000&q=85&auto=format&fit=crop",
  cancun: "https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=2000&q=85&auto=format&fit=crop",
  havana: "https://images.unsplash.com/photo-1500759285222-a95626b934cb?w=2000&q=85&auto=format&fit=crop",
  rio: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=2000&q=85&auto=format&fit=crop",
  riodejaneiro: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=2000&q=85&auto=format&fit=crop",
  saopaulo: "https://images.unsplash.com/photo-1543059080-f9b1272213d5?w=2000&q=85&auto=format&fit=crop",
  buenosaires: "https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=2000&q=85&auto=format&fit=crop",
  // Asia
  tokyo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=2000&q=85&auto=format&fit=crop",
  kyoto: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=2000&q=85&auto=format&fit=crop",
  osaka: "https://images.unsplash.com/photo-1590559899731-a382839e5549?w=2000&q=85&auto=format&fit=crop",
  seoul: "https://images.unsplash.com/photo-1538485399081-7c8970e76ee5?w=2000&q=85&auto=format&fit=crop",
  beijing: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=2000&q=85&auto=format&fit=crop",
  shanghai: "https://images.unsplash.com/photo-1538428494232-9c0d8a3ab403?w=2000&q=85&auto=format&fit=crop",
  hongkong: "https://images.unsplash.com/photo-1536599524557-5f784dd53282?w=2000&q=85&auto=format&fit=crop",
  taipei: "https://images.unsplash.com/photo-1470004914212-05527e49370b?w=2000&q=85&auto=format&fit=crop",
  singapore: "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=2000&q=85&auto=format&fit=crop",
  bangkok: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=2000&q=85&auto=format&fit=crop",
  phuket: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=2000&q=85&auto=format&fit=crop",
  bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=2000&q=85&auto=format&fit=crop",
  jakarta: "https://images.unsplash.com/photo-1555899434-94d1368aa7af?w=2000&q=85&auto=format&fit=crop",
  kualalumpur: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=2000&q=85&auto=format&fit=crop",
  manila: "https://images.unsplash.com/photo-1518509562904-e7ef99cddc85?w=2000&q=85&auto=format&fit=crop",
  hochiminhcity: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=2000&q=85&auto=format&fit=crop",
  hanoi: "https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=2000&q=85&auto=format&fit=crop",
  delhi: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=2000&q=85&auto=format&fit=crop",
  newdelhi: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=2000&q=85&auto=format&fit=crop",
  mumbai: "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=2000&q=85&auto=format&fit=crop",
  jaipur: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=2000&q=85&auto=format&fit=crop",
  // Middle East / Africa
  dubai: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=2000&q=85&auto=format&fit=crop",
  abudhabi: "https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=2000&q=85&auto=format&fit=crop",
  doha: "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=2000&q=85&auto=format&fit=crop",
  telaviv: "https://images.unsplash.com/photo-1544973503-5fed14ec1f1d?w=2000&q=85&auto=format&fit=crop",
  jerusalem: "https://images.unsplash.com/photo-1544970503-7ad532b1f55b?w=2000&q=85&auto=format&fit=crop",
  cairo: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=2000&q=85&auto=format&fit=crop",
  marrakech: "https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=2000&q=85&auto=format&fit=crop",
  casablanca: "https://images.unsplash.com/photo-1577644923446-fcab1d27f5ec?w=2000&q=85&auto=format&fit=crop",
  capetown: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=2000&q=85&auto=format&fit=crop",
  // Oceania / island
  sydney: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=2000&q=85&auto=format&fit=crop",
  melbourne: "https://images.unsplash.com/photo-1514395462725-fb4566210144?w=2000&q=85&auto=format&fit=crop",
  auckland: "https://images.unsplash.com/photo-1595203468021-9a229dab5c80?w=2000&q=85&auto=format&fit=crop",
  maldives: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=2000&q=85&auto=format&fit=crop",
  hawaii: "https://images.unsplash.com/photo-1542259009477-d625272157b7?w=2000&q=85&auto=format&fit=crop",
  honolulu: "https://images.unsplash.com/photo-1542259009477-d625272157b7?w=2000&q=85&auto=format&fit=crop",
};

// Pool of generic but beautiful skyline/landscape shots; we pick one
// deterministically based on the city name so unknown cities still get a
// stable, high-quality hero (instead of cycling on every render).
const GENERIC_HERO_POOL = [
  "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=2000&q=85&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=2000&q=85&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=2000&q=85&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1493558103817-58b2924bce98?w=2000&q=85&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=2000&q=85&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=2000&q=85&auto=format&fit=crop",
];

const hashCity = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

const normalizeCityKey = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");

export const getStockCityImage = (city: string): string => {
  if (!city) return GENERIC_HERO_POOL[0];
  // 1) Exact (normalized) match
  const flat = normalizeCityKey(city);
  if (STOCK_CITY_HEROES[flat]) return STOCK_CITY_HEROES[flat];
  // 2) Token match (e.g. "Paris, France" -> "paris")
  const tokens = city.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  for (const t of tokens) {
    if (STOCK_CITY_HEROES[t]) return STOCK_CITY_HEROES[t];
  }
  // 3) Deterministic fallback from the curated generic pool
  return GENERIC_HERO_POOL[hashCity(flat || city.toLowerCase()) % GENERIC_HERO_POOL.length];
};
