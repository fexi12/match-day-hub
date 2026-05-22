import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { normalizePlayers, type Player } from "@/lib/match-store";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { parseISO, format } from "date-fns";

const CSV_DATA = `Timestamp,[Vardan],[Artur Mirzoyan],[Nikolay],[Edgar Galstyan],[Erick Serra],[Manu Monteiro],[Mikayel Grigoryan],[Paulo Góis],[Rachid],[Richard],[Telmo],[Sergei Baghdasaryan],[Sergey Harutyunyan],[Sergio Sousa],[Vadim],[Vahe Avetyan],[Yevgeniy],[Olivier],[Pedro Palmerim],[Rafayel Chibukhchyan],[Sergei Belorus],[Robert Hovhannisyan],[Roman],[Harut],[Hayk],[Khachatur Harutyunyan],[Ievon Yeghiazaryan],[Narek],[Erick Arakelyan],[Evgeniy Nasyrov],[Francisco David],[Georgiy Piskunov],[Gor],[Adeeb Sidani],[Afonso Mota],[Andre Yeran],[Artem],[Bachar],[Boris Nogachev],[David Mamulyan],[Khaled],[Patrick],[Luis]
2026/05/20 1:43:01 PM GMT+1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
2026/05/20 1:47:23 PM GMT+1,9,,,8,,,,,9,10,,,,,,,,,,,10,10,7,6,,7,,,,,,,,,,,4,,7,,,,
2026/05/20 2:03:47 PM GMT+1,7,5,7,7,,8,7,6,8,8,6,5,6,7,5,5,7,7,7,6,7,9,7,5,5,6,8,5,6,,7,5,,6,10,5,6,5,5,7,5,9,9
2026/05/20 2:06:55 PM GMT+1,7,5,,,,10,8,,9,9,7,7,7,8,6,6,7,7,,6,7,10,7,6,3,7,9,5,6,,8,,6,7,9,6,7,7,7,,,,
2026/05/20 3:48:08 PM GMT+1,8,3,,7,,9,7,,8,9,7,5,2,6,4,2,6,,,,6,10,4,5,2,6,9,,,,8,,2,7,9,6,,7,,,,,
2026/05/20 5:40:00 PM GMT+1,8,,,8,,7,7,,9,9,6,5,4,,4,4,7,,,5,7,10,6,5,3,7,8,,7,,8,5,3,,10,6,,7,7,8,,,
2026/05/20 6:00:33 PM GMT+1,8,5,,8,,9,8,,7,7,6,6,3,,4,6,7,,,6,8,9,7,6,3,6,8,5,7,,8,,6,,10,4,7,7,6,8,,,
2026/05/21 4:24:01 PM GMT+1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
2026/05/22 11:57:53 AM GMT+1,8,5,5,8,,4,5,5,7,8,5,8,8,7,7,,,5,5,5,5,10,8,4,5,6,7,5,5,5,8,5,5,7,10,5,5,5,5,7,5,5,10
2026/05/22 12:27:22 PM GMT+1,7,,,7,,,6,5,7,,,5,4,,,,6,,,,7,10,4,6,,,7,,,,7,,,,10,,,,5,,,,9
2026/05/22 1:57:53 PM GMT+1,7,4,,7,,10,7,,,,,,4,,,,,,,,8,9,,6,,7,8,,,,,,,,,,,,,,,,`;

function parseRankings(csv: string) {
  const lines = csv.trim().split("\n");
  const header = lines[0].split(",");
  const players = header.slice(1).map((p) => p.replace(/[\[\]]/g, "").trim());

  const sessions: { date: string; ratings: (number | null)[] }[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const date = cols[0].trim();
    const ratings = cols.slice(1).map((v) => (v === "" ? null : parseFloat(v) ?? null));
    if (date) sessions.push({ date, ratings });
  }

  const averages = players.map((name, i) => {
    const vals = sessions
      .map((s) => s.ratings[i])
      .filter((v): v is number => v !== null && !isNaN(v));
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    const games = vals.length;
    return { name, average: Math.round(avg * 10) / 10, games, min: vals.length ? Math.min(...vals) : 0, max: vals.length ? Math.max(...vals) : 0 };
  });

  const sorted = [...averages].sort((a, b) => b.average - a.average);
  const recentSessions = sessions.slice(-8);

  return { players, sessions, averages: sorted, recentSessions };
}

type PlayerStats = ReturnType<typeof parseRankings>["averages"][number];

const { averages, recentSessions, players } = parseRankings(CSV_DATA);

const TEAM_COLORS = ["#1e3a5f", "#d44a2a", "#e0b441", "#2d5a3d", "#5cbdb9", "#f0e8d6"];

export const Route = createFileRoute("/rankings")({
  head: () => ({
    meta: [{ title: "Player Rankings — Ararat Porto FC" }],
  }),
  component: RankingsPage,
});

function RankingsPage() {
  const [topN, setTopN] = useState(10);
  const [selectedPlayer, setSelectedPlayer] = useState(averages[0]?.name ?? "");

  const chartData = averages.slice(0, topN).map((p, i) => ({
    name: p.name,
    average: p.average,
    games: p.games,
    min: p.min,
    max: p.max,
    color: TEAM_COLORS[i % TEAM_COLORS.length],
  }));

  const trendData = recentSessions.map((s) => {
    const playerIdx = players.indexOf(selectedPlayer);
    return {
      date: s.date,
      rating: s.ratings[playerIdx] ?? null,
    };
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            <h1 className="font-display text-2xl tracking-wider">Player Rankings</h1>
          </div>
          <Button asChild variant="outline">
            <Link to="/">Back to Matchday</Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-12">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trend">Trend</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="flex items-center gap-4 mb-6">
              <p className="text-sm text-muted-foreground">Showing top</p>
              <div className="flex gap-2">
                {[5, 10, 20, 44].map((n) => (
                  <button
                    key={n}
                    onClick={() => setTopN(n)}
                    className={`px-4 py-1.5 rounded-full text-sm font-display transition border-2 ${
                      topN === n ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card border-2 border-border rounded-2xl p-6">
              <h3 className="font-display text-lg tracking-wider mb-6">Average Rating — Top {topN}</h3>
              <ResponsiveContainer width="100%" height={Math.max(300, topN * 28)}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                  <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12, fontFamily: "Oswald" }} />
                  <Tooltip
                    contentStyle={{ background: "var(--color-card)", border: "2px solid var(--color-border)", borderRadius: "8px", fontFamily: "Oswald" }}
                    formatter={(val: number, _: string, props: { payload?: PlayerStats }) => {
                      const p = props.payload as PlayerStats;
                      return [`${val}/10`, `${p.games} games played`];
                    }}
                    labelFormatter={(label) => label}
                  />
                  <Bar dataKey="average" radius={[0, 4, 4, 0]} maxBarSize={22}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {chartData.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setSelectedPlayer(p.name)}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition text-left ${selectedPlayer === p.name ? "border-primary" : "border-border hover:border-accent"}`}
                >
                  <div className="h-4 w-4 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{p.name}</p>
                    <p className="text-lg font-display font-bold leading-none">{p.average}</p>
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trend">
            <div className="bg-card border-2 border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-lg tracking-wider">Rating Trend</h3>
                <select
                  value={selectedPlayer}
                  onChange={(e) => setSelectedPlayer(e.target.value)}
                  className="bg-background border-2 border-border rounded-lg px-3 py-2 text-sm font-display"
                >
                  {averages.map((p) => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              {trendData.filter((d) => d.rating !== null).length === 0 ? (
                <p className="text-muted-foreground text-center py-12">No data for this player yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => { try { return format(parseISO(d), "MMM d"); } catch { return d; } }} />
                    <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ background: "var(--color-card)", border: "2px solid var(--color-border)", borderRadius: "8px", fontFamily: "Oswald" }}
                      labelFormatter={(label) => { try { return format(parseISO(label as string), "d MMM yyyy"); } catch { return label; } }}
                      formatter={(val: number) => [`${val}/10`, "Rating"]}
                    />
                    <Line type="monotone" dataKey="rating" stroke="#d44a2a" strokeWidth={3} dot={{ fill: "#d44a2a", r: 5 }} connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {(() => {
                const p = averages.find((x) => x.name === selectedPlayer);
                if (!p) return null;
                return (
                  <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                    <div className="bg-background rounded-xl p-4">
                      <p className="text-3xl font-display font-bold">{p.average}</p>
                      <p className="text-xs text-muted-foreground mt-1">AVG RATING</p>
                    </div>
                    <div className="bg-background rounded-xl p-4">
                      <p className="text-3xl font-display font-bold">{p.games}</p>
                      <p className="text-xs text-muted-foreground mt-1">GAMES</p>
                    </div>
                    <div className="bg-background rounded-xl p-4">
                      <p className="text-3xl font-display font-bold">{p.max}</p>
                      <p className="text-xs text-muted-foreground mt-1">BEST</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </TabsContent>

          <TabsContent value="distribution">
            <div className="bg-card border-2 border-border rounded-2xl p-6">
              <h3 className="font-display text-lg tracking-wider mb-6">Rating Distribution</h3>
              {averages.map((p) => {
                const pct = (p.average / 10) * 100;
                return (
                  <div key={p.name} className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-semibold">{p.name}</span>
                      <span className="text-sm font-display text-muted-foreground">{p.average}/10</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: "#d44a2a" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="bg-card border-2 border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <History className="h-5 w-5" />
                <h3 className="font-display text-lg tracking-wider">Squad History</h3>
              </div>
              <HistoryContent />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

type MatchEntry = {
  id: string;
  name: string;
  opponent: string;
  match_date: string;
  kickoff: string;
  location: string;
  format: string;
  home_players: Player[];
  away_players: Player[];
  home_color: string;
  away_color: string;
};

function HistoryContent() {
  const [matches, setMatches] = useState<MatchEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("matches")
      .select("id, name, opponent, match_date, kickoff, location, format, home_players, away_players, home_color, away_color")
      .order("match_date", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setLoading(false);
        if (!data) return;
        setMatches(
          data.map((m) => ({
            id: m.id,
            name: m.name,
            opponent: m.opponent ?? "",
            match_date: m.match_date ?? "",
            kickoff: m.kickoff ?? "",
            location: m.location ?? "",
            format: m.format ?? "7v7",
            home_players: normalizePlayers(m.home_players),
            away_players: normalizePlayers(m.away_players),
            home_color: m.home_color ?? "#1e3a5f",
            away_color: m.away_color ?? "#d44a2a",
          })),
        );
      });
  }, []);

  if (loading) return <p className="text-muted-foreground text-sm py-8 text-center">Loading...</p>;
  if (!matches.length) return <p className="text-muted-foreground text-sm py-8 text-center">No saved matches yet.</p>;

  return (
    <div className="flex flex-col gap-3">
      {matches.map((m) => {
        const hasPlayers = m.home_players.some((p) => p.name) || m.away_players.some((p) => p.name);
        const isOpen = expandedId === m.id;
        return (
          <div key={m.id} className="border border-border rounded-xl overflow-hidden">
            <button
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent/10 transition text-left"
              onClick={() => setExpandedId(isOpen ? null : m.id)}
            >
              <div>
                <p className="font-display text-sm font-semibold">{m.name}</p>
                <p className="text-xs text-muted-foreground">
                  {m.match_date ? format(new Date(m.match_date), "d MMM yyyy") : "No date"} — {m.opponent || "vs ?"}
                  {m.kickoff ? ` · ${m.kickoff}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-display text-muted-foreground">{m.format}</span>
                <span className="text-xs">{isOpen ? "▲" : "▼"}</span>
              </div>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 border-t border-border pt-3">
                {m.location && <p className="text-xs text-muted-foreground mb-3">📍 {m.location}</p>}
                {!hasPlayers ? (
                  <p className="text-xs text-muted-foreground italic">No players registered for this match.</p>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <MiniLineup label="Home" players={m.home_players.filter((p) => p.name)} color={m.home_color} />
                    <MiniLineup label={m.opponent || "Away"} players={m.away_players.filter((p) => p.name)} color={m.away_color} />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MiniLineup({ label, players, color }: { label: string; players: Player[]; color: string }) {
  const initials = (name: string) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs tracking-widest text-muted-foreground mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {players.map((p, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: color }}>
              {initials(p.name)}
            </div>
            <span className="text-xs truncate max-w-[80px]">{p.name}</span>
          </div>
        ))}
        {players.length === 0 && <span className="text-xs text-muted-foreground italic">No players</span>}
      </div>
    </div>
  );
}