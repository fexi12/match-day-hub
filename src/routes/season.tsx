import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Trophy, Target, Handshake, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  normalizePlayers,
  playerIdentity,
  type Goal,
  type Player,
  type Stat,
} from "@/lib/match-store";
import { FIVE_MODE_LABEL, type FiveModeState, type FiveSide } from "@/lib/five-mode";

type MatchRow = {
  id: string;
  name: string;
  match_date: string | null;
  format: string | null;
  home_players: unknown;
  away_players: unknown;
  goals: unknown;
  stats: unknown;
};

type PlayerSeasonStats = {
  key: string;
  name: string;
  appearances: number;
  goals: number;
  assists: number;
  matches: Set<string>;
};

export const Route = createFileRoute("/season")({
  head: () => ({
    meta: [
      { title: "Season Stats — Ararat Porto FC" },
      {
        name: "description",
        content: "Season statistics for Ararat Porto FC players: goals, assists and appearances.",
      },
    ],
  }),
  component: SeasonPage,
});

const displayYear = new Date().getFullYear();

const normalizeNameKey = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

const playerKeyFrom = (player: Pick<Player, "id" | "email" | "name">) =>
  playerIdentity(player) || normalizeNameKey(player.name || player.email || "");

const getOrCreate = (
  table: Map<string, PlayerSeasonStats>,
  key: string,
  name: string,
): PlayerSeasonStats => {
  const cleanKey = key || normalizeNameKey(name);
  if (!table.has(cleanKey)) {
    table.set(cleanKey, {
      key: cleanKey,
      name: name || "Unknown player",
      appearances: 0,
      goals: 0,
      assists: 0,
      matches: new Set<string>(),
    });
  }
  const row = table.get(cleanKey)!;
  if ((!row.name || row.name === "Unknown player") && name) row.name = name;
  return row;
};

const addAppearance = (table: Map<string, PlayerSeasonStats>, matchId: string, player: Player) => {
  if (!player.name && !player.email) return;
  const row = getOrCreate(
    table,
    playerKeyFrom(player),
    player.name || player.email || "Unknown player",
  );
  if (!row.matches.has(matchId)) {
    row.matches.add(matchId);
    row.appearances += 1;
  }
};

const addGoals = (
  table: Map<string, PlayerSeasonStats>,
  key: string | undefined,
  name: string | undefined,
  goals: number,
) => {
  if (!goals || goals <= 0 || (!key && !name)) return;
  getOrCreate(table, key || "", name || "Unknown player").goals += goals;
};

const addAssists = (
  table: Map<string, PlayerSeasonStats>,
  key: string | undefined,
  name: string | undefined,
  assists: number,
) => {
  if (!assists || assists <= 0 || (!key && !name)) return;
  getOrCreate(table, key || "", name || "Unknown player").assists += assists;
};

const applyStandardMatch = (table: Map<string, PlayerSeasonStats>, match: MatchRow) => {
  const homePlayers = normalizePlayers(match.home_players);
  const awayPlayers = normalizePlayers(match.away_players);
  [...homePlayers, ...awayPlayers].forEach((player) => addAppearance(table, match.id, player));

  const goals = Array.isArray(match.goals) ? (match.goals as Goal[]) : [];
  goals.forEach((goal) => {
    if (!goal.own_goal) {
      addGoals(table, goal.scorer_id, goal.scorer, 1);
      addAssists(table, goal.assist_id, goal.assist, goal.assist || goal.assist_id ? 1 : 0);
    }
  });
};

const applyFiveSide = (table: Map<string, PlayerSeasonStats>, matchId: string, side: FiveSide) => {
  side.players?.forEach((player) => addAppearance(table, matchId, player));
  side.goals?.forEach((row) => {
    if (!row.ownGoal) addGoals(table, row.playerId, row.playerName, row.goals);
  });
  side.assists?.forEach((row) => addAssists(table, row.playerId, row.playerName, row.assists));
};

const applyFiveModeMatch = (table: Map<string, PlayerSeasonStats>, match: MatchRow) => {
  const stats = Array.isArray(match.stats)
    ? (match.stats as Array<Stat & { fiveMode?: FiveModeState }>)
    : [];
  const fiveMode = stats.find((row) => row.label === FIVE_MODE_LABEL)?.fiveMode;
  if (!fiveMode?.matches?.length) return;

  fiveMode.matches.forEach((miniMatch) => {
    const miniMatchId = `${match.id}:${miniMatch.id}`;
    applyFiveSide(table, miniMatchId, miniMatch.home);
    applyFiveSide(table, miniMatchId, miniMatch.away);
  });
};

const buildSeasonStats = (matches: MatchRow[]) => {
  const table = new Map<string, PlayerSeasonStats>();
  matches.forEach((match) => {
    applyStandardMatch(table, match);
    applyFiveModeMatch(table, match);
  });
  return [...table.values()]
    .map((row) => ({ ...row, matches: undefined }))
    .sort(
      (a, b) =>
        b.goals - a.goals ||
        b.assists - a.assists ||
        b.appearances - a.appearances ||
        a.name.localeCompare(b.name),
    );
};

function SeasonPage() {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const start = `${displayYear}-01-01`;
    const end = `${displayYear + 1}-01-01`;
    setLoading(true);
    supabase
      .from("matches")
      .select("id,name,match_date,format,home_players,away_players,goals,stats")
      .gte("match_date", start)
      .lt("match_date", end)
      .order("match_date", { ascending: true })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setMatches((data ?? []) as MatchRow[]);
        setLoading(false);
      });
  }, []);

  const seasonStats = useMemo(() => buildSeasonStats(matches), [matches]);
  const topScorer = seasonStats[0];
  const topAssister = [...seasonStats].sort(
    (a, b) => b.assists - a.assists || b.goals - a.goals || a.name.localeCompare(b.name),
  )[0];
  const mostAppearances = [...seasonStats].sort(
    (a, b) => b.appearances - a.appearances || a.name.localeCompare(b.name),
  )[0];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs tracking-[0.25em] text-muted-foreground">ARARAT PORTO FC</p>
              <h1 className="font-display text-3xl tracking-wider">Season {displayYear}</h1>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link to="/">Back to Matchday</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <p className="max-w-3xl text-muted-foreground">
          Season leaderboard built from saved matches this year. It combines normal match goals and
          assists with 5x5x5 mini-match goals, assists and appearances.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <SeasonCard
            icon={<Trophy className="h-5 w-5" />}
            label="Matches"
            value={matches.length}
          />
          <SeasonCard
            icon={<Target className="h-5 w-5" />}
            label="Top Scorer"
            value={topScorer ? `${topScorer.name} · ${topScorer.goals}` : "—"}
          />
          <SeasonCard
            icon={<Handshake className="h-5 w-5" />}
            label="Top Assists"
            value={topAssister ? `${topAssister.name} · ${topAssister.assists}` : "—"}
          />
          <SeasonCard
            icon={<Users className="h-5 w-5" />}
            label="Most Present"
            value={
              mostAppearances ? `${mostAppearances.name} · ${mostAppearances.appearances}` : "—"
            }
          />
        </div>

        <div className="mt-10 rounded-2xl border-2 border-border bg-card p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl tracking-wider">Players</h2>
            <p className="text-sm text-muted-foreground">Goals · Assists · Appearances</p>
          </div>

          {loading && <p className="py-10 text-center text-muted-foreground">Loading season…</p>}
          {error && <p className="py-10 text-center text-destructive">{error}</p>}
          {!loading && !error && seasonStats.length === 0 && (
            <p className="py-10 text-center text-muted-foreground italic">
              No saved matches found for {displayYear} yet.
            </p>
          )}

          {!loading && !error && seasonStats.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead className="border-b border-border text-xs tracking-[0.2em] text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-3">#</th>
                    <th className="py-3 pr-3">Player</th>
                    <th className="py-3 pr-3 text-right">Goals</th>
                    <th className="py-3 pr-3 text-right">Assists</th>
                    <th className="py-3 pr-3 text-right">Appearances</th>
                  </tr>
                </thead>
                <tbody>
                  {seasonStats.map((player, index) => (
                    <tr key={player.key} className="border-b border-border/60">
                      <td className="py-3 pr-3 font-display text-muted-foreground">{index + 1}</td>
                      <td className="py-3 pr-3 font-semibold">{player.name}</td>
                      <td className="py-3 pr-3 text-right font-display text-xl">{player.goals}</td>
                      <td className="py-3 pr-3 text-right font-display text-xl">
                        {player.assists}
                      </td>
                      <td className="py-3 pr-3 text-right font-display text-xl">
                        {player.appearances}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function SeasonCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border-2 border-primary bg-card p-4">
      <div className="flex items-center gap-2 text-accent">
        {icon}
        <p className="text-[10px] tracking-[0.2em]">{label.toUpperCase()}</p>
      </div>
      <p className="mt-3 font-display text-2xl">{value}</p>
    </div>
  );
}
