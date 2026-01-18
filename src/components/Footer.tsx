import { Compass } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 px-4 bg-card/50 border-t border-border">
      <div className="container mx-auto">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Compass className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-semibold text-foreground">
              Rzuma
            </span>
          </a>

          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </a>
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </div>

          <p className="text-sm text-muted-foreground">
            © 2026 Rzuma. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
