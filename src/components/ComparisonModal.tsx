import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { X, Star } from "lucide-react";
import { useTripContext } from "@/contexts/TripContext";

interface ComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ComparisonModal = ({ open, onOpenChange }: ComparisonModalProps) => {
  const { compareItems, removeFromCompare, clearCompare } = useTripContext();

  const flights = compareItems.filter(i => i.type === "flight");
  const hotels = compareItems.filter(i => i.type === "hotel");

  if (compareItems.length === 0 && open) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Compare</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground text-center py-8">
            No items to compare. Add flights or hotels using the compare button on each card.
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Compare Options</DialogTitle>
            <Button variant="ghost" size="sm" onClick={clearCompare}>Clear all</Button>
          </div>
        </DialogHeader>

        {flights.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Flights</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Airline</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Stops</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {flights.map((item) => {
                  const f = item.data as any;
                  return (
                    <TableRow key={`flight-${f.id}`}>
                      <TableCell className="text-xs font-medium">{f.airline}</TableCell>
                      <TableCell className="text-xs">{f.from} → {f.to}</TableCell>
                      <TableCell className="text-xs">{f.duration}</TableCell>
                      <TableCell className="text-xs">{f.stops === 0 ? "Direct" : `${f.stops}`}</TableCell>
                      <TableCell className="text-xs font-bold">{f.currency}{f.price}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFromCompare("flight", f.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {hotels.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Hotels</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Price/Night</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {hotels.map((item) => {
                  const h = item.data as any;
                  return (
                    <TableRow key={`hotel-${h.id}`}>
                      <TableCell className="text-xs font-medium">{h.name}</TableCell>
                      <TableCell>
                        <div className="flex">
                          {Array.from({ length: h.stars }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{h.location}</TableCell>
                      <TableCell className="text-xs font-bold">{h.currency}{h.pricePerNight}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFromCompare("hotel", h.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ComparisonModal;
