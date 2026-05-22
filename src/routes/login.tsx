import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/lib/auth";
import logo from "@/assets/ararat-porto-logo.png";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Ararat Porto FC" }] }),
  component: () => (
    <AuthProvider>
      <Toaster richColors position="top-center" />
      <LoginPage />
    </AuthProvider>
  ),
});

function LoginPage() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const fn = mode === "signin" ? signInWithEmail : signUpWithEmail;
    const { error } = await fn(email, password);
    setBusy(false);
    if (error) setErr(error);
    else if (mode === "signup") setErr("Check your email to confirm your account.");
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md border-2 border-primary rounded-xl p-8 bg-card">
        <div className="flex items-center gap-3 mb-6">
          <img src={logo} alt="" className="h-10 w-10 object-contain" />
          <div>
            <p className="text-xs tracking-[0.3em] text-muted-foreground">ARARAT PORTO FC</p>
            <h1 className="font-display text-2xl tracking-wider">
              {mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
            </h1>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full mb-4 h-11 font-display tracking-wider"
          onClick={signInWithGoogle}
        >
          <svg className="h-4 w-4 mr-2" viewBox="0 0 48 48" aria-hidden>
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.3-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13.5 24 13.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.6 7.3 29 5.5 24 5.5c-7.4 0-13.8 4.2-17.7 9.2z"/>
            <path fill="#4CAF50" d="M24 43.5c5 0 9.5-1.7 12.9-4.5l-6-5c-1.9 1.3-4.3 2-6.9 2-5.2 0-9.6-3.1-11.2-7.4l-6.5 5C9.7 39.6 16.3 43.5 24 43.5z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6 5c-.4.4 6.7-4.9 6.7-14.5 0-1.2-.1-2.3-.4-3.5z"/>
          </svg>
          CONTINUE WITH GOOGLE
        </Button>

        <div className="flex items-center gap-3 my-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <Input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {err && <p className="text-sm text-destructive">{err}</p>}
          <Button type="submit" disabled={busy} className="h-11 font-display tracking-wider">
            {busy ? "…" : mode === "signin" ? "SIGN IN" : "SIGN UP"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => { setErr(""); setMode(mode === "signin" ? "signup" : "signin"); }}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground w-full text-center"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>

        <Link to="/" className="mt-6 block text-center text-xs text-muted-foreground hover:text-foreground">
          ← Back to matchday
        </Link>
      </div>
    </main>
  );
}
