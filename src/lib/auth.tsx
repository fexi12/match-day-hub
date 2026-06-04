import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);
const AUTH_RETURN_TO_KEY = "match-day-hub:returnTo";

function getOAuthError(search: string, hash: string) {
  const sources = [new URLSearchParams(search), new URLSearchParams(hash.replace(/^#/, ""))];
  for (const params of sources) {
    const error = params.get("error");
    const description = params.get("error_description");
    const code = params.get("error_code");
    if (error || description || code) {
      return description || error || code || "Google sign-in failed. Please try again.";
    }
  }
  return null;
}

function scrubOAuthCallbackUrl() {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  const authSearchParams = ["code", "error", "error_code", "error_description"];
  authSearchParams.forEach((param) => url.searchParams.delete(param));

  const hash = window.location.hash || "";
  const hasAuthHash =
    hash.includes("access_token=") ||
    hash.includes("refresh_token=") ||
    hash.includes("error=") ||
    hash.includes("error_description=");

  if (hasAuthHash) url.hash = "";

  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    const consumeOAuthCallback = async () => {
      if (typeof window === "undefined") return;

      const hash = window.location.hash || "";
      const search = window.location.search || "";
      const callbackError = getOAuthError(search, hash);

      if (callbackError) {
        console.warn("[auth] OAuth callback error:", callbackError);
        toast.error(callbackError);
        scrubOAuthCallbackUrl();
        return;
      }

      // Implicit flow callback (#access_token=...&refresh_token=...)
      if (hash.includes("access_token=") && hash.includes("refresh_token=")) {
        const params = new URLSearchParams(hash.replace(/^#/, ""));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        try {
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) {
              console.warn("[auth] Failed to consume OAuth hash callback:", error);
              toast.error(error.message || "Google sign-in failed. Please try again.");
            }
          }
        } finally {
          // Always scrub sensitive tokens from URL.
          scrubOAuthCallbackUrl();
        }
        return;
      }

      // PKCE flow callback (?code=...)
      const qs = new URLSearchParams(search);
      const code = qs.get("code");
      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.warn("[auth] Failed to exchange OAuth code:", error);
            toast.error(error.message || "Google sign-in failed. Please try again.");
          }
        } finally {
          scrubOAuthCallbackUrl();
        }
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });

    consumeOAuthCallback().finally(() => {
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session);
        setLoading(false);
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) {
      setIsAdmin(false);
      setIsApproved(false);
      return;
    }

    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .then(({ data }) => {
        const roles = new Set((data ?? []).map((r) => r.role));
        const admin = roles.has("admin");
        setIsAdmin(admin);
        setIsApproved(admin || roles.has("moderator"));
      });

    // Save Google profile photo so squads can show it by email
    const meta = session?.user?.user_metadata as
      | { avatar_url?: string; picture?: string }
      | undefined;
    const email = session?.user?.email;
    const avatar = meta?.avatar_url ?? meta?.picture;
    if (email && avatar) {
      supabase
        .from("player_avatars")
        .upsert({
          email: email.toLowerCase(),
          avatar_url: avatar,
          updated_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error) console.warn("[auth] avatar upsert", error);
        });
    }
  }, [session?.user?.email, session?.user?.id, session?.user?.user_metadata]);

  const signInWithGoogle = async () => {
    try {
      if (typeof window !== "undefined") {
        const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (returnTo && returnTo !== "/login") {
          window.localStorage.setItem(AUTH_RETURN_TO_KEY, returnTo);
        }
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });

      if (error) toast.error(error.message ?? "Sign-in failed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign-in failed";
      toast.error(message);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error: error?.message };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
  };

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        isAdmin,
        isApproved,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be inside AuthProvider");
  return v;
}
