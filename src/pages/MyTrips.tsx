import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Compass, Plus, MapPin, Calendar, Trash2, ArrowLeft, Play } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useRzumaChat } from "@/hooks/useRzumaChat";
import { toast } from "sonner";

type SavedTrip = {
  id: string;
  title: string;
  destination: string | null;
  occasion: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

const statusColors: Record<string, string> = {
  planning: "bg-accent text-accent-foreground",
  booked: "bg-primary text-primary-foreground",
  completed: "bg-muted text-muted-foreground",
};

const MyTrips = () => {
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrips = async () => {
      const { data, error } = await supabase
        .from("saved_trips")
        .select("id, title, destination, occasion, status, created_at, updated_at")
        .order("updated_at", { ascending: false });

      if (error) {
        toast.error("Failed to load trips");
        console.error(error);
      } else {
        setTrips(data || []);
      }
      setLoading(false);
    };
    fetchTrips();
  }, []);

  const deleteTrip = async (id: string) => {
    const { error } = await supabase.from("saved_trips").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete trip");
    } else {
      setTrips((prev) => prev.filter((t) => t.id !== id));
      toast.success("Trip deleted");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <nav className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5" />
              <span className="font-semibold">My Trips</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/chat">
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" /> New Trip
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 pt-20 pb-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        ) : trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No trips yet</h2>
            <p className="text-muted-foreground mb-6">Start planning your first adventure with Rzuma</p>
            <Link to="/chat">
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Plan a Trip
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {trips.map((trip) => (
              <div key={trip.id} className="group border border-border rounded-2xl p-5 bg-card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-base">{trip.title}</h3>
                    {trip.destination && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" /> {trip.destination}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColors[trip.status] || statusColors.planning}`}>
                    {trip.status}
                  </span>
                </div>

                {trip.occasion && (
                  <p className="text-xs text-muted-foreground capitalize mb-3">🎯 {trip.occasion}</p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(trip.updated_at).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteTrip(trip.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyTrips;
