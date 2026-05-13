/**
 * Trip-page localization.
 *
 * The AI generates trip CONTENT (venue names, descriptions, day titles) in whatever
 * language the user wrote in. The trip-page UI labels were hardcoded in English.
 * This module:
 *   1) detects the trip's language from the AI-generated text/itinerary
 *   2) returns a localized string bundle for the Trip Detail page
 *
 * Detection is heuristic — fast, dependency-free, and good enough for the
 * languages Jolliday actually sees. Falls back to English when unsure.
 */

export type TripLang =
  | "en" | "sv" | "es" | "fr" | "de" | "it" | "pt" | "nl"
  | "da" | "no" | "fi" | "pl" | "tr" | "ru" | "ar" | "ja" | "ko" | "zh";

export interface TripStrings {
  yourJolliday: string;
  daysSubtitle: (n: number) => string;
  scroll: string;
  // stats
  days: string;
  stops: string;
  stays: string;
  from: string;
  // map / story
  theStory: string;
  tapPin: string;
  storyFallback: (days: number, destination: string) => string;
  // logistics
  logistics: string;
  logisticsTitle: string;
  flights: string;
  hotels: string;
  // itinerary
  thePlan: string;
  dayByDay: string;
  day: string;
  stopsStartsAt: (count: number, time: string) => string;
  // experiences
  dontMiss: string;
  experiences: string;
  // closing card
  craftedBy: string;
  closingHeadline: (days: number, destination: string) => string;
  closingSub: string;
  saveTrip: string;
  saving: string;
  shareTrip: string;
  sharing: string;
  copyLink: string;
  downloadPdf: string;
  // misc
  direct: string;
  stopWord: (n: number) => string;
  perNight: string;
  searchOnSkyscanner: string;
  checkOnBooking: string;
  bookingShort: string;
  bookAhead: string;
  importTrip: string;
  importing: string;
  sharedTrip: string;
  sharedTripSubtitle: string;
}

/**
 * Detect the language of a string by scoring it against small marker sets.
 * Cheap, no deps, works on a few hundred characters of trip text.
 */
export const detectLang = (text: string | undefined | null): TripLang => {
  if (!text || text.length < 8) return "en";
  const t = " " + text.toLowerCase() + " ";

  // Script-based shortcuts
  if (/[\u0600-\u06ff]/.test(text)) return "ar";
  if (/[\u3040-\u30ff]/.test(text)) return "ja";
  if (/[\uac00-\ud7af]/.test(text)) return "ko";
  if (/[\u4e00-\u9fff]/.test(text)) return "zh";
  if (/[\u0400-\u04ff]/.test(text)) return "ru";

  const markers: Record<Exclude<TripLang, "ar"|"ja"|"ko"|"zh"|"ru">, string[]> = {
    en: [" the ", " and ", " your ", " day ", " with ", " for ", " trip ", " visit "],
    sv: [" och ", " att ", " för ", " med ", " dag ", " du ", " är ", " på ", " inte ", " resa ", " här "],
    es: [" el ", " la ", " los ", " las ", " que ", " con ", " para ", " día ", " en ", " un ", " una ", " viaje "],
    fr: [" le ", " la ", " les ", " et ", " avec ", " pour ", " jour ", " un ", " une ", " votre ", " voyage "],
    de: [" und ", " der ", " die ", " das ", " mit ", " für ", " tag ", " ein ", " eine ", " ihre ", " reise "],
    it: [" il ", " la ", " gli ", " con ", " per ", " giorno ", " un ", " una ", " vostro ", " viaggio "],
    pt: [" o ", " a ", " os ", " as ", " que ", " com ", " para ", " dia ", " um ", " uma ", " sua ", " viagem "],
    nl: [" de ", " het ", " een ", " en ", " met ", " voor ", " dag ", " jouw ", " uw ", " reis "],
    da: [" og ", " at ", " for ", " med ", " dag ", " du ", " er ", " på ", " ikke ", " rejse "],
    no: [" og ", " å ", " for ", " med ", " dag ", " du ", " er ", " på ", " ikke ", " reise "],
    fi: [" ja ", " on ", " ei ", " että ", " kanssa ", " päivä ", " sinun ", " matka "],
    pl: [" i ", " w ", " na ", " z ", " dzień ", " twój ", " podróż ", " dla "],
    tr: [" ve ", " bir ", " gün ", " için ", " ile ", " seyahat ", " sizin "],
  };

  let bestLang: TripLang = "en";
  let bestScore = 0;
  for (const [lang, words] of Object.entries(markers)) {
    let score = 0;
    for (const w of words) if (t.includes(w)) score += w.length > 4 ? 2 : 1;
    if (score > bestScore) { bestScore = score; bestLang = lang as TripLang; }
  }
  // Tie-breakers: distinguish da vs no when both match equally.
  if (bestLang === "da" && /[ø]/.test(t) && !/[ä]/.test(t)) bestLang = "no";
  return bestScore >= 2 ? bestLang : "en";
};

const en: TripStrings = {
  yourJolliday: "Your Jolliday",
  daysSubtitle: (n) => `A ${n}-day plan, hand-built around the moments worth remembering.`,
  scroll: "scroll",
  days: "Days", stops: "Stops", stays: "Stays", from: "From",
  theStory: "The story",
  tapPin: "Tap a pin on the map to open that stop.",
  storyFallback: (d, dest) => `A handcrafted ${d}-day plan in ${dest}.`,
  logistics: "Logistics",
  logisticsTitle: "Getting there & where you'll sleep",
  flights: "Flights", hotels: "Hotels",
  thePlan: "The plan", dayByDay: "Day by day", day: "Day",
  stopsStartsAt: (c, t) => `${c} stops · starts ${t}`,
  dontMiss: "Don't miss", experiences: "Experiences",
  craftedBy: "Crafted by Jolliday",
  closingHeadline: (d, dest) => `${d} unforgettable days in ${dest}.`,
  closingSub: "Save it, share it, or export a PDF for the road. Prices are estimates — the memories aren't.",
  saveTrip: "Save trip", saving: "Saving...",
  shareTrip: "Share trip", sharing: "Creating...",
  copyLink: "Copy link", downloadPdf: "Download PDF",
  direct: "Direct",
  stopWord: (n) => `${n} stop${n > 1 ? "s" : ""}`,
  perNight: "/night",
  searchOnSkyscanner: "Search on Skyscanner",
  checkOnBooking: "Check on Booking.com",
  bookingShort: "Booking.com",
  bookAhead: "Book ahead",
  importTrip: "Import this trip", importing: "Importing...",
  sharedTrip: "Shared trip",
  sharedTripSubtitle: "Sign up to import & customize this plan",
};

const sv: TripStrings = {
  yourJolliday: "Din Jolliday",
  daysSubtitle: (n) => `En ${n}-dagars resa, byggd kring stunderna värda att minnas.`,
  scroll: "scrolla",
  days: "Dagar", stops: "Stopp", stays: "Boenden", from: "Från",
  theStory: "Berättelsen",
  tapPin: "Tryck på en nål på kartan för att öppna stoppet.",
  storyFallback: (d, dest) => `En handgjord ${d}-dagars plan i ${dest}.`,
  logistics: "Logistik",
  logisticsTitle: "Hur du tar dig dit & var du sover",
  flights: "Flyg", hotels: "Hotell",
  thePlan: "Planen", dayByDay: "Dag för dag", day: "Dag",
  stopsStartsAt: (c, t) => `${c} stopp · börjar ${t}`,
  dontMiss: "Missa inte", experiences: "Upplevelser",
  craftedBy: "Skapad av Jolliday",
  closingHeadline: (d, dest) => `${d} oförglömliga dagar i ${dest}.`,
  closingSub: "Spara den, dela den eller exportera en PDF inför resan. Priserna är uppskattningar — minnena är inte det.",
  saveTrip: "Spara resa", saving: "Sparar...",
  shareTrip: "Dela resa", sharing: "Skapar...",
  copyLink: "Kopiera länk", downloadPdf: "Ladda ner PDF",
  direct: "Direkt",
  stopWord: (n) => `${n} stopp`,
  perNight: "/natt",
  searchOnSkyscanner: "Sök på Skyscanner",
  checkOnBooking: "Kolla på Booking.com",
  bookingShort: "Booking.com",
  bookAhead: "Boka i förväg",
  importTrip: "Importera denna resa", importing: "Importerar...",
  sharedTrip: "Delad resa",
  sharedTripSubtitle: "Skapa konto för att importera och anpassa planen",
};

const es: TripStrings = {
  yourJolliday: "Tu Jolliday",
  daysSubtitle: (n) => `Un plan de ${n} días, hecho a mano alrededor de los momentos que vale la pena recordar.`,
  scroll: "desplaza",
  days: "Días", stops: "Paradas", stays: "Alojamientos", from: "Desde",
  theStory: "La historia",
  tapPin: "Toca un pin en el mapa para abrir esa parada.",
  storyFallback: (d, dest) => `Un plan artesanal de ${d} días en ${dest}.`,
  logistics: "Logística",
  logisticsTitle: "Cómo llegar y dónde dormir",
  flights: "Vuelos", hotels: "Hoteles",
  thePlan: "El plan", dayByDay: "Día a día", day: "Día",
  stopsStartsAt: (c, t) => `${c} paradas · empieza ${t}`,
  dontMiss: "No te lo pierdas", experiences: "Experiencias",
  craftedBy: "Creado por Jolliday",
  closingHeadline: (d, dest) => `${d} días inolvidables en ${dest}.`,
  closingSub: "Guárdalo, compártelo o exporta un PDF. Los precios son estimados — los recuerdos no.",
  saveTrip: "Guardar viaje", saving: "Guardando...",
  shareTrip: "Compartir viaje", sharing: "Creando...",
  copyLink: "Copiar enlace", downloadPdf: "Descargar PDF",
  direct: "Directo",
  stopWord: (n) => `${n} ${n > 1 ? "escalas" : "escala"}`,
  perNight: "/noche",
  searchOnSkyscanner: "Buscar en Skyscanner",
  checkOnBooking: "Ver en Booking.com",
  bookingShort: "Booking.com",
  bookAhead: "Reservar con antelación",
  importTrip: "Importar este viaje", importing: "Importando...",
  sharedTrip: "Viaje compartido",
  sharedTripSubtitle: "Regístrate para importar y personalizar este plan",
};

const fr: TripStrings = {
  yourJolliday: "Ton Jolliday",
  daysSubtitle: (n) => `Un voyage de ${n} jours, conçu autour des moments qui valent la peine.`,
  scroll: "défile",
  days: "Jours", stops: "Étapes", stays: "Hébergements", from: "À partir de",
  theStory: "L'histoire",
  tapPin: "Touche une épingle sur la carte pour ouvrir l'étape.",
  storyFallback: (d, dest) => `Un plan artisanal de ${d} jours à ${dest}.`,
  logistics: "Logistique",
  logisticsTitle: "Comment y aller & où dormir",
  flights: "Vols", hotels: "Hôtels",
  thePlan: "Le plan", dayByDay: "Jour par jour", day: "Jour",
  stopsStartsAt: (c, t) => `${c} étapes · commence à ${t}`,
  dontMiss: "À ne pas manquer", experiences: "Expériences",
  craftedBy: "Créé par Jolliday",
  closingHeadline: (d, dest) => `${d} jours inoubliables à ${dest}.`,
  closingSub: "Sauvegarde-le, partage-le, ou exporte un PDF. Les prix sont estimés — pas les souvenirs.",
  saveTrip: "Sauvegarder", saving: "Enregistrement...",
  shareTrip: "Partager", sharing: "Création...",
  copyLink: "Copier le lien", downloadPdf: "Télécharger PDF",
  direct: "Direct",
  stopWord: (n) => `${n} escale${n > 1 ? "s" : ""}`,
  perNight: "/nuit",
  searchOnSkyscanner: "Chercher sur Skyscanner",
  checkOnBooking: "Voir sur Booking.com",
  bookingShort: "Booking.com",
  bookAhead: "Réserver à l'avance",
  importTrip: "Importer ce voyage", importing: "Importation...",
  sharedTrip: "Voyage partagé",
  sharedTripSubtitle: "Inscris-toi pour importer et personnaliser ce plan",
};

const de: TripStrings = {
  yourJolliday: "Dein Jolliday",
  daysSubtitle: (n) => `Ein ${n}-Tage-Plan, gebaut um die Momente, die zählen.`,
  scroll: "scrollen",
  days: "Tage", stops: "Stopps", stays: "Unterkünfte", from: "Ab",
  theStory: "Die Geschichte",
  tapPin: "Tippe auf eine Stecknadel, um diesen Stopp zu öffnen.",
  storyFallback: (d, dest) => `Ein handgemachter ${d}-Tage-Plan in ${dest}.`,
  logistics: "Logistik",
  logisticsTitle: "Anreise & Übernachtung",
  flights: "Flüge", hotels: "Hotels",
  thePlan: "Der Plan", dayByDay: "Tag für Tag", day: "Tag",
  stopsStartsAt: (c, t) => `${c} Stopps · startet ${t}`,
  dontMiss: "Nicht verpassen", experiences: "Erlebnisse",
  craftedBy: "Erstellt von Jolliday",
  closingHeadline: (d, dest) => `${d} unvergessliche Tage in ${dest}.`,
  closingSub: "Speichere, teile oder exportiere als PDF. Preise sind Schätzungen — die Erinnerungen nicht.",
  saveTrip: "Reise speichern", saving: "Speichert...",
  shareTrip: "Reise teilen", sharing: "Wird erstellt...",
  copyLink: "Link kopieren", downloadPdf: "PDF herunterladen",
  direct: "Direkt",
  stopWord: (n) => `${n} Stopp${n > 1 ? "s" : ""}`,
  perNight: "/Nacht",
  searchOnSkyscanner: "Auf Skyscanner suchen",
  checkOnBooking: "Auf Booking.com ansehen",
  bookingShort: "Booking.com",
  bookAhead: "Im Voraus buchen",
  importTrip: "Reise importieren", importing: "Importiere...",
  sharedTrip: "Geteilte Reise",
  sharedTripSubtitle: "Registriere dich, um diesen Plan zu importieren",
};

const it: TripStrings = {
  yourJolliday: "Il tuo Jolliday",
  daysSubtitle: (n) => `Un piano di ${n} giorni, costruito attorno ai momenti che contano.`,
  scroll: "scorri",
  days: "Giorni", stops: "Tappe", stays: "Alloggi", from: "Da",
  theStory: "La storia",
  tapPin: "Tocca un segnaposto per aprire quella tappa.",
  storyFallback: (d, dest) => `Un piano artigianale di ${d} giorni a ${dest}.`,
  logistics: "Logistica",
  logisticsTitle: "Come arrivare & dove dormire",
  flights: "Voli", hotels: "Hotel",
  thePlan: "Il piano", dayByDay: "Giorno per giorno", day: "Giorno",
  stopsStartsAt: (c, t) => `${c} tappe · inizia ${t}`,
  dontMiss: "Da non perdere", experiences: "Esperienze",
  craftedBy: "Creato da Jolliday",
  closingHeadline: (d, dest) => `${d} giorni indimenticabili a ${dest}.`,
  closingSub: "Salva, condividi o esporta un PDF. I prezzi sono stime — i ricordi no.",
  saveTrip: "Salva viaggio", saving: "Salvataggio...",
  shareTrip: "Condividi", sharing: "Creazione...",
  copyLink: "Copia link", downloadPdf: "Scarica PDF",
  direct: "Diretto",
  stopWord: (n) => `${n} scal${n > 1 ? "i" : "o"}`,
  perNight: "/notte",
  searchOnSkyscanner: "Cerca su Skyscanner",
  checkOnBooking: "Vedi su Booking.com",
  bookingShort: "Booking.com",
  bookAhead: "Prenota in anticipo",
  importTrip: "Importa questo viaggio", importing: "Importazione...",
  sharedTrip: "Viaggio condiviso",
  sharedTripSubtitle: "Registrati per importare e personalizzare il piano",
};

const pt: TripStrings = {
  yourJolliday: "O teu Jolliday",
  daysSubtitle: (n) => `Um plano de ${n} dias, feito à mão à volta dos momentos que valem a pena.`,
  scroll: "rola",
  days: "Dias", stops: "Paragens", stays: "Estadias", from: "Desde",
  theStory: "A história",
  tapPin: "Toca num pin no mapa para abrir essa paragem.",
  storyFallback: (d, dest) => `Um plano artesanal de ${d} dias em ${dest}.`,
  logistics: "Logística",
  logisticsTitle: "Como chegar & onde dormir",
  flights: "Voos", hotels: "Hotéis",
  thePlan: "O plano", dayByDay: "Dia a dia", day: "Dia",
  stopsStartsAt: (c, t) => `${c} paragens · começa ${t}`,
  dontMiss: "Não percas", experiences: "Experiências",
  craftedBy: "Criado por Jolliday",
  closingHeadline: (d, dest) => `${d} dias inesquecíveis em ${dest}.`,
  closingSub: "Guarda, partilha ou exporta um PDF. Os preços são estimativas — as memórias não.",
  saveTrip: "Guardar viagem", saving: "A guardar...",
  shareTrip: "Partilhar", sharing: "A criar...",
  copyLink: "Copiar link", downloadPdf: "Transferir PDF",
  direct: "Direto",
  stopWord: (n) => `${n} escala${n > 1 ? "s" : ""}`,
  perNight: "/noite",
  searchOnSkyscanner: "Procurar no Skyscanner",
  checkOnBooking: "Ver no Booking.com",
  bookingShort: "Booking.com",
  bookAhead: "Reserva com antecedência",
  importTrip: "Importar esta viagem", importing: "A importar...",
  sharedTrip: "Viagem partilhada",
  sharedTripSubtitle: "Cria conta para importar e personalizar este plano",
};

const nl: TripStrings = {
  yourJolliday: "Jouw Jolliday",
  daysSubtitle: (n) => `Een ${n}-daags plan, gebouwd rond de momenten die ertoe doen.`,
  scroll: "scroll",
  days: "Dagen", stops: "Stops", stays: "Verblijven", from: "Vanaf",
  theStory: "Het verhaal",
  tapPin: "Tik op een pin op de kaart om die stop te openen.",
  storyFallback: (d, dest) => `Een handgemaakt ${d}-daags plan in ${dest}.`,
  logistics: "Logistiek",
  logisticsTitle: "Hoe je er komt & waar je slaapt",
  flights: "Vluchten", hotels: "Hotels",
  thePlan: "Het plan", dayByDay: "Dag voor dag", day: "Dag",
  stopsStartsAt: (c, t) => `${c} stops · start ${t}`,
  dontMiss: "Niet missen", experiences: "Ervaringen",
  craftedBy: "Gemaakt door Jolliday",
  closingHeadline: (d, dest) => `${d} onvergetelijke dagen in ${dest}.`,
  closingSub: "Bewaar het, deel het of exporteer als PDF. Prijzen zijn schattingen — herinneringen niet.",
  saveTrip: "Reis opslaan", saving: "Opslaan...",
  shareTrip: "Delen", sharing: "Aanmaken...",
  copyLink: "Link kopiëren", downloadPdf: "PDF downloaden",
  direct: "Direct",
  stopWord: (n) => `${n} tussenstop${n > 1 ? "s" : ""}`,
  perNight: "/nacht",
  searchOnSkyscanner: "Zoek op Skyscanner",
  checkOnBooking: "Bekijk op Booking.com",
  bookingShort: "Booking.com",
  bookAhead: "Vooraf reserveren",
  importTrip: "Importeer deze reis", importing: "Importeren...",
  sharedTrip: "Gedeelde reis",
  sharedTripSubtitle: "Maak een account om dit plan te importeren",
};

const da: TripStrings = {
  ...sv,
  yourJolliday: "Din Jolliday",
  daysSubtitle: (n) => `En ${n}-dages tur, bygget omkring øjeblikke værd at huske.`,
  scroll: "scroll",
  days: "Dage", stops: "Stop", stays: "Overnatninger", from: "Fra",
  theStory: "Historien",
  tapPin: "Tryk på en nål på kortet for at åbne stoppet.",
  storyFallback: (d, dest) => `En håndlavet ${d}-dages plan i ${dest}.`,
  logisticsTitle: "Sådan kommer du dertil & hvor du sover",
  flights: "Fly", hotels: "Hoteller",
  dayByDay: "Dag for dag", day: "Dag",
  stopsStartsAt: (c, t) => `${c} stop · starter ${t}`,
  dontMiss: "Gå ikke glip af", experiences: "Oplevelser",
  craftedBy: "Skabt af Jolliday",
  closingHeadline: (d, dest) => `${d} uforglemmelige dage i ${dest}.`,
  closingSub: "Gem, del eller eksportér en PDF. Priserne er skøn — minderne er ikke.",
  saveTrip: "Gem rejse", saving: "Gemmer...",
  shareTrip: "Del rejse", sharing: "Opretter...",
  copyLink: "Kopiér link", downloadPdf: "Hent PDF",
  perNight: "/nat",
  bookAhead: "Bestil i forvejen",
  importTrip: "Importér denne rejse", importing: "Importerer...",
  sharedTrip: "Delt rejse",
  sharedTripSubtitle: "Opret konto for at importere og tilpasse planen",
};

const no: TripStrings = {
  ...da,
  yourJolliday: "Din Jolliday",
  daysSubtitle: (n) => `En ${n}-dagers tur, bygget rundt øyeblikk verdt å huske.`,
  storyFallback: (d, dest) => `En håndlaget ${d}-dagers plan i ${dest}.`,
  logisticsTitle: "Hvordan komme dit & hvor du sover",
  craftedBy: "Skapt av Jolliday",
  closingHeadline: (d, dest) => `${d} uforglemmelige dager i ${dest}.`,
  closingSub: "Lagre, del eller eksporter en PDF. Prisene er anslag — minnene er ikke det.",
  saveTrip: "Lagre tur", saving: "Lagrer...",
  shareTrip: "Del tur", sharing: "Oppretter...",
  copyLink: "Kopier lenke", downloadPdf: "Last ned PDF",
  bookAhead: "Bestill på forhånd",
  importTrip: "Importer denne turen", importing: "Importerer...",
  sharedTrip: "Delt tur",
};

// Languages we don't ship full dictionaries for — fall back to English bundle.
const dictionaries: Record<TripLang, TripStrings> = {
  en, sv, es, fr, de, it, pt, nl, da, no,
  fi: en, pl: en, tr: en, ru: en, ar: en, ja: en, ko: en, zh: en,
};

/** Get the localized string bundle for a given language code. */
export const getTripStrings = (lang: TripLang): TripStrings => dictionaries[lang] || en;

/**
 * Pull the most representative text out of a trip object so we can detect language.
 * Combines the AI commentary text + a few day titles + a few slot activities.
 */
export const extractTripLangSample = (data: any): string => {
  if (!data) return "";
  const parts: string[] = [];
  if (typeof data.text === "string") parts.push(data.text);
  if (Array.isArray(data.itinerary)) {
    for (const d of data.itinerary.slice(0, 3)) {
      if (d?.title) parts.push(String(d.title));
      if (Array.isArray(d?.slots)) {
        for (const s of d.slots.slice(0, 3)) {
          if (s?.activity) parts.push(String(s.activity));
        }
      }
    }
  }
  return parts.join(" ").slice(0, 1500);
};


/* ═══════════════════════════════════════════════════════════════
 *  Key-based translations — `t(key, locale)` API
 *
 *  Supports a flat dot-namespaced key space (e.g. "trip.days",
 *  "common.close"). Consumers prefer this when they need a single
 *  lookup rather than a typed bundle. Falls back to English, and
 *  finally to the key itself when no translation exists.
 * ═══════════════════════════════════════════════════════════════ */

export type SupportedLocale =
  | "en" | "sv" | "es" | "fr" | "de" | "it" | "pt" | "nl" | "da" | "no";

export const SUPPORTED_LOCALES: readonly SupportedLocale[] = [
  "en", "sv", "es", "fr", "de", "it", "pt", "nl", "da", "no",
] as const;

type Dict = Record<string, string>;

const enDict: Dict = {
  // Trip Detail — section labels
  "trip.trip_detail": "Trip detail",
  "trip.days": "Days",
  "trip.day": "Day",
  "trip.stops": "Stops",
  "trip.stays": "Stays",
  "trip.itinerary": "Itinerary",
  "trip.activities": "Activities",
  "trip.activity": "Activity",
  "trip.hotels": "Hotels",
  "trip.hotel": "Hotel",
  "trip.flights": "Flights",
  "trip.flight": "Flight",
  "trip.map": "Map",
  "trip.timeline": "Timeline",
  "trip.packing_list": "Packing list",
  "trip.weather": "Weather",
  "trip.currency_converter": "Currency converter",
  "trip.travel_info": "Travel info",
  "trip.visa": "Visa",
  "trip.language": "Language",
  "trip.timezone": "Timezone",
  // Trip Detail — actions
  "trip.export_pdf": "Export PDF",
  "trip.share": "Share",
  "trip.share_trip": "Share trip",
  "trip.save": "Save trip",
  "trip.import": "Import this trip",
  "trip.open_full_plan": "Open full plan",
  // Common UI
  "common.open": "Open",
  "common.close": "Close",
  "common.back": "Back",
  "common.copy": "Copy",
  "common.save": "Save",
  "common.delete": "Delete",
  "common.loading": "Loading…",
  "common.cancel": "Cancel",
  "common.confirm": "Confirm",
  "common.error": "Something went wrong",
};

const svDict: Dict = {
  "trip.trip_detail": "Resdetaljer",
  "trip.days": "Dagar",
  "trip.day": "Dag",
  "trip.stops": "Stopp",
  "trip.stays": "Boenden",
  "trip.itinerary": "Resplan",
  "trip.activities": "Aktiviteter",
  "trip.activity": "Aktivitet",
  "trip.hotels": "Hotell",
  "trip.hotel": "Hotell",
  "trip.flights": "Flyg",
  "trip.flight": "Flyg",
  "trip.map": "Karta",
  "trip.timeline": "Tidslinje",
  "trip.packing_list": "Packlista",
  "trip.weather": "Väder",
  "trip.currency_converter": "Valutaomvandlare",
  "trip.travel_info": "Reseinfo",
  "trip.visa": "Visum",
  "trip.language": "Språk",
  "trip.timezone": "Tidszon",
  "trip.export_pdf": "Exportera PDF",
  "trip.share": "Dela",
  "trip.share_trip": "Dela resa",
  "trip.save": "Spara resa",
  "trip.import": "Importera denna resa",
  "trip.open_full_plan": "Öppna hela planen",
  "common.open": "Öppna",
  "common.close": "Stäng",
  "common.back": "Tillbaka",
  "common.copy": "Kopiera",
  "common.save": "Spara",
  "common.delete": "Radera",
  "common.loading": "Laddar…",
  "common.cancel": "Avbryt",
  "common.confirm": "Bekräfta",
  "common.error": "Något gick fel",
};

const esDict: Dict = {
  "trip.trip_detail": "Detalle del viaje",
  "trip.days": "Días",
  "trip.day": "Día",
  "trip.stops": "Paradas",
  "trip.stays": "Alojamientos",
  "trip.itinerary": "Itinerario",
  "trip.activities": "Actividades",
  "trip.activity": "Actividad",
  "trip.hotels": "Hoteles",
  "trip.hotel": "Hotel",
  "trip.flights": "Vuelos",
  "trip.flight": "Vuelo",
  "trip.map": "Mapa",
  "trip.timeline": "Cronograma",
  "trip.packing_list": "Lista de equipaje",
  "trip.weather": "Clima",
  "trip.currency_converter": "Conversor de moneda",
  "trip.travel_info": "Información de viaje",
  "trip.visa": "Visa",
  "trip.language": "Idioma",
  "trip.timezone": "Zona horaria",
  "trip.export_pdf": "Exportar PDF",
  "trip.share": "Compartir",
  "trip.share_trip": "Compartir viaje",
  "trip.save": "Guardar viaje",
  "trip.import": "Importar este viaje",
  "trip.open_full_plan": "Abrir plan completo",
  "common.open": "Abrir",
  "common.close": "Cerrar",
  "common.back": "Atrás",
  "common.copy": "Copiar",
  "common.save": "Guardar",
  "common.delete": "Eliminar",
  "common.loading": "Cargando…",
  "common.cancel": "Cancelar",
  "common.confirm": "Confirmar",
  "common.error": "Algo salió mal",
};

const frDict: Dict = {
  "trip.trip_detail": "Détails du voyage",
  "trip.days": "Jours",
  "trip.day": "Jour",
  "trip.stops": "Étapes",
  "trip.stays": "Hébergements",
  "trip.itinerary": "Itinéraire",
  "trip.activities": "Activités",
  "trip.activity": "Activité",
  "trip.hotels": "Hôtels",
  "trip.hotel": "Hôtel",
  "trip.flights": "Vols",
  "trip.flight": "Vol",
  "trip.map": "Carte",
  "trip.timeline": "Chronologie",
  "trip.packing_list": "Liste de bagages",
  "trip.weather": "Météo",
  "trip.currency_converter": "Convertisseur de devises",
  "trip.travel_info": "Infos de voyage",
  "trip.visa": "Visa",
  "trip.language": "Langue",
  "trip.timezone": "Fuseau horaire",
  "trip.export_pdf": "Exporter en PDF",
  "trip.share": "Partager",
  "trip.share_trip": "Partager le voyage",
  "trip.save": "Sauvegarder",
  "trip.import": "Importer ce voyage",
  "trip.open_full_plan": "Ouvrir le plan complet",
  "common.open": "Ouvrir",
  "common.close": "Fermer",
  "common.back": "Retour",
  "common.copy": "Copier",
  "common.save": "Enregistrer",
  "common.delete": "Supprimer",
  "common.loading": "Chargement…",
  "common.cancel": "Annuler",
  "common.confirm": "Confirmer",
  "common.error": "Une erreur est survenue",
};

const deDict: Dict = {
  "trip.trip_detail": "Reisedetails",
  "trip.days": "Tage",
  "trip.day": "Tag",
  "trip.stops": "Stopps",
  "trip.stays": "Unterkünfte",
  "trip.itinerary": "Reiseplan",
  "trip.activities": "Aktivitäten",
  "trip.activity": "Aktivität",
  "trip.hotels": "Hotels",
  "trip.hotel": "Hotel",
  "trip.flights": "Flüge",
  "trip.flight": "Flug",
  "trip.map": "Karte",
  "trip.timeline": "Zeitachse",
  "trip.packing_list": "Packliste",
  "trip.weather": "Wetter",
  "trip.currency_converter": "Währungsrechner",
  "trip.travel_info": "Reiseinfos",
  "trip.visa": "Visum",
  "trip.language": "Sprache",
  "trip.timezone": "Zeitzone",
  "trip.export_pdf": "PDF exportieren",
  "trip.share": "Teilen",
  "trip.share_trip": "Reise teilen",
  "trip.save": "Reise speichern",
  "trip.import": "Reise importieren",
  "trip.open_full_plan": "Ganzen Plan öffnen",
  "common.open": "Öffnen",
  "common.close": "Schließen",
  "common.back": "Zurück",
  "common.copy": "Kopieren",
  "common.save": "Speichern",
  "common.delete": "Löschen",
  "common.loading": "Lädt…",
  "common.cancel": "Abbrechen",
  "common.confirm": "Bestätigen",
  "common.error": "Etwas ist schiefgelaufen",
};

const itDict: Dict = {
  "trip.trip_detail": "Dettagli del viaggio",
  "trip.days": "Giorni",
  "trip.day": "Giorno",
  "trip.stops": "Tappe",
  "trip.stays": "Alloggi",
  "trip.itinerary": "Itinerario",
  "trip.activities": "Attività",
  "trip.activity": "Attività",
  "trip.hotels": "Hotel",
  "trip.hotel": "Hotel",
  "trip.flights": "Voli",
  "trip.flight": "Volo",
  "trip.map": "Mappa",
  "trip.timeline": "Cronologia",
  "trip.packing_list": "Lista bagagli",
  "trip.weather": "Meteo",
  "trip.currency_converter": "Convertitore di valuta",
  "trip.travel_info": "Info viaggio",
  "trip.visa": "Visto",
  "trip.language": "Lingua",
  "trip.timezone": "Fuso orario",
  "trip.export_pdf": "Esporta PDF",
  "trip.share": "Condividi",
  "trip.share_trip": "Condividi viaggio",
  "trip.save": "Salva viaggio",
  "trip.import": "Importa questo viaggio",
  "trip.open_full_plan": "Apri piano completo",
  "common.open": "Apri",
  "common.close": "Chiudi",
  "common.back": "Indietro",
  "common.copy": "Copia",
  "common.save": "Salva",
  "common.delete": "Elimina",
  "common.loading": "Caricamento…",
  "common.cancel": "Annulla",
  "common.confirm": "Conferma",
  "common.error": "Qualcosa è andato storto",
};

const ptDict: Dict = {
  "trip.trip_detail": "Detalhes da viagem",
  "trip.days": "Dias",
  "trip.day": "Dia",
  "trip.stops": "Paragens",
  "trip.stays": "Estadias",
  "trip.itinerary": "Itinerário",
  "trip.activities": "Atividades",
  "trip.activity": "Atividade",
  "trip.hotels": "Hotéis",
  "trip.hotel": "Hotel",
  "trip.flights": "Voos",
  "trip.flight": "Voo",
  "trip.map": "Mapa",
  "trip.timeline": "Cronologia",
  "trip.packing_list": "Lista de bagagens",
  "trip.weather": "Tempo",
  "trip.currency_converter": "Conversor de moeda",
  "trip.travel_info": "Info de viagem",
  "trip.visa": "Visto",
  "trip.language": "Idioma",
  "trip.timezone": "Fuso horário",
  "trip.export_pdf": "Exportar PDF",
  "trip.share": "Partilhar",
  "trip.share_trip": "Partilhar viagem",
  "trip.save": "Guardar viagem",
  "trip.import": "Importar esta viagem",
  "trip.open_full_plan": "Abrir plano completo",
  "common.open": "Abrir",
  "common.close": "Fechar",
  "common.back": "Voltar",
  "common.copy": "Copiar",
  "common.save": "Guardar",
  "common.delete": "Eliminar",
  "common.loading": "A carregar…",
  "common.cancel": "Cancelar",
  "common.confirm": "Confirmar",
  "common.error": "Algo correu mal",
};

const nlDict: Dict = {
  "trip.trip_detail": "Reisdetails",
  "trip.days": "Dagen",
  "trip.day": "Dag",
  "trip.stops": "Stops",
  "trip.stays": "Verblijven",
  "trip.itinerary": "Reisplan",
  "trip.activities": "Activiteiten",
  "trip.activity": "Activiteit",
  "trip.hotels": "Hotels",
  "trip.hotel": "Hotel",
  "trip.flights": "Vluchten",
  "trip.flight": "Vlucht",
  "trip.map": "Kaart",
  "trip.timeline": "Tijdlijn",
  "trip.packing_list": "Paklijst",
  "trip.weather": "Weer",
  "trip.currency_converter": "Valutaomrekenaar",
  "trip.travel_info": "Reisinfo",
  "trip.visa": "Visum",
  "trip.language": "Taal",
  "trip.timezone": "Tijdzone",
  "trip.export_pdf": "PDF exporteren",
  "trip.share": "Delen",
  "trip.share_trip": "Reis delen",
  "trip.save": "Reis opslaan",
  "trip.import": "Deze reis importeren",
  "trip.open_full_plan": "Volledig plan openen",
  "common.open": "Openen",
  "common.close": "Sluiten",
  "common.back": "Terug",
  "common.copy": "Kopiëren",
  "common.save": "Opslaan",
  "common.delete": "Verwijderen",
  "common.loading": "Laden…",
  "common.cancel": "Annuleren",
  "common.confirm": "Bevestigen",
  "common.error": "Er is iets misgegaan",
};

const daDict: Dict = {
  "trip.trip_detail": "Rejsedetaljer",
  "trip.days": "Dage",
  "trip.day": "Dag",
  "trip.stops": "Stop",
  "trip.stays": "Overnatninger",
  "trip.itinerary": "Rejseplan",
  "trip.activities": "Aktiviteter",
  "trip.activity": "Aktivitet",
  "trip.hotels": "Hoteller",
  "trip.hotel": "Hotel",
  "trip.flights": "Fly",
  "trip.flight": "Fly",
  "trip.map": "Kort",
  "trip.timeline": "Tidslinje",
  "trip.packing_list": "Pakkeliste",
  "trip.weather": "Vejr",
  "trip.currency_converter": "Valutaomregner",
  "trip.travel_info": "Rejseinfo",
  "trip.visa": "Visum",
  "trip.language": "Sprog",
  "trip.timezone": "Tidszone",
  "trip.export_pdf": "Eksportér PDF",
  "trip.share": "Del",
  "trip.share_trip": "Del rejse",
  "trip.save": "Gem rejse",
  "trip.import": "Importér denne rejse",
  "trip.open_full_plan": "Åbn hele planen",
  "common.open": "Åbn",
  "common.close": "Luk",
  "common.back": "Tilbage",
  "common.copy": "Kopiér",
  "common.save": "Gem",
  "common.delete": "Slet",
  "common.loading": "Indlæser…",
  "common.cancel": "Annullér",
  "common.confirm": "Bekræft",
  "common.error": "Noget gik galt",
};

const noDict: Dict = {
  "trip.trip_detail": "Reisedetaljer",
  "trip.days": "Dager",
  "trip.day": "Dag",
  "trip.stops": "Stopp",
  "trip.stays": "Overnattinger",
  "trip.itinerary": "Reiseplan",
  "trip.activities": "Aktiviteter",
  "trip.activity": "Aktivitet",
  "trip.hotels": "Hoteller",
  "trip.hotel": "Hotell",
  "trip.flights": "Fly",
  "trip.flight": "Fly",
  "trip.map": "Kart",
  "trip.timeline": "Tidslinje",
  "trip.packing_list": "Pakkeliste",
  "trip.weather": "Vær",
  "trip.currency_converter": "Valutakalkulator",
  "trip.travel_info": "Reiseinfo",
  "trip.visa": "Visum",
  "trip.language": "Språk",
  "trip.timezone": "Tidssone",
  "trip.export_pdf": "Eksporter PDF",
  "trip.share": "Del",
  "trip.share_trip": "Del tur",
  "trip.save": "Lagre tur",
  "trip.import": "Importer denne turen",
  "trip.open_full_plan": "Åpne hele planen",
  "common.open": "Åpne",
  "common.close": "Lukk",
  "common.back": "Tilbake",
  "common.copy": "Kopier",
  "common.save": "Lagre",
  "common.delete": "Slett",
  "common.loading": "Laster…",
  "common.cancel": "Avbryt",
  "common.confirm": "Bekreft",
  "common.error": "Noe gikk galt",
};

/**
 * Flat translation dictionaries keyed by locale.
 * Each dictionary is a flat map of dot-namespaced keys (e.g. "trip.days")
 * to the localized string.
 */
export const translations: Record<SupportedLocale, Dict> = {
  en: enDict,
  sv: svDict,
  es: esDict,
  fr: frDict,
  de: deDict,
  it: itDict,
  pt: ptDict,
  nl: nlDict,
  da: daDict,
  no: noDict,
};

/**
 * Translate a key for the given locale.
 * Falls back to English when the locale or key is missing, and finally
 * returns the key itself when no translation exists anywhere.
 */
export function t(key: string, locale: SupportedLocale = "en"): string {
  const dict = translations[locale];
  if (dict && Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
  const fallback = translations.en;
  if (fallback && Object.prototype.hasOwnProperty.call(fallback, key)) return fallback[key];
  return key;
}
