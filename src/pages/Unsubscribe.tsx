import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, MailX } from "lucide-react";

type Status = "loading" | "valid" | "already" | "invalid" | "confirming" | "done" | "error";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    const validate = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: anonKey } }
        );
        const data = await res.json();
        if (data.valid === false && data.reason === "already_unsubscribed") {
          setStatus("already");
        } else if (data.valid) {
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      } catch {
        setStatus("invalid");
      }
    };
    validate();
  }, [token]);

  const handleConfirm = async () => {
    setStatus("confirming");
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) {
        setStatus("done");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Validating your request...</p>
          </>
        )}

        {status === "valid" && (
          <>
            <MailX className="h-12 w-12 text-foreground mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Unsubscribe</h1>
            <p className="text-muted-foreground">
              Are you sure you want to unsubscribe from Jolliday emails?
            </p>
            <button
              onClick={handleConfirm}
              className="w-full py-3 rounded-xl bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Confirm Unsubscribe
            </button>
          </>
        )}

        {status === "confirming" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Processing...</p>
          </>
        )}

        {status === "done" && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Unsubscribed</h1>
            <p className="text-muted-foreground">
              You've been unsubscribed from Jolliday emails. You can always resubscribe in your account settings.
            </p>
          </>
        )}

        {status === "already" && (
          <>
            <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Already Unsubscribed</h1>
            <p className="text-muted-foreground">
              You've already been unsubscribed from Jolliday emails.
            </p>
          </>
        )}

        {(status === "invalid" || status === "error") && (
          <>
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">
              {status === "invalid" ? "Invalid Link" : "Something Went Wrong"}
            </h1>
            <p className="text-muted-foreground">
              {status === "invalid"
                ? "This unsubscribe link is invalid or has expired."
                : "We couldn't process your request. Please try again later."}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Unsubscribe;
