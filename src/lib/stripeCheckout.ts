import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function startCheckout(plan: "monthly" | "annual") {
  try {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { plan },
    });

    if (error) throw error;
    if (data?.url) {
      window.open(data.url, "_blank");
    } else {
      throw new Error("No checkout URL returned");
    }
  } catch (err: any) {
    console.error("Checkout error:", err);
    toast.error("Failed to start checkout. Please try again.");
  }
}
