import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);

      // Send welcome email on first signup
      if (event === 'SIGNED_IN' && session?.user) {
        const isNewUser = new Date(session.user.created_at).getTime() > Date.now() - 60000;
        if (isNewUser) {
          const name = session.user.user_metadata?.display_name || 
                       session.user.user_metadata?.full_name ||
                       session.user.email?.split('@')[0];
          supabase.functions.invoke('send-transactional-email', {
            body: {
              templateName: 'welcome',
              recipientEmail: session.user.email,
              idempotencyKey: `welcome-${session.user.id}`,
              templateData: { name },
            },
          }).catch(console.error);
        }
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, loading, signOut };
};
