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