import { useTripContext } from "@/contexts/TripContext";
import { Plane, MapPin, Hotel, X, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

const BudgetPanel = () => {
  const { items, removeItem, totalBudget, currency, clearTrip } = useTripContext();

  if (items.length === 0) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="fixed bottom-24 right-4 z-30 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-full shadow-lg hover:opacity-90 transition-opacity">
          <Wallet className="h-4 w-4" />
          <span className="font-semibold text-sm">{currency}{totalBudget.toLocaleString()}</span>
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{items.length}</Badge>
        </button>
      </SheetTrigger>
      <SheetContent className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Trip Budget
            <Button variant="ghost" size="sm" onClick={clearTrip} className="text-xs text-muted-foreground">
              Clear all
            </Button>
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(100vh-200px)]">
          {items.map((item, idx) => {
            const icon = item.type === "flight" ? <Plane className="h-4 w-4" /> : item.type === "hotel" ? <Hotel className="h-4 w-4" /> : <MapPin className="h-4 w-4" />;
            const name = item.type === "flight" ? `${item.data.airline} (${item.data.from}→${item.data.to})` : item.type === "hotel" ? item.data.name : item.data.name;
            const price = item.type === "hotel" ? `${item.data.currency}${item.data.pricePerNight}/night` : `${item.data.currency}${item.data.price}`;
            const id = item.data.id;

            return (
              <div key={`${item.type}-${id}-${idx}`} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shrink-0">
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                </div>
                <span className="text-sm font-semibold shrink-0">{price}</span>
                <button onClick={() => removeItem(item.type, id)} className="text-muted-foreground hover:text-foreground shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Estimated Total</span>
            <span className="text-xl font-bold">{currency}{totalBudget.toLocaleString()}</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BudgetPanel;
