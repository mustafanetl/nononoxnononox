import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const MobileStickyCTA = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportH = window.innerHeight;
      const docH = document.documentElement.scrollHeight;
      const footer = document.querySelector("footer");
      const footerTop = footer
        ? footer.getBoundingClientRect().top + window.scrollY
        : docH;

      const pastHero = scrollY > viewportH * 0.7;
      const beforeFooter = scrollY + viewportH < footerTop + 40;
      setVisible(pastHero && beforeFooter);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <div
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border transition-transform duration-200 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="text-sm font-medium text-foreground leading-tight">
          Ready to plan your trip?
        </div>
        <div className="flex flex-col items-center shrink-0">
          <Link to="/auth">
            <Button size="sm" className="rounded-full gap-1">
              Start free trial
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <p className="text-[10px] text-muted-foreground mt-1">
            3-day free trial · Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileStickyCTA;