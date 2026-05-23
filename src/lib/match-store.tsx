import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export type Format = "5v5" | "7v7" | "8v8" | "11v11";
export type Player = { name: string; photo_url?: string; email?: string };
export type Stat = { label: string; home: number; away: number };
export type Goal = { id: number; team: "home" | "away"; minute: string; scorer: string; assist: string };
export type Video = { id: number; title: string; url: string };

export type MatchState = {
  id: string | null;
  name: string;
  opponent: string;
  match_date: string;
  kickoff: string;
  duration: string;
  location: string;
  format: Format;
  home_color: string;
  away_color: string;
  home_players: Player[];
  away_players: Player[];
  stats: Stat[];
  goals: Goal[];
  videos: Video[];
};

const DEFAULT_STATS: Stat[] = [
  { label: "Shots on Target", home: 0, away: 0 },
  { label: "Possession %", home: 50, away: 50 },
  { label: "Corners", home: 0, away: 0 },
  { label: "Fouls", home: 0, away: 0 },
  { label: "Yellow Cards", home: 0, away: 0 },
];

export const defaultMatch = (): MatchState => ({
  id: null,
  name: "Matchday 01",
  opponent: "Guest FC",
  match_date: "2026-05-30",
  kickoff: "19:00",
  duration: "2 hours",
  location: "R. de Alves Redol 292, 4050-042 Porto",
  format: "7v7",
  home_color: "#1e3a5f",
  away_color: "#d44a2a",
  home_players: [],
  away_players: [],
  stats: DEFAULT_STATS,
  goals: [],
  videos: [],
});

export function normalizePlayers(raw: unknown): Player[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((p) => {
    if (typeof p === "string") return { name: p };
    if (p && typeof p === "object") {
      const obj = p as Record<string, unknown>;
      return {
        name: typeof obj.name === "string" ? obj.name : "",
        photo_url: typeof obj.photo_url === "string" ? obj.photo_url : undefined,
        email: typeof obj.email === "string" ? obj.email : undefined,
      };
    }
    return { name: "" };
  });
}

type Ctx = {
  match: MatchState;
  update: <K extends keyof MatchState>(key: K, value: MatchState[K]) => void;
  reset: () => void;
  load: (m: MatchState) => void;
  save: (opts?: { quiet?: boolean; state?: MatchState }) => Promise<string | null>;
  saving: boolean;
  canEdit: boolean;
  createNewMatch: () => Promise<string | null>;
};

const MatchCtx = createContext<Ctx | null>(null);

export function MatchProvider({ children }: { children: ReactNode }) {
  const { user, isApproved } = useAuth();
  // A logged-in user can edit only if an admin has approved them (admin or moderator role).
  // Toggle this per user from the /admin "Editor Approvals" page.
  const canEdit = !!user && isApproved;
  const [match, setMatch] = useState<MatchState>(defaultMatch());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load the latest match for everyone (logged in or not) so the squad,
    // players, stats and videos are publicly visible.
    supabase
      .from("matches")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setMatch({
            id: data.id,
            name: data.name,
            opponent: data.opponent,
            match_date: data.match_date ?? "",
            kickoff: data.kickoff ?? "",
            duration: data.duration ?? "",
            location: data.location ?? "",
            format: (data.format as Format) ?? "7v7",
            home_color: data.home_color,
            away_color: data.away_color,
            home_players: normalizePlayers(data.home_players),
            away_players: normalizePlayers(data.away_players),
            stats: (data.stats as Stat[]) ?? DEFAULT_STATS,
            goals: (data.goals as Goal[]) ?? [],
            videos: (data.videos as Video[]) ?? [],
          });
        }
      });
  }, [user]); // re-fetch on mount and whenever auth state changes

  const save = useCallback(async (opts?: { quiet?: boolean; state?: MatchState }): Promise<string | null> => {
    const m = opts?.state ?? match;
    setSaving(true);
    try {
      const payload = {
        name: m.name,
        opponent: m.opponent,
        match_date: m.match_date || null,
        kickoff: m.kickoff || null,
        duration: m.duration || null,
        location: m.location || null,
        format: m.format,
        home_color: m.home_color,
        away_color: m.away_color,
        home_players: m.home_players,
        away_players: m.away_players,
        stats: m.stats,
        goals: m.goals,
        videos: m.videos,
        // Bump updated_at so this game is always "the latest" loaded on next visit.
        // (There is no DB trigger to do this automatically.)
        updated_at: new Date().toISOString(),
      };

      if (m.id) {
        const { error } = await supabase.from("matches").update(payload).eq("id", m.id);
        if (error) throw error;
        if (!opts?.quiet) toast.success("Match updated");
        return m.id;
      } else {
        const { data, error } = await supabase.from("matches").insert(payload).select().single();
        if (error) throw error;
        setMatch((prev) => ({ ...prev, id: data.id }));
        if (!opts?.quiet) toast.success("Match saved");
        return data.id as string;
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
      return null;
    } finally {
      setSaving(false);
    }
  }, [match]);

  const matchRef = useRef(match);
  const saveRef = useRef(save);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  matchRef.current = match;
  saveRef.current = save;

  const update = useCallback(<K extends keyof MatchState>(key: K, value: MatchState[K]) => {
    if (!user) {
      toast.error("Sign in to edit");
      return;
    }
    if (!isApproved) {
      toast.error("Your account isn't approved to edit yet. Ask an admin for editor access.");
      return;
    }
    setMatch((m) => ({ ...m, [key]: value }));
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveRef.current({ quiet: true }), 2000);
  }, [user, isApproved]);

  const reset = useCallback(() => setMatch(defaultMatch()), []);
  const load = useCallback((m: MatchState) => setMatch(m), []);

  const createNewMatch = useCallback(async (): Promise<string | null> => {
    const next = defaultMatch();
    next.name = `Matchday ${Date.now().toString().slice(-4)}`;
    setMatch(next);
    // Pass the fresh state explicitly — `save` would otherwise read the previous
    // match from its closure on this render tick.
    const saved = await saveRef.current({ state: next });
    if (saved) setMatch((m) => ({ ...m, id: saved }));
    return saved;
  }, []);

  return (
    <MatchCtx.Provider value={{ match, update, reset, load, save, saving, canEdit, createNewMatch }}>
      {children}
    </MatchCtx.Provider>
  );
}

export function useMatch() {
  const ctx = useContext(MatchCtx);
  if (!ctx) throw new Error("useMatch must be inside MatchProvider");
  return ctx;
}