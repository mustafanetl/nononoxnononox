import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { MapPin, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <MapPin className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight mb-3">Lost?</h1>
        <p className="text-lg text-muted-foreground mb-8">
          This page doesn't exist — but your next trip could. Let's plan it.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Plan a trip <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground font-medium text-sm hover:bg-muted transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
      <div className="mt-12 opacity-50">
        <Logo size="sm" />
      </div>
    </div>
  );
};

export default NotFound;
