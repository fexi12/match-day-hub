import { useState, useEffect, useMemo, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, History, Star, Plus, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { normalizePlayers, type Player } from "@/lib/match-store";
import { AuthProvider, useAuth } from "@/lib/auth";
import { MatchProvider, useMatch } from "@/lib/match-store";
import { normalizeRatingKey } from "@/lib/rating-key";
import { PlayerProfileTrigger } from "@/components/PlayerProfile";
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
import { toast } from "sonner";

type RatingRow = { player_key: string; player_name: string; rating: number; created_at: string };

type PlayerStats = {
  key: string;
  name: string;
  average: number;
  games: number;
  min: number;
  max: number;
};

function buildRankings(rows: RatingRow[]) {
  const byKey = new Map<string, { name: string; values: { rating: number; date: string }[] }>();
  for (const r of rows) {
    const entry = byKey.get(r.player_key) ?? { name: r.player_name, values: [] };
    entry.name = r.player_name || entry.name;
    entry.values.push({ rating: r.rating, date: r.created_at });
    byKey.set(r.player_key, entry);
  }

  const averages: PlayerStats[] = [...byKey.entries()].map(([key, { name, values }]) => {
    const ratings = values.map((v) => v.rating);
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    return {
      key,
      name,
      average: Math.round(avg * 10) / 10,
      games: ratings.length,
      min: ratings.length ? Math.min(...ratings) : 0,
      max: ratings.length ? Math.max(...ratings) : 0,
    };
  });

  averages.sort((a, b) => b.average - a.average);
  return { averages, byKey };
}

const TEAM_COLORS = ["#1e3a5f", "#d44a2a", "#e0b441", "#2d5a3d", "#5cbdb9", "#f0e8d6"];

export const Route = createFileRoute("/rankings")({
  head: () => ({
    meta: [{ title: "Player Rankings — Ararat Porto FC" }],
  }),
  component: () => (
    <AuthProvider>
      <MatchProvider>
        <RankingsPage />
      </MatchProvider>
    </AuthProvider>
  ),
});

function RankingsPage() {
  const [rows, setRows] = useState<RatingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topN, setTopN] = useState(10);
  const [selectedKey, setSelectedKey] = useState<string>("");

  const fetchRatings = useCallback(() => {
    setLoading(true);
    supabase
      .from("player_ratings")
      .select("player_key, player_name, rating, created_at")
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setRows(data ?? []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  const { averages, byKey } = useMemo(() => buildRankings(rows), [rows]);

  useEffect(() => {
    if (!selectedKey && averages.length) setSelectedKey(averages[0].key);
  }, [averages, selectedKey]);

  const chartData = averages.slice(0, topN).map((p, i) => ({
    ...p,
    color: TEAM_COLORS[i % TEAM_COLORS.length],
  }));

  const trendData = (byKey.get(selectedKey)?.values ?? []).map((v) => ({
    date: v.date,
    rating: v.rating,
  }));

  const selectedStats = averages.find((p) => p.key === selectedKey);

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
            <TabsTrigger value="rate">Rate Players</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {loading && <p className="text-muted-foreground text-center py-12">Loading…</p>}
            {error && <p className="text-destructive text-center py-12">{error}</p>}
            {!loading && !error && averages.length === 0 && (
              <p className="text-muted-foreground text-center py-12 italic">
                No ratings yet. Add some in the "Rate Players" tab.
              </p>
            )}
            {!loading && !error && averages.length > 0 && (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <p className="text-sm text-muted-foreground">Showing top</p>
                  <div className="flex gap-2">
                    {[5, 10, 20, averages.length].map((n) => (
                      <button
                        key={n}
                        onClick={() => setTopN(n)}
                        className={`px-4 py-1.5 rounded-full text-sm font-display transition border-2 ${
                          topN === n
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-card border-2 border-border rounded-2xl p-6">
                  <h3 className="font-display text-lg tracking-wider mb-6">
                    Average Rating — Top {topN}
                  </h3>
                  <ResponsiveContainer width="100%" height={Math.max(300, topN * 28)}>
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                      <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 12 }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={140}
                        tick={{ fontSize: 12, fontFamily: "Oswald" }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-card)",
                          border: "2px solid var(--color-border)",
                          borderRadius: "8px",
                          fontFamily: "Oswald",
                        }}
                        formatter={(val: number, _: string, props: { payload?: PlayerStats }) => {
                          const p = props.payload as PlayerStats;
                          return [`${val}/10`, `${p.games} ratings`];
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
                    <div
                      key={p.key}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition ${
                        selectedKey === p.key
                          ? "border-primary"
                          : "border-border hover:border-accent"
                      }`}
                    >
                      <button
                        onClick={() => setSelectedKey(p.key)}
                        className="flex items-center gap-2 flex-1 min-w-0 text-left"
                      >
                        <div
                          className="h-4 w-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{p.name}</p>
                          <p className="text-lg font-display font-bold leading-none">{p.average}</p>
                        </div>
                      </button>
                      <PlayerProfileTrigger name={p.name}>
                        <button
                          className="text-muted-foreground hover:text-accent p-1 flex-shrink-0"
                          aria-label={`View ${p.name}'s profile`}
                        >
                          <User className="h-4 w-4" />
                        </button>
                      </PlayerProfileTrigger>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="trend">
            <div className="bg-card border-2 border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-lg tracking-wider">Rating Trend</h3>
                <select
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                  className="bg-background border-2 border-border rounded-lg px-3 py-2 text-sm font-display"
                >
                  {averages.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {trendData.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">
                  No data for this player yet.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(d) => {
                        try {
                          return format(parseISO(d), "MMM d");
                        } catch {
                          return d;
                        }
                      }}
                    />
                    <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "2px solid var(--color-border)",
                        borderRadius: "8px",
                        fontFamily: "Oswald",
                      }}
                      labelFormatter={(label) => {
                        try {
                          return format(parseISO(label as string), "d MMM yyyy");
                        } catch {
                          return label;
                        }
                      }}
                      formatter={(val: number) => [`${val}/10`, "Rating"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="rating"
                      stroke="#d44a2a"
                      strokeWidth={3}
                      dot={{ fill: "#d44a2a", r: 5 }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {selectedStats && (
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div className="bg-background rounded-xl p-4">
                    <p className="text-3xl font-display font-bold">{selectedStats.average}</p>
                    <p className="text-xs text-muted-foreground mt-1">AVG RATING</p>
                  </div>
                  <div className="bg-background rounded-xl p-4">
                    <p className="text-3xl font-display font-bold">{selectedStats.games}</p>
                    <p className="text-xs text-muted-foreground mt-1">RATINGS</p>
                  </div>
                  <div className="bg-background rounded-xl p-4">
                    <p className="text-3xl font-display font-bold">{selectedStats.max}</p>
                    <p className="text-xs text-muted-foreground mt-1">BEST</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="distribution">
            <div className="bg-card border-2 border-border rounded-2xl p-6">
              <h3 className="font-display text-lg tracking-wider mb-6">Rating Distribution</h3>
              {averages.length === 0 && (
                <p className="text-muted-foreground text-center py-8 italic">No ratings yet.</p>
              )}
              {averages.map((p) => {
                const pct = (p.average / 10) * 100;
                return (
                  <div key={p.key} className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-semibold">{p.name}</span>
                      <span className="text-sm font-display text-muted-foreground">
                        {p.average}/10
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: "#d44a2a" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="rate">
            <RatePlayersForm onSubmitted={fetchRatings} />
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

type RateRow = { name: string; value: string };

function RatePlayersForm({ onSubmitted }: { onSubmitted: () => void }) {
  const { user } = useAuth();
  const { match, canEdit } = useMatch();
  const [rows, setRows] = useState<RateRow[]>([]);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const seen = new Set<string>();
    const names: string[] = [];
    for (const p of [...match.home_players, ...match.away_players]) {
      const label = p.name || p.email;
      if (!label) continue;
      const key = normalizeRatingKey(label);
      if (seen.has(key)) continue;
      seen.add(key);
      names.push(label);
    }
    setRows(names.map((name) => ({ name, value: "" })));
  }, [match.home_players, match.away_players]);

  if (!user) {
    return (
      <div className="bg-card border-2 border-border rounded-2xl p-6 text-center text-muted-foreground">
        Sign in to submit ratings.
      </div>
    );
  }
  if (!canEdit) {
    return (
      <div className="bg-card border-2 border-border rounded-2xl p-6 text-center text-muted-foreground">
        Your editor access was revoked. Ask an admin to restore it to submit ratings.
      </div>
    );
  }

  const setValue = (i: number, value: string) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, value } : row)));

  const removeRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));

  const addManual = () => {
    const name = newName.trim();
    if (!name) return;
    setRows((r) => [...r, { name, value: "" }]);
    setNewName("");
  };

  const submit = async () => {
    const payload = rows
      .filter((r) => r.name.trim() && r.value.trim() !== "")
      .map((r) => {
        const rating = Math.max(0, Math.min(10, Number(r.value)));
        return {
          player_key: normalizeRatingKey(r.name),
          player_name: r.name.trim(),
          rating,
          match_id: match.id,
          rated_by: user.id,
        };
      })
      .filter((r) => !isNaN(r.rating));

    if (payload.length === 0) {
      toast.error("Enter at least one rating");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("player_ratings").insert(payload);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Saved ${payload.length} rating${payload.length > 1 ? "s" : ""}`);
    setRows((r) => r.map((row) => ({ ...row, value: "" })));
    onSubmitted();
  };

  return (
    <div className="bg-card border-2 border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-2">
        <Star className="h-5 w-5 text-accent" />
        <h3 className="font-display text-lg tracking-wider">Rate Today's Squad</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Rate each player 0–10. Leave blank to skip. Ratings are saved with today's date.
      </p>

      {rows.length === 0 && (
        <p className="text-sm text-muted-foreground italic mb-4">
          No players in the current squad yet — add names manually below.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <div key={`${row.name}-${i}`} className="flex items-center gap-3">
            <span className="flex-1 text-sm font-semibold truncate">{row.name}</span>
            <Input
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={row.value}
              onChange={(e) => setValue(i, e.target.value)}
              placeholder="—"
              className="w-20 h-9 text-center"
            />
            <button
              onClick={() => removeRow(i)}
              className="text-muted-foreground hover:text-destructive p-1"
              aria-label="Remove from list"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2 max-w-sm">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addManual()}
          placeholder="Add another player…"
        />
        <Button type="button" variant="outline" onClick={addManual}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      <Button className="mt-6 font-display tracking-wider" onClick={submit} disabled={submitting}>
        {submitting ? "Saving…" : "Save Ratings"}
      </Button>
    </div>
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
      .select(
        "id, name, opponent, match_date, kickoff, location, format, home_players, away_players, home_color, away_color",
      )
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
  if (!matches.length)
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">No saved matches yet.</p>
        <p className="text-xs text-muted-foreground mt-1">
          Save a match on the matchday page to see it here.
        </p>
      </div>
    );

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
                  {m.match_date ? format(new Date(m.match_date), "d MMM yyyy") : "No date"} —{" "}
                  {m.opponent || "vs ?"}
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
                {m.location && (
                  <p className="text-xs text-muted-foreground mb-3">📍 {m.location}</p>
                )}
                {!hasPlayers ? (
                  <p className="text-xs text-muted-foreground italic">
                    No players registered for this match.
                  </p>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <MiniLineup
                      label="Home"
                      players={m.home_players.filter((p) => p.name)}
                      color={m.home_color}
                    />
                    <MiniLineup
                      label={m.opponent || "Away"}
                      players={m.away_players.filter((p) => p.name)}
                      color={m.away_color}
                    />
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

function MiniLineup({
  label,
  players,
  color,
}: {
  label: string;
  players: Player[];
  color: string;
}) {
  const initials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs tracking-widest text-muted-foreground mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {players.map((p, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div
              className="h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
              style={{ backgroundColor: color }}
            >
              {initials(p.name)}
            </div>
            <span className="text-xs truncate max-w-[80px]">{p.name}</span>
          </div>
        ))}
        {players.length === 0 && (
          <span className="text-xs text-muted-foreground italic">No players</span>
        )}
      </div>
    </div>
  );
}
