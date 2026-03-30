import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ArrowRightLeft } from "lucide-react";

const RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149.5, THB: 35.2, IDR: 15700,
  AED: 3.67, INR: 83.1, AUD: 1.53, CAD: 1.36, CHF: 0.88, CNY: 7.24,
  KRW: 1320, MXN: 17.1, BRL: 4.97, SGD: 1.34, HKD: 7.82, TRY: 30.2,
  ZAR: 18.9, SEK: 10.4, NOK: 10.5, DKK: 6.87, NZD: 1.63, PHP: 56.1,
  MYR: 4.72, PLN: 4.0, CZK: 22.7, HUF: 355, EGP: 30.9, MAD: 10.1,
};

type Props = { destinationCurrency?: string };

const CurrencyConverter = ({ destinationCurrency = "EUR" }: Props) => {
  const destCode = destinationCurrency.toUpperCase().slice(0, 3);
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState(RATES[destCode] ? destCode : "EUR");
  const [amount, setAmount] = useState("100");

  const convert = (val: number) => {
    const usd = val / (RATES[from] || 1);
    return (usd * (RATES[to] || 1)).toFixed(2);
  };

  const swap = () => { setFrom(to); setTo(from); };

  const currencies = Object.keys(RATES);

  return (
    <div className="mt-3 p-4 rounded-xl border border-border bg-card">
      <p className="text-xs font-medium text-muted-foreground mb-3">Currency Converter</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 space-y-1">
          <select value={from} onChange={e => setFrom(e.target.value)} className="w-full text-xs bg-secondary rounded-lg px-2 py-1.5 border-0 focus:outline-none">
            {currencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="h-8 text-sm" />
        </div>
        <button onClick={swap} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex-1 space-y-1">
          <select value={to} onChange={e => setTo(e.target.value)} className="w-full text-xs bg-secondary rounded-lg px-2 py-1.5 border-0 focus:outline-none">
            {currencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="h-8 flex items-center px-3 bg-muted rounded-md text-sm font-medium">
            {convert(parseFloat(amount) || 0)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencyConverter;
