import { Link } from "react-router-dom";
import { Crown, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  { name: "Monthly", price: "$12.99", period: "/mo" },
  { name: "Annual", price: "$49.99", period: "/yr" },
];

const PaywallModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Upgrade to Premium</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Unlock full trip plans, PDF exports, and unlimited planning
          </p>
        </div>

        <ul className="space-y-2 mb-6">
          {[
            "View complete trip itineraries",
            "Unlimited trip plans",
            "PDF export & sharing",
            "Smart packing lists",
            "Priority AI responses",
          ].map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-foreground">
              <Check className="h-4 w-4 text-primary shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        <div className="space-y-2 mb-4">
          {plans.map((p) => (
            <Link key={p.name} to="/auth" onClick={onClose}>
              <div className={`flex items-center justify-between p-3 rounded-xl border transition-colors hover:bg-muted/50 ${
                p.badge === "Best Value" ? "border-primary bg-primary/5" : "border-border"
              }`}>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{p.name}</span>
                  {p.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">
                      {p.badge}
                    </span>
                  )}
                </div>
                <span className="font-bold text-sm">
                  {p.price}<span className="text-muted-foreground font-normal">{p.period}</span>
                </span>
              </div>
            </Link>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground text-center">
          Cancel anytime
        </p>
      </div>
    </div>
  );
};

export default PaywallModal;
