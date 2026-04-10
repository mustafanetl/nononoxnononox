import { X, AlertTriangle, Gift, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCurrencyPrices } from "@/utils/currencyLocale";

interface CancelSubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  onCanceled: () => void;
}

const REASONS = [
  "Too expensive",
  "Not using it enough",
  "Found an alternative",
  "Missing features",
  "Other",
];

const CancelSubscriptionModal = ({ open, onClose, onCanceled }: CancelSubscriptionModalProps) => {
  const [step, setStep] = useState<"reason" | "offer">("reason");
  const [selectedReason, setSelectedReason] = useState("");
  const [loading, setLoading] = useState(false);
  const prices = getCurrencyPrices();

  if (!open) return null;

  const handleReasonNext = () => {
    if (!selectedReason) {
      toast.error("Please select a reason");
      return;
    }
    setStep("offer");
  };

  const handleApplyDiscount = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription", {
        body: { action: "apply_discount", cancel_reason: selectedReason },
      });
      if (error) throw error;
      toast.success("Discount applied! Your next month is just $2 🎉");
      onCanceled();
      onClose();
    } catch {
      toast.error("Failed to apply discount. Please try again.");
    }
    setLoading(false);
  };

  const handleConfirmCancel = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription", {
        body: { action: "cancel", cancel_reason: selectedReason },
      });
      if (error) throw error;

      // Send cancellation email
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const name = user.user_metadata?.display_name || user.user_metadata?.full_name || user.email.split('@')[0];
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "cancellation",
            recipientEmail: user.email,
            idempotencyKey: `cancellation-${user.id}-${Date.now()}`,
            templateData: { name, reason: selectedReason },
          },
        }).catch(console.error);
      }

      toast.success("Subscription will cancel at end of billing period");
      onCanceled();
      onClose();
    } catch {
      toast.error("Failed to cancel. Please try again.");
    }
    setLoading(false);
  };

  const handleClose = () => {
    setStep("reason");
    setSelectedReason("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in">
        <button onClick={handleClose} className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors">
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        {step === "reason" ? (
          <>
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="text-xl font-bold text-foreground">We're sorry to see you go</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Tell us why you're canceling so we can improve
              </p>
            </div>

            <div className="space-y-2 mb-5">
              {REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`w-full text-left p-3 rounded-xl border transition-all text-sm ${
                    selectedReason === reason
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <button
              onClick={handleReasonNext}
              disabled={!selectedReason}
              className="w-full py-3 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Continue
            </button>
          </>
        ) : (
          <>
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Gift className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Wait — how about a deal? 🎁</h3>
              <p className="text-sm text-muted-foreground mt-1">
                We'd love to keep you. How about <span className="font-bold text-foreground">{prices.symbol}2</span> for your next month instead of {prices.symbol}{prices.monthly}?
              </p>
            </div>

            <div className="border border-primary/30 bg-primary/5 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Special Offer</p>
                  <p className="text-xs text-muted-foreground">Next month only, then {prices.symbol}{prices.monthly}/mo</p>
                </div>
                <span className="text-2xl font-bold text-primary">{prices.symbol}2</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleApplyDiscount}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
                Accept — Pay {prices.symbol}2 Next Month
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={loading}
                className="w-full py-3 rounded-xl border border-border text-muted-foreground font-medium text-sm hover:bg-muted/50 transition-colors disabled:opacity-50"
              >
                No thanks, cancel anyway
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CancelSubscriptionModal;
