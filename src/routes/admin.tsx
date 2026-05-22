import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { listUsersWithRoles, setUserApproval, type AdminUserRow } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Ararat Porto FC" }] }),
  component: () => (
    <AuthProvider>
      <Toaster richColors position="top-center" />
      <AdminPage />
    </AuthProvider>
  ),
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const list = useServerFn(listUsersWithRoles);
  const setApproval = useServerFn(setUserApproval);

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (!isAdmin) return;
    list()
      .then(setUsers)
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setLoadingList(false));
  }, [user, isAdmin, loading, list, navigate]);

  const toggle = async (u: AdminUserRow, value: boolean) => {
    setBusy(u.id);
    try {
      await setApproval({ data: { user_id: u.id, approved: value } });
      setUsers((rows) =>
        rows.map((r) => (r.id === u.id ? { ...r, is_approved: value || r.is_admin } : r)),
      );
      toast.success(value ? "Approved" : "Revoked");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;

  if (!isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="font-display text-3xl mb-2">Admins only</h1>
          <p className="text-muted-foreground mb-6">You don't have access to this page.</p>
          <Button asChild><Link to="/">Go home</Link></Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-accent" />
            <h1 className="font-display text-2xl tracking-wider">Editor Approvals</h1>
          </div>
          <Button asChild variant="outline"><Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link></Button>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-sm text-muted-foreground mb-6">
          Approve users to let them edit matches, lineups, stats and videos. Public visitors can always view.
        </p>

        {loadingList ? (
          <p className="text-muted-foreground">Loading users…</p>
        ) : users.length === 0 ? (
          <p className="text-muted-foreground italic">No users yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-4 border-2 border-border rounded-lg p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{u.email ?? "(no email)"}</p>
                  <p className="text-xs text-muted-foreground">
                    {u.is_admin ? "Admin · " : ""}joined {new Date(u.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Editor</span>
                  <Switch
                    checked={u.is_approved}
                    disabled={u.is_admin || busy === u.id}
                    onCheckedChange={(v) => toggle(u, v)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
