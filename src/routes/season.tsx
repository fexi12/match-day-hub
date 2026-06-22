import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Trophy, Target, Handshake, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { buildSeasonStats, type SeasonMatchRow } from "@/lib/season-stats";
import { PlayerProfileTrigger } from "@/components/PlayerProfile";

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

function SeasonPage() {
  const [matches, setMatches] = useState<SeasonMatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const start = `${displayYear}-01-01`;
    const end = `${displayYear + 1}-01-01`;
    setLoading(true);
    supabase
      .from("matches")
      .select("id,name,match_date,format,home_players,away_players,goals,stats,attendees")
      .gte("match_date", start)
      .lt("match_date", end)
      .order("match_date", { ascending: true })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setMatches((data ?? []) as SeasonMatchRow[]);
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
            <p className="text-sm text-muted-foreground">
              Goals · Assists · Appearances · Attendance
            </p>
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
                    <th className="py-3 pr-3 text-right">Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {seasonStats.map((player, index) => (
                    <tr key={player.key} className="border-b border-border/60">
                      <td className="py-3 pr-3 font-display text-muted-foreground">{index + 1}</td>
                      <td className="py-3 pr-3 font-semibold">
                        <PlayerProfileTrigger name={player.name}>
                          <button className="hover:text-accent hover:underline transition">
                            {player.name}
                          </button>
                        </PlayerProfileTrigger>
                      </td>
                      <td className="py-3 pr-3 text-right font-display text-xl">{player.goals}</td>
                      <td className="py-3 pr-3 text-right font-display text-xl">
                        {player.assists}
                      </td>
                      <td className="py-3 pr-3 text-right font-display text-xl">
                        {player.appearances}
                      </td>
                      <td className="py-3 pr-3 text-right font-display text-xl">
                        {player.attendances}
                        {matches.length > 0 && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({Math.round((player.attendances / matches.length) * 100)}%)
                          </span>
                        )}
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
