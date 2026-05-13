import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type SubscriptionPlan = "free" | "monthly" | "annual";

interface SubscriptionState {
  plan: SubscriptionPlan;
  subscriptionId: string | null;
  subscriptionEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export function useSubscription() {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    plan: "free",
    subscriptionId: null,
    subscriptionEnd: null,
    cancelAtPeriodEnd: false,
  });
  const [loading, setLoading] = useState(true);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setState({ plan: "free", subscriptionId: null, subscriptionEnd: null, cancelAtPeriodEnd: false });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      // Treat transient edge-runtime outages (503 SERVICE_DEGRADED) as "unknown" — fall back, don't throw to UI.
      if (error) throw error;

      if (data?.subscribed) {
        setState({
          plan: (data.plan as SubscriptionPlan) || "monthly",
          subscriptionId: data.subscription_id || null,
          subscriptionEnd: data.subscription_end || null,
          cancelAtPeriodEnd: data.cancel_at_period_end || false,
        });
      } else {
        setState({ plan: "free", subscriptionId: null, subscriptionEnd: null, cancelAtPeriodEnd: false });
      }
    } catch {
      // Edge function unreachable (e.g. 503 SUPABASE_EDGE_RUNTIME_SERVICE_DEGRADED).
      // Fall back to DB check; if that also fails, default to free silently so the UI never blanks.
      try {
        const { data } = await supabase
          .from("subscriptions")
          .select("plan, status, expires_at")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data && data.status === "active" && (!data.expires_at || new Date(data.expires_at) >= new Date())) {
          setState({
            plan: data.plan as SubscriptionPlan,
            subscriptionId: null,
            subscriptionEnd: data.expires_at,
            cancelAtPeriodEnd: false,
          });
        } else {
          setState({ plan: "free", subscriptionId: null, subscriptionEnd: null, cancelAtPeriodEnd: false });
        }
      } catch {
        setState({ plan: "free", subscriptionId: null, subscriptionEnd: null, cancelAtPeriodEnd: false });
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;

    setLoading(true);
    checkSubscription();
    // Auto-refresh every 60 seconds
    const interval = setInterval(checkSubscription, 60_000);
    return () => clearInterval(interval);
  }, [authLoading, checkSubscription]);

  const isPremium = true; // PAUSED — everything free/unlimited

  return {
    plan: state.plan,
    isPremium,
    loading,
    subscriptionId: state.subscriptionId,
    subscriptionEnd: state.subscriptionEnd,
    cancelAtPeriodEnd: state.cancelAtPeriodEnd,
    refreshSubscription: checkSubscription,
  };
}
