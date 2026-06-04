import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMatch, type Player, type Stat } from "@/lib/match-store";
import { Shuffle, Plus, Trophy, Goal, BarChart3 } from "lucide-react";
import { toast } from "sonner";

const FIVE_MODE_LABEL = "__5X5X5_MODE__";
const TEAM_SIZE = 5;
const DEFAULT_MATCH_COUNT = 5;

type FiveSide = {
  name: string;
  players: Player[];
  score: number;
};

type FiveMiniMatch = {
  id: number;
  round: number;
  home: FiveSide;
  away: FiveSide;
};

type FiveModeState = {
  enabled: boolean;
  targetMatches: number;
  matches: FiveMiniMatch[];
};

type FiveStat = Stat & { fiveMode?: FiveModeState };

type PlayerStanding = {
  name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

const emptyState = (): FiveModeState => ({
  enabled: false,
  targetMatches: DEFAULT_MATCH_COUNT,
  matches: [],
});

const getFiveMode = (stats: Stat[]): FiveModeState => {
  const row = stats.find((s) => s.label === FIVE_MODE_LABEL) as FiveStat | undefined;
  return row?.fiveMode ?? emptyState();
};

const visibleStats = (stats: Stat[]): Stat[] => stats.filter((s) => s.label !== FIVE_MODE_LABEL);

const normalizeScore = (value: number) =>
  Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;

const playerKey = (player: Player) =>
  (player.email?.trim().toLowerCase() || player.name.trim().toLowerCase()).replace(/\s+/g, " ");

const uniquePlayers = (players: Player[]): Player[] => {
  const seen = new Set<string>();
  return players
    .map((p) => ({ ...p, name: p.name.trim() }))
    .filter((p) => {
      if (!p.name) return false;
      const key = playerKey(p);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const rotate = <T,>(arr: T[], amount: number): T[] => {
  if (arr.length === 0) return arr;
  const shift = amount % arr.length;
  return [...arr.slice(shift), ...arr.slice(0, shift)];
};

const buildMiniMatches = (players: Player[], targetMatches: number): FiveMiniMatch[] => {
  const pool = uniquePlayers(players);
  if (pool.length < TEAM_SIZE * 2) return [];

  return Array.from({ length: targetMatches }).map((_, index) => {
    const rotated = rotate(pool, index * TEAM_SIZE);
    const home = rotated.slice(0, TEAM_SIZE);
    const away = rotated.slice(TEAM_SIZE, TEAM_SIZE * 2);

    return {
      id: Date.now() + index,
      round: index + 1,
      home: { name: `Team ${index + 1}A`, players: home, score: 0 },
      away: { name: `Team ${index + 1}B`, players: away, score: 0 },
    };
  });
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join("") || "?";

const standingsFor = (matches: FiveMiniMatch[]): PlayerStanding[] => {
  const table = new Map<string, PlayerStanding>();

  const ensure = (player: Player) => {
    const key = playerKey(player);
    if (!table.has(key)) {
      table.set(key, {
        name: player.name,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      });
    }
    return table.get(key)!;
  };

  matches.forEach((match) => {
    const homeScore = normalizeScore(match.home.score);
    const awayScore = normalizeScore(match.away.score);
    const homeWon = homeScore > awayScore;
    const awayWon = awayScore > homeScore;

    match.home.players.forEach((player) => {
      const row = ensure(player);
      row.played += 1;
      row.goalsFor += homeScore;
      row.goalsAgainst += awayScore;
      if (homeWon) {
        row.wins += 1;
        row.points += 3;
      } else if (awayWon) {
        row.losses += 1;
      } else {
        row.draws += 1;
        row.points += 1;
      }
    });

    match.away.players.forEach((player) => {
      const row = ensure(player);
      row.played += 1;
      row.goalsFor += awayScore;
      row.goalsAgainst += homeScore;
      if (awayWon) {
        row.wins += 1;
        row.points += 3;
      } else if (homeWon) {
        row.losses += 1;
      } else {
        row.draws += 1;
        row.points += 1;
      }
    });
  });

  return [...table.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst) ||
      b.goalsFor - a.goalsFor ||
      a.name.localeCompare(b.name),
  );
};

export function FiveMode() {
  const { match, update, canEdit } = useMatch();
  const current = getFiveMode(match.stats);
  const [targetMatches, setTargetMatches] = useState(current.targetMatches || DEFAULT_MATCH_COUNT);

  const players = useMemo(
    () => uniquePlayers([...match.home_players, ...match.away_players]),
    [match.home_players, match.away_players],
  );
  const standings = useMemo(() => standingsFor(current.matches), [current.matches]);
  const totalGoals = current.matches.reduce(
    (sum, item) => sum + normalizeScore(item.home.score) + normalizeScore(item.away.score),
    0,
  );
  const maxPlayerGoals = Math.max(1, ...standings.map((row) => row.goalsFor));

  const saveFiveMode = (next: FiveModeState) => {
    const cleaned = visibleStats(match.stats);
    const payload: FiveStat = {
      label: FIVE_MODE_LABEL,
      home: next.matches.length,
      away: totalGoals,
      fiveMode: next,
    };
    update("stats", [...cleaned, payload]);
  };

  const enableMode = () => {
    saveFiveMode({ ...current, enabled: true, targetMatches });
  };

  const generate = () => {
    if (players.length < TEAM_SIZE * 2) {
      toast.error("Need at least 10 players to generate 5v5 matches.");
      return;
    }

    const count = Math.max(1, targetMatches || DEFAULT_MATCH_COUNT);
    saveFiveMode({
      enabled: true,
      targetMatches: count,
      matches: buildMiniMatches(players, count),
    });
    toast.success(`Generated ${count} 5v5 matches`);
  };

  const addMatch = () => {
    const nextRound = current.matches.length + 1;
    const extra = buildMiniMatches(players, nextRound).at(-1);
    if (!extra) {
      toast.error("Need at least 10 players to add a 5v5 match.");
      return;
    }
    saveFiveMode({
      ...current,
      enabled: true,
      targetMatches: nextRound,
      matches: [...current.matches, extra],
    });
    setTargetMatches(nextRound);
  };

  const updateScore = (id: number, side: "home" | "away", score: number) => {
    saveFiveMode({
      ...current,
      matches: current.matches.map((item) =>
        item.id === id
          ? { ...item, [side]: { ...item[side], score: normalizeScore(score) } }
          : item,
      ),
    });
  };

  return (
    <section id="five-mode" className="bg-background border-b border-border">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm tracking-[0.3em]" style={{ color: "var(--color-ember)" }}>
              Local Matches Lab
            </p>
            <h2 className="mt-2 text-5xl md:text-6xl">5x5x5 Mode</h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              Generate short 5v5 local games from the squad, record every score, and get an instant
              leaderboard + goal graph across the whole session.
            </p>
          </div>

          <div className="border-2 border-primary rounded-xl bg-card p-4 min-w-[260px]">
            <p className="text-xs tracking-[0.25em] text-muted-foreground">SESSION SETUP</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] tracking-[0.2em] text-muted-foreground">PLAYERS</p>
                <p className="font-display text-3xl">{players.length}</p>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.2em] text-muted-foreground">MATCHES</p>
                <Input
                  type="number"
                  min={1}
                  value={targetMatches}
                  onChange={(e) => setTargetMatches(Number(e.target.value))}
                  disabled={!canEdit}
                  className="mt-1 h-9 font-display text-lg"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {!current.enabled && (
                <Button
                  onClick={enableMode}
                  disabled={!canEdit}
                  variant="outline"
                  className="font-display tracking-wider"
                >
                  Enable
                </Button>
              )}
              <Button
                onClick={generate}
                disabled={!canEdit}
                className="font-display tracking-wider"
              >
                <Shuffle className="h-4 w-4 mr-2" /> Generate
              </Button>
              <Button
                onClick={addMatch}
                disabled={!canEdit}
                variant="outline"
                className="font-display tracking-wider"
              >
                <Plus className="h-4 w-4 mr-2" /> More
              </Button>
            </div>
            {!canEdit && (
              <p className="mt-3 text-xs text-muted-foreground italic">
                Sign in with editor access to generate and edit scores.
              </p>
            )}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Goal className="h-5 w-5 text-accent" />
              <h3 className="text-2xl">Match Scores</h3>
            </div>
            {current.matches.length === 0 ? (
              <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center text-muted-foreground">
                Add at least 10 players in the squad, then generate the 5x5x5 match list.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {current.matches.map((miniMatch) => (
                  <MiniMatchCard
                    key={miniMatch.id}
                    miniMatch={miniMatch}
                    canEdit={canEdit}
                    onScore={updateScore}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="border-2 border-primary rounded-xl bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-accent" />
                <h3 className="text-2xl">Leaderboard</h3>
              </div>
              {standings.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Scores will create the table automatically.
                </p>
              ) : (
                <div className="space-y-2">
                  {standings.slice(0, 10).map((row, index) => (
                    <div
                      key={row.name}
                      className="grid grid-cols-[32px_1fr_auto] items-center gap-3 rounded-lg border border-border p-2"
                    >
                      <span className="font-display text-lg text-muted-foreground">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{row.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.wins}W {row.draws}D {row.losses}L · GD{" "}
                          {row.goalsFor - row.goalsAgainst}
                        </p>
                      </div>
                      <span className="font-display text-2xl text-accent">{row.points}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-2 border-primary rounded-xl bg-primary text-primary-foreground p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-accent" />
                <h3 className="text-2xl text-primary-foreground">Goals Graph</h3>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center mb-5">
                <Metric label="Games" value={current.matches.length} />
                <Metric label="Goals" value={totalGoals} />
                <Metric
                  label="Avg"
                  value={
                    current.matches.length ? (totalGoals / current.matches.length).toFixed(1) : "0"
                  }
                />
              </div>
              <div className="space-y-3">
                {standings.slice(0, 8).map((row) => (
                  <div key={row.name}>
                    <div className="mb-1 flex justify-between gap-3 text-xs">
                      <span className="truncate">{row.name}</span>
                      <span>{row.goalsFor} GF</span>
                    </div>
                    <div className="h-2 rounded-full bg-primary-foreground/20 overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all"
                        style={{ width: `${Math.max(6, (row.goalsFor / maxPlayerGoals) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniMatchCard({
  miniMatch,
  canEdit,
  onScore,
}: {
  miniMatch: FiveMiniMatch;
  canEdit: boolean;
  onScore: (id: number, side: "home" | "away", score: number) => void;
}) {
  return (
    <div className="border-2 border-primary rounded-xl bg-card p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs tracking-[0.25em] text-muted-foreground">MATCH {miniMatch.round}</p>
        <div className="flex items-center gap-2 font-display text-3xl">
          <Input
            type="number"
            min={0}
            value={miniMatch.home.score}
            onChange={(e) => onScore(miniMatch.id, "home", Number(e.target.value))}
            disabled={!canEdit}
            className="h-11 w-16 text-center text-2xl font-display"
          />
          <span className="text-accent">:</span>
          <Input
            type="number"
            min={0}
            value={miniMatch.away.score}
            onChange={(e) => onScore(miniMatch.id, "away", Number(e.target.value))}
            disabled={!canEdit}
            className="h-11 w-16 text-center text-2xl font-display"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TeamBlock title={miniMatch.home.name} players={miniMatch.home.players} />
        <TeamBlock title={miniMatch.away.name} players={miniMatch.away.players} />
      </div>
    </div>
  );
}

function TeamBlock({ title, players }: { title: string; players: Player[] }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="mb-3 font-display tracking-wider">{title}</p>
      <div className="flex flex-wrap gap-2">
        {players.map((player) => (
          <div
            key={playerKey(player)}
            className="flex items-center gap-2 rounded-full bg-secondary px-2 py-1 text-sm"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary font-display text-xs text-primary-foreground">
              {initials(player.name)}
            </span>
            <span className="max-w-[150px] truncate">{player.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-accent/30 p-3">
      <p className="text-[10px] tracking-[0.25em] text-accent/80">{label.toUpperCase()}</p>
      <p className="mt-1 font-display text-3xl">{value}</p>
    </div>
  );
}
