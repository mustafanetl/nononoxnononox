import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import TripDetail from "./TripDetail";
import { LogoMark } from "@/components/Logo";
import { toast } from "sonner";

const SharedTrip = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState<any | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "missing">("loading");

  useEffect(() => {
    let cancelled = false;
    if (!slug) { setStatus("missing"); return; }
    (async () => {
      const { data, error } = await supabase
        .from("shared_trips")
        .select("data_json, destination, title")
        .eq("slug", slug)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data || !data.data_json) {
        setStatus("missing");
        return;
      }
      const payload = data.data_json as any;
      // Snapshot may have been stored in either {data, destination, ...} or as the raw plan.
      const normalized = payload.data
        ? payload
        : { data: payload, destination: data.destination || "", enrichedImages: [], itineraryVenuePhotos: {} };
      setSnapshot(normalized);
      setStatus("ok");
      // Fire-and-forget view counter bump.
      try { await supabase.rpc("increment_shared_trip_views", { _slug: slug }); } catch {}
    })();
    return () => { cancelled = true; };
  }, [slug]);

  // Auto-import after returning from auth with ?import=1
  useEffect(() => {
    if (status !== "ok" || !snapshot || !user) return;
    if (params.get("import") !== "1") return;
    (async () => {
      try {
        const { error } = await supabase.from("saved_trips").insert({
          user_id: user.id,
          title: `Trip to ${snapshot.destination || "your destination"}`,
          destination: snapshot.destination || null,
          data_json: snapshot.data,
          status: "planning",
        });
        if (error) throw error;
        sessionStorage.setItem("jolliday-trip-detail", JSON.stringify(snapshot));
        toast.success("Trip imported to your account!");
        navigate("/trip/view", { replace: true });
      } catch {
        toast.error("Couldn't import trip");
      }
    })();
  }, [status, snapshot, user, params, navigate]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex items-center gap-3 text-white/50">
          <LogoMark size={20} color="hsl(234 62% 47%)" className="animate-spin" /> Loading shared trip…
        </div>
      </div>
    );
  }

  if (status === "missing" || !snapshot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-bold text-white">This shared trip isn't available</h1>
          <p className="text-white/50">The link may have expired or been removed.</p>
          <button
            onClick={() => navigate("/")}
            className="mt-2 px-4 py-2 rounded-md bg-white text-black text-sm font-medium hover:opacity-90"
          >
            Plan your own trip
          </button>
        </div>
      </div>
    );
  }

  return <TripDetail mode="shared" shareSlug={slug} initialSnapshot={snapshot} />;
};

export default SharedTrip;