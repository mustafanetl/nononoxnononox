import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Compass, ArrowLeft, LogOut, Save, Crown, Shield, MapPin, Utensils, CreditCard, Loader2 } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import CancelSubscriptionModal from "@/components/CancelSubscriptionModal";
import { toast } from "sonner";
import { startCheckout } from "@/lib/stripeCheckout";

const TRAVEL_STYLES = ["budget", "mid-range", "luxury"] as const;
const DIETARY_OPTIONS = ["Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-free", "Dairy-free", "Nut allergy", "Pescatarian"];

const Settings = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { plan, isPremium, loading: subLoading, subscriptionEnd, cancelAtPeriodEnd, refreshSubscription } = useSubscription();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [homeCity, setHomeCity] = useState("");
  const [travelStyle, setTravelStyle] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [{ data: profile }, { data: prefs }] = await Promise.all([
        supabase.from("profiles").select("display_name, avatar_url").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      if (profile) {
        setDisplayName(profile.display_name || "");
        setAvatarUrl(profile.avatar_url || "");
      }
      if (prefs) {
        setHomeCity((prefs as any).home_city || "");
        setTravelStyle((prefs as any).travel_style || "");
        setDietaryRestrictions((prefs as any).dietary_restrictions || []);
      }
      setProfileLoaded(true);
    };
    fetchData();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const [profileRes, prefsRes] = await Promise.all([
      supabase.from("profiles").update({ display_name: displayName, avatar_url: avatarUrl || null }).eq("user_id", user.id),
      (async () => {
        const { data: existing } = await supabase.from("user_preferences").select("id").eq("user_id", user.id).maybeSingle();
        const payload = {
          user_id: user.id,
          home_city: homeCity || null,
          travel_style: travelStyle || null,
          dietary_restrictions: dietaryRestrictions,
          display_name: displayName || null,
          updated_at: new Date().toISOString(),
        } as any;
        if (existing) {
          return supabase.from("user_preferences").update(payload).eq("user_id", user.id);
        }
        return supabase.from("user_preferences").insert(payload);
      })(),
    ]);

    setSaving(false);
    if (profileRes.error || prefsRes.error) {
      toast.error("Failed to save settings");
    } else {
      try {
        const currentPrefs = JSON.parse(localStorage.getItem("jolliday-preferences") || "{}");
        const merged = {
          ...currentPrefs,
          displayName: displayName || "",
          homeCity: homeCity || "",
          travelStyle: travelStyle || "",
          dietaryRestrictions: dietaryRestrictions || [],
        };
        localStorage.setItem("jolliday-preferences", JSON.stringify(merged));
        window.dispatchEvent(new Event("jolliday-preferences-updated"));
      } catch { /* ignore */ }
      toast.success("Settings saved — Jolliday will remember your preferences ✨");
    }
  };

  const toggleDietary = (item: string) => {
    setDietaryRestrictions(prev =>
      prev.includes(item) ? prev.filter(d => d !== item) : [...prev, item]
    );
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleManagePortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch {
      toast.error("Failed to open subscription portal");
    }
    setPortalLoading(false);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <nav className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5" />
              <span className="font-semibold">Settings</span>
            </div>
          </div>
          <ThemeToggle />
        </nav>
      </header>

      <main className="container mx-auto px-4 pt-20 pb-12 max-w-lg">
        {/* Profile Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4" /> Profile
          </h2>
          <div className="border border-border rounded-2xl p-5 bg-card space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email || ""} disabled className="mt-1 opacity-60" />
            </div>
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Jolliday will use this to personalize your experience</p>
            </div>
          </div>
        </section>

        {/* Travel Preferences Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Travel Preferences
          </h2>
          <div className="border border-border rounded-2xl p-5 bg-card space-y-5">
            <div>
              <Label htmlFor="homeCity">Home City</Label>
              <Input
                id="homeCity"
                value={homeCity}
                onChange={(e) => setHomeCity(e.target.value)}
                placeholder="e.g. Rotterdam, London, NYC"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Used for local recommendations & departure suggestions</p>
            </div>

            <div>
              <Label>Travel Style</Label>
              <div className="flex gap-2 mt-2">
                {TRAVEL_STYLES.map((style) => (
                  <button
                    key={style}
                    onClick={() => setTravelStyle(travelStyle === style ? "" : style)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors capitalize ${
                      travelStyle === style
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Jolliday will match prices & suggestions to your style</p>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Utensils className="h-3.5 w-3.5" /> Dietary Restrictions
              </Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DIETARY_OPTIONS.map((item) => (
                  <button
                    key={item}
                    onClick={() => toggleDietary(item)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      dietaryRestrictions.includes(item)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Restaurant suggestions will automatically filter for these</p>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="mb-8">
          <Button onClick={handleSave} disabled={saving || !profileLoaded} className="w-full gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save All Changes"}
          </Button>
        </div>

        {/* Subscription Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Crown className="h-4 w-4" /> Subscription
          </h2>
          <div className="border border-border rounded-2xl p-5 bg-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium capitalize">{plan} Plan</p>
                <p className="text-sm text-muted-foreground">
                  {isPremium
                    ? cancelAtPeriodEnd
                      ? "Cancels at end of period"
                      : "All features unlocked"
                    : "Upgrade for full access"}
                </p>
                {isPremium && subscriptionEnd && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {cancelAtPeriodEnd ? "Access until" : "Renews"}: {new Date(subscriptionEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium capitalize">
                {plan}
              </span>
            </div>

            {isPremium ? (
              <div className="space-y-2 pt-2 border-t border-border">
                <Button
                  onClick={handleManagePortal}
                  disabled={portalLoading}
                  variant="outline"
                  className="w-full gap-2"
                >
                  {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  Manage Billing
                </Button>
                {!cancelAtPeriodEnd && (
                  <Button
                    onClick={() => setShowCancelModal(true)}
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-destructive"
                  >
                    Cancel Subscription
                  </Button>
                )}
              </div>
            ) : (
              <div className="pt-2 border-t border-border">
                <Button
                  onClick={() => startCheckout("annual")}
                  className="w-full gap-2"
                >
                  <Crown className="h-4 w-4" />
                  Upgrade to Premium
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Account Actions */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Account</h2>
          <div className="border border-border rounded-2xl p-5 bg-card">
            <Button onClick={handleSignOut} variant="outline" className="w-full justify-start gap-2">
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </div>
        </section>
      </main>

      <CancelSubscriptionModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onCanceled={refreshSubscription}
      />
    </div>
  );
};

export default Settings;
