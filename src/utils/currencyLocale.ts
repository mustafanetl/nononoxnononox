interface CurrencyPrices {
  symbol: string;
  currency: string;
  monthly: string;
  annualMonthly: string;
}

export function getCurrencyPrices(): CurrencyPrices {
  return { symbol: "$", currency: "USD", monthly: "9.99", annualMonthly: "4.17" };
}
