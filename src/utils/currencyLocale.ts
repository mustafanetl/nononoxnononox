const eurLocales = [
  "de", "fr", "es", "it", "nl", "pt", "fi", "el", "ie", "at",
  "be", "sk", "si", "ee", "lv", "lt", "mt", "cy", "lu", "hr",
];

interface CurrencyPrices {
  symbol: string;
  currency: string;
  monthly: string;
  annualMonthly: string;
}

export function getCurrencyPrices(): CurrencyPrices {
  const lang = (navigator.language || "en-US").toLowerCase();

  // GBP for en-GB
  if (lang === "en-gb") {
    return { symbol: "£", currency: "GBP", monthly: "8.99", annualMonthly: "3.49" };
  }

  // EUR for European locales
  const prefix = lang.split("-")[0];
  const region = lang.split("-")[1] || "";
  if (eurLocales.includes(prefix) || eurLocales.includes(region)) {
    return { symbol: "€", currency: "EUR", monthly: "9.99", annualMonthly: "4.17" };
  }

  // Check if Intl resolvedOptions gives a EUR country
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz.startsWith("Europe/") && lang !== "en-gb") {
      // Most of Europe uses EUR (except UK handled above, and a few others)
      const nonEurTimezones = ["Europe/London", "Europe/Zurich", "Europe/Stockholm", "Europe/Copenhagen", "Europe/Oslo", "Europe/Prague", "Europe/Warsaw", "Europe/Budapest", "Europe/Bucharest", "Europe/Sofia", "Europe/Belgrade"];
      if (!nonEurTimezones.includes(tz)) {
        return { symbol: "€", currency: "EUR", monthly: "9.99", annualMonthly: "4.17" };
      }
    }
  } catch {}

  // Default USD
  return { symbol: "$", currency: "USD", monthly: "9.99", annualMonthly: "4.17" };
}
