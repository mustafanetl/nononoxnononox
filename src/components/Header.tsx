import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
      <nav className="container mx-auto flex items-center justify-between glass-card rounded-2xl px-4 py-3 md:px-6">
        <a href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <Compass className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-semibold text-foreground">
            Rzuma
          </span>
        </a>

        <div className="hidden items-center gap-6 md:flex">
          <a
            href="#features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            How it works
          </a>
        </div>

        <Button variant="hero" size="sm">
          Start Planning
        </Button>
      </nav>
    </header>
  );
};

export default Header;
