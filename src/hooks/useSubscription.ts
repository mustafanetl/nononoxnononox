import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type SubscriptionPlan = "free" | "monthly" | "annual" | "lifetime";

export function useSubscription() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<SubscriptionPlan>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPlan("free");
      setLoading(false);
      return;
    }

    const fetchSub = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("subscriptions")
        .select("plan, status, expires_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data && data.status === "active") {
        // Check if expired
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          setPlan("free");
        } else {
          setPlan(data.plan as SubscriptionPlan);
        }
      } else {
        setPlan("free");
      }
      setLoading(false);
    };

    fetchSub();
  }, [user]);

  const isPremium = plan !== "free";

  return { plan, isPremium, loading };
}
