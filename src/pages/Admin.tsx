import { useEffect, useState, lazy, Suspense } from "react";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Loader2 } from "lucide-react";

const AdminMediaPanel = lazy(() => import("@/components/admin/AdminMediaPanel"));

type UserRow = {
  user_id: string;
  email: string | null;
  signed_up_at: string | null;
  last_sign_in_at: string | null;
  display_name: string | null;
  plan: string | null;
  subscription_status: string | null;
  expires_at: string | null;
};
type TripRow = { id: string; user_id: string; title: string; destination: string | null; status: string; created_at: string };
type SubRow = { id: string; user_id: string; plan: string; status: string; started_at: string; expires_at: string | null };
type EmailRow = { message_id: string | null; template_name: string; recipient_email: string; status: string; created_at: string; error_message: string | null };

const statusColor = (s: string) =>
  s === "sent" ? "bg-green-500/15 text-green-700 dark:text-green-400"
  : s === "dlq" || s === "failed" || s === "bounced" ? "bg-red-500/15 text-red-700 dark:text-red-400"
  : s === "suppressed" || s === "complained" ? "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400"
  : "bg-muted text-muted-foreground";

const Admin = () => {
  const { isAdmin, loading } = useIsAdmin();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [search, setSearch] = useState("");
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [u, t, s, e] = await Promise.all([
        supabase.from("admin_users_overview" as any).select("*").order("signed_up_at", { ascending: false }),
        supabase.from("saved_trips").select("id,user_id,title,destination,status,created_at").order("created_at", { ascending: false }).limit(200),
        supabase.from("subscriptions").select("id,user_id,plan,status,started_at,expires_at").order("started_at", { ascending: false }),
        supabase.from("email_send_log").select("message_id,template_name,recipient_email,status,created_at,error_message").order("created_at", { ascending: false }).limit(500),
      ]);
      setUsers((u.data as any) ?? []);
      setTrips((t.data as any) ?? []);
      setSubs((s.data as any) ?? []);
      // Dedupe emails by message_id (latest first already)
      const seen = new Set<string>();
      const deduped = ((e.data as any) ?? []).filter((row: EmailRow) => {
        const key = row.message_id ?? `${row.recipient_email}-${row.created_at}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setEmails(deduped);
      setDataLoading(false);
    })();
  }, [isAdmin]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!isAdmin) return <Navigate to="/" replace />;

  const q = search.trim().toLowerCase();
  const filteredUsers = users.filter(u => !q || (u.email ?? "").toLowerCase().includes(q) || (u.display_name ?? "").toLowerCase().includes(q));
  const filteredTrips = trips.filter(t => !q || t.title.toLowerCase().includes(q) || (t.destination ?? "").toLowerCase().includes(q));
  const filteredEmails = emails.filter(e => !q || e.recipient_email.toLowerCase().includes(q) || e.template_name.toLowerCase().includes(q));

  const stats = {
    users: users.length,
    paid: subs.filter(s => s.plan !== "free" && s.status === "active").length,
    trips: trips.length,
    emailsSent: emails.filter(e => e.status === "sent").length,
    emailsFailed: emails.filter(e => ["dlq", "failed", "bounced"].includes(e.status)).length,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /></Link>
            <h1 className="text-xl font-semibold">Admin</h1>
          </div>
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            ["Users", stats.users],
            ["Paid", stats.paid],
            ["Trips", stats.trips],
            ["Emails sent", stats.emailsSent],
            ["Emails failed", stats.emailsFailed],
          ].map(([label, val]) => (
            <Card key={label as string} className="p-4">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="text-2xl font-semibold mt-1">{val}</div>
            </Card>
          ))}
        </div>

        {dataLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <Tabs defaultValue="users">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="trips">Trips</TabsTrigger>
              <TabsTrigger value="subs">Subscriptions</TabsTrigger>
              <TabsTrigger value="emails">Emails</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Signed up</TableHead>
                      <TableHead>Last seen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-mono text-xs">{u.email}</TableCell>
                        <TableCell>{u.display_name ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={u.plan && u.plan !== "free" ? "default" : "secondary"}>
                            {u.plan ?? "free"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{u.signed_up_at ? new Date(u.signed_up_at).toLocaleDateString() : "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="trips">
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrips.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{t.title}</TableCell>
                        <TableCell>{t.destination ?? "—"}</TableCell>
                        <TableCell><Badge variant="secondary">{t.status}</Badge></TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{t.user_id.slice(0, 8)}…</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="subs">
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Expires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subs.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.user_id.slice(0, 8)}…</TableCell>
                        <TableCell><Badge>{s.plan}</Badge></TableCell>
                        <TableCell>{s.status}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(s.started_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="emails">
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmails.map((e, i) => (
                      <TableRow key={(e.message_id ?? "") + i}>
                        <TableCell className="text-sm">{e.template_name}</TableCell>
                        <TableCell className="font-mono text-xs">{e.recipient_email}</TableCell>
                        <TableCell><span className={`px-2 py-0.5 rounded text-xs ${statusColor(e.status)}`}>{e.status}</span></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-red-600 max-w-xs truncate">{e.error_message ?? ""}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="media">
              <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
                <AdminMediaPanel />
              </Suspense>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default Admin;