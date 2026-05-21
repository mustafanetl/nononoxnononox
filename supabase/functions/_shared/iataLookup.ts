/**
 * IATA code lookup — maps city names to airport codes.
 * Used by enrich-pricing to resolve origin/destination for Travelpayouts API.
 */

const IATA_MAP: Record<string, string> = {
  // Western Europe
  "amsterdam": "AMS", "barcelona": "BCN", "berlin": "BER", "brussels": "BRU",
  "copenhagen": "CPH", "dublin": "DUB", "edinburgh": "EDI", "florence": "FLR",
  "hamburg": "HAM", "helsinki": "HEL", "lisbon": "LIS", "london": "LHR",
  "madrid": "MAD", "malaga": "AGP", "marseille": "MRS", "milan": "MXP",
  "munich": "MUC", "naples": "NAP", "nice": "NCE", "oslo": "OSL",
  "paris": "CDG", "porto": "OPO", "prague": "PRG", "rome": "FCO",
  "seville": "SVQ", "stockholm": "ARN", "venice": "VCE", "vienna": "VIE",
  "zurich": "ZRH", "athens": "ATH", "budapest": "BUD", "dubrovnik": "DBV",
  "krakow": "KRK", "warsaw": "WAW", "split": "SPU", "gothenburg": "GOT",
  "rotterdam": "RTM", "lyon": "LYS", "bologna": "BLQ", "palermo": "PMO",
  "geneva": "GVA", "salzburg": "SZG", "mallorca": "PMI", "palma": "PMI",
  "ibiza": "IBZ", "tenerife": "TFS", "reykjavik": "KEF", "bergen": "BGO",
  "tallinn": "TLL", "riga": "RIX", "vilnius": "VNO", "belgrade": "BEG",
  "bucharest": "OTP", "sofia": "SOF", "istanbul": "IST", "antalya": "AYT",
  "birmingham": "BHX", "manchester": "MAN", "glasgow": "GLA",
  // Asia
  "tokyo": "NRT", "kyoto": "KIX", "osaka": "KIX", "bangkok": "BKK",
  "chiang mai": "CNX", "singapore": "SIN", "kuala lumpur": "KUL",
  "hong kong": "HKG", "seoul": "ICN", "busan": "PUS", "hanoi": "HAN",
  "ho chi minh city": "SGN", "bali": "DPS", "taipei": "TPE",
  "dubai": "DXB", "abu dhabi": "AUH", "mumbai": "BOM", "delhi": "DEL",
  "goa": "GOI", "jaipur": "JAI", "phuket": "HKT", "doha": "DOH",
  "muscat": "MCT", "amman": "AMM", "beirut": "BEY", "tel aviv": "TLV",
  "beijing": "PEK", "shanghai": "PVG", "colombo": "CMB",
  "kathmandu": "KTM", "phnom penh": "PNH", "siem reap": "REP",
  // Africa
  "marrakech": "RAK", "casablanca": "CMN", "cairo": "CAI",
  "nairobi": "NBO", "cape town": "CPT", "johannesburg": "JNB",
  "accra": "ACC", "dakar": "DSS", "lagos": "LOS", "addis ababa": "ADD",
  "zanzibar": "ZNZ", "tunis": "TUN", "algiers": "ALG",
  // Americas
  "new york": "JFK", "los angeles": "LAX", "miami": "MIA",
  "san francisco": "SFO", "chicago": "ORD", "boston": "BOS",
  "washington": "IAD", "toronto": "YYZ", "vancouver": "YVR",
  "montreal": "YUL", "mexico city": "MEX", "cancun": "CUN",
  "buenos aires": "EZE", "rio de janeiro": "GIG", "sao paulo": "GRU",
  "bogota": "BOG", "lima": "LIM", "santiago": "SCL",
  "medellin": "MDE", "havana": "HAV", "san jose": "SJO",
  // Oceania
  "sydney": "SYD", "melbourne": "MEL", "auckland": "AKL",
  "brisbane": "BNE", "perth": "PER", "queenstown": "ZQN",
};

/**
 * Resolve a city name to its IATA airport code.
 * Performs case-insensitive lookup with common normalization.
 * Returns null if no match found.
 */
export function resolveIATA(city: string): string | null {
  if (!city || typeof city !== "string") return null;

  // Normalize: lowercase, trim, strip common suffixes
  let normalized = city.toLowerCase().trim();

  // Strip country suffixes (e.g., "Barcelona, Spain" → "barcelona")
  normalized = normalized.replace(/,\s*.+$/, "").trim();

  // Direct lookup
  if (IATA_MAP[normalized]) return IATA_MAP[normalized];

  // Try without accents
  const deaccented = normalized
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (IATA_MAP[deaccented]) return IATA_MAP[deaccented];

  // Try partial match (first word)
  const firstWord = normalized.split(/\s+/)[0];
  if (firstWord.length >= 4 && IATA_MAP[firstWord]) {
    return IATA_MAP[firstWord];
  }

  return null;
}

/**
 * Format date as DD for Aviasales deeplink (day of month, zero-padded).
 */
export function formatDay(dateStr: string): string {
  const d = new Date(dateStr);
  return String(d.getDate()).padStart(2, "0");
}

/**
 * Format date as MM for Aviasales deeplink (month, zero-padded).
 */
export function formatMonth(dateStr: string): string {
  const d = new Date(dateStr);
  return String(d.getMonth() + 1).padStart(2, "0");
}

/**
 * Build an Aviasales booking deeplink.
 * Format: /search/{ORIGIN}{DD}{MM}{DEST}{DD}{MM}{passengers}
 */
export function buildAviasalesLink(
  originIATA: string,
  destIATA: string,
  departDate: string,
  returnDate: string,
  passengers = 1,
  marker?: string,
): string {
  const dDay = formatDay(departDate);
  const dMonth = formatMonth(departDate);
  const rDay = formatDay(returnDate);
  const rMonth = formatMonth(returnDate);
  const base = `https://www.aviasales.com/search/${originIATA}${dDay}${dMonth}${destIATA}${rDay}${rMonth}${passengers}`;
  return marker ? `${base}?marker=${marker}` : base;
}

/**
 * Build a Skyscanner fallback deeplink.
 */
export function buildSkyscannerLink(
  originIATA: string,
  destIATA: string,
  departDate: string,
  returnDate?: string,
): string {
  const base = `https://www.skyscanner.com/transport/flights/${originIATA.toLowerCase()}/${destIATA.toLowerCase()}/${departDate}/`;
  return returnDate ? `${base}${returnDate}/` : base;
}
