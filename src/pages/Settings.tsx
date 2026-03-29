import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Compass, ArrowLeft, LogOut, Save, Crown, Calendar, Shield } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { toast } from "sonner";

const Settings = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { plan, isPremium, loading: subLoading } = useSubscription();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setDisplayName(data.display_name || "");
        setAvatarUrl(data.avatar_url || "");
      }
      setProfileLoaded(true);
    };
    fetchProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, avatar_url: avatarUrl || null })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save profile");
    } else {
      toast.success("Profile updated");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
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
            </div>
            <Button onClick={handleSaveProfile} disabled={saving || !profileLoaded} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </section>

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
                  {isPremium ? "All features unlocked" : "Upgrade for full access"}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium capitalize">
                {plan}
              </span>
            </div>

            <p className="text-sm text-muted-foreground">
              Upgrade options coming soon.
            </p>
          </div>
        </section>

        {/* Account Actions */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Account</h2>
          <div className="border border-border rounded-2xl p-5 bg-card space-y-3">
            <Button onClick={handleSignOut} variant="outline" className="w-full justify-start gap-2">
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
            <Button disabled variant="ghost" className="w-full justify-start gap-2 text-destructive opacity-50">
              Delete Account (coming soon)
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Settings;
