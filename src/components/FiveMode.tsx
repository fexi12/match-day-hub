import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMatch, type Player, type Stat } from "@/lib/match-store";
import { isFiveModeFormat } from "@/lib/match-formats";
import { BarChart3, Goal, Plus, Shuffle, Target, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_MATCH_COUNT,
  DEFAULT_TEAM_COUNT,
  FIVE_MODE_LABEL,
  TEAM_SIZE,
  buildMiniMatches,
  emptyFiveModeState,
  maxTeamsFor,
  normalizeScore,
  playerKey,
  playersFromNames,
  sideScore,
  standingsFor,
  uniquePlayers,
  updatePlayerAssist,
  updatePlayerGoal,
  type FiveMiniMatch,
  type FiveModeState,
  type FiveSide,
} from "@/lib/five-mode";

type FiveStat = Stat & { fiveMode?: FiveModeState };

const getFiveMode = (stats: Stat[]): FiveModeState => {
  const row = stats.find((s) => s.label === FIVE_MODE_LABEL) as FiveStat | undefined;
  return { ...emptyFiveModeState(), ...row?.fiveMode };
};

const visibleStats = (stats: Stat[]): Stat[] => stats.filter((s) => s.label !== FIVE_MODE_LABEL);

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join("") || "?";

const goalValue = (side: FiveSide, player: Player) =>
  side.goals?.find((row) => row.playerName === player.name)?.goals ?? 0;

const assistValue = (side: FiveSide, player: Player) =>
  side.assists?.find((row) => row.playerName === player.name)?.assists ?? 0;

export function FiveMode() {
  const { match, update, canEdit } = useMatch();
  const isSelected = isFiveModeFormat(match.format);
  const current = getFiveMode(match.stats);
  const [targetMatches, setTargetMatches] = useState(current.targetMatches || DEFAULT_MATCH_COUNT);
  const [teamCount, setTeamCount] = useState(current.teamCount || DEFAULT_TEAM_COUNT);
  const [manualNames, setManualNames] = useState("");

  const squadPlayers = useMemo(
    () => uniquePlayers([...match.home_players, ...match.away_players]),
    [match.home_players, match.away_players],
  );
  const manualPlayers = useMemo(() => playersFromNames(manualNames), [manualNames]);
  const players = manualPlayers.length > 0 ? manualPlayers : squadPlayers;
  const usingManualPlayers = manualPlayers.length > 0;
  const maxTeams = players.length >= TEAM_SIZE * 2 ? maxTeamsFor(players) : 0;
  const standings = useMemo(() => standingsFor(current.matches), [current.matches]);
  const totalGoals = current.matches.reduce(
    (sum, item) => sum + sideScore(item.home) + sideScore(item.away),
    0,
  );
  const totalAssists = standings.reduce((sum, row) => sum + row.assists, 0);
  const maxPlayerGoals = Math.max(1, ...standings.map((row) => row.goals));

  if (!isSelected) return null;

  const saveFiveMode = (next: FiveModeState) => {
    const cleaned = visibleStats(match.stats);
    const nextGoals = next.matches.reduce(
      (sum, item) => sum + sideScore(item.home) + sideScore(item.away),
      0,
    );
    const payload: FiveStat = {
      label: FIVE_MODE_LABEL,
      home: next.matches.length,
      away: nextGoals,
      fiveMode: next,
    };
    update("stats", [...cleaned, payload]);
  };

  const enableMode = () => {
    saveFiveMode({ ...current, enabled: true, targetMatches, teamCount });
  };

  const generate = () => {
    if (maxTeams < 2) {
      toast.error("Need at least 10 players to generate 5v5 teams.");
      return;
    }

    const teams = Math.min(maxTeams, Math.max(2, normalizeScore(teamCount || DEFAULT_TEAM_COUNT)));
    const count = Math.max(1, targetMatches || (teams * (teams - 1)) / 2);
    const matches = buildMiniMatches(players, teams, count);

    saveFiveMode({
      enabled: true,
      targetMatches: count,
      teamCount: teams,
      matches,
    });
    setTeamCount(teams);
    setTargetMatches(count);
    toast.success(`Generated ${teams} teams and ${count} mini-matches`);
  };

  const addMatch = () => {
    const teams = current.teamCount || teamCount || DEFAULT_TEAM_COUNT;
    const nextRound = current.matches.length + 1;
    const extra = buildMiniMatches(players, teams, nextRound).at(-1);
    if (!extra) {
      toast.error("Need at least 10 players to add a 5v5 match.");
      return;
    }
    saveFiveMode({
      ...current,
      enabled: true,
      teamCount: teams,
      targetMatches: nextRound,
      matches: [...current.matches, extra],
    });
    setTargetMatches(nextRound);
  };

  const updateGoal = (id: number, side: "home" | "away", playerName: string, goals: number) => {
    saveFiveMode({
      ...current,
      matches: updatePlayerGoal(current.matches, id, side, playerName, goals),
    });
  };

  const updateAssist = (id: number, side: "home" | "away", playerName: string, assists: number) => {
    saveFiveMode({
      ...current,
      matches: updatePlayerAssist(current.matches, id, side, playerName, assists),
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
              Add the players on the pitch above, choose how many teams you want, generate the local
              mini-matches, and record goals + assists for each individual player. The match score
              updates from player goals; assists feed the leaderboard.
            </p>
          </div>

          <div className="border-2 border-primary rounded-xl bg-card p-4 min-w-[300px]">
            <p className="text-xs tracking-[0.25em] text-muted-foreground">SESSION SETUP</p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] tracking-[0.2em] text-muted-foreground">PLAYERS</p>
                <p className="font-display text-3xl">{players.length}</p>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.2em] text-muted-foreground">TEAMS</p>
                <Input
                  type="number"
                  min={2}
                  max={Math.max(2, maxTeams)}
                  value={teamCount}
                  onChange={(e) => setTeamCount(Number(e.target.value))}
                  disabled={!canEdit}
                  className="mt-1 h-9 font-display text-lg"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">max {maxTeams || 0}</p>
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
            <div className="mt-4">
              <p className="text-[10px] tracking-[0.2em] text-muted-foreground">PLAYER NAMES</p>
              <Textarea
                value={manualNames}
                onChange={(e) => setManualNames(e.target.value)}
                placeholder={"One player per line, e.g.\nFexi\nRafa\nMiguel"}
                className="mt-1 min-h-24 resize-y text-sm"
                aria-label="Manual player names"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                {usingManualPlayers
                  ? `${players.length} pasted names loaded. These names override the pitch player pool for 5x5.`
                  : `Using ${squadPlayers.length} names from the pitch player pool. Paste names above only if you want to override.`}
              </p>
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
                Sign in with editor access to generate teams and edit player goals/assists.
              </p>
            )}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Goal className="h-5 w-5 text-accent" />
              <h3 className="text-2xl">Player Goals & Assists</h3>
            </div>
            {current.matches.length === 0 ? (
              <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center text-muted-foreground">
                Add player names in the setup box above or use the squad list, choose how many teams
                you want, then generate the 5x5x5 session. Extra people are distributed across your
                chosen teams.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {current.matches.map((miniMatch) => (
                  <MiniMatchCard
                    key={miniMatch.id}
                    miniMatch={miniMatch}
                    canEdit={canEdit}
                    onGoal={updateGoal}
                    onAssist={updateAssist}
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
                  Player goal + assist inputs will create the table automatically.
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
                          {row.goals}G · {row.assists}A · {row.wins}W {row.draws}D {row.losses}L ·
                          GD {row.goalsFor - row.goalsAgainst}
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
                <Metric label="Teams" value={current.teamCount || teamCount} />
                <Metric label="Goals" value={totalGoals} />
                <Metric label="Assists" value={totalAssists} />
              </div>
              <div className="space-y-3">
                {standings.slice(0, 8).map((row) => (
                  <div key={row.name}>
                    <div className="mb-1 flex justify-between gap-3 text-xs">
                      <span className="truncate">{row.name}</span>
                      <span>
                        {row.goals}G / {row.assists}A
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-primary-foreground/20 overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all"
                        style={{ width: `${Math.max(6, (row.goals / maxPlayerGoals) * 100)}%` }}
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
  onGoal,
  onAssist,
}: {
  miniMatch: FiveMiniMatch;
  canEdit: boolean;
  onGoal: (id: number, side: "home" | "away", playerName: string, goals: number) => void;
  onAssist: (id: number, side: "home" | "away", playerName: string, assists: number) => void;
}) {
  const homeScore = sideScore(miniMatch.home);
  const awayScore = sideScore(miniMatch.away);

  return (
    <div className="border-2 border-primary rounded-xl bg-card p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs tracking-[0.25em] text-muted-foreground">MATCH {miniMatch.round}</p>
        <div className="flex items-center gap-2 font-display text-3xl">
          <span className="rounded-lg border border-border px-3 py-1">{homeScore}</span>
          <span className="text-accent">:</span>
          <span className="rounded-lg border border-border px-3 py-1">{awayScore}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TeamGoalBlock
          title={miniMatch.home.name}
          side="home"
          matchId={miniMatch.id}
          team={miniMatch.home}
          canEdit={canEdit}
          onGoal={onGoal}
          onAssist={onAssist}
        />
        <TeamGoalBlock
          title={miniMatch.away.name}
          side="away"
          matchId={miniMatch.id}
          team={miniMatch.away}
          canEdit={canEdit}
          onGoal={onGoal}
          onAssist={onAssist}
        />
      </div>
    </div>
  );
}

function TeamGoalBlock({
  title,
  team,
  side,
  matchId,
  canEdit,
  onGoal,
  onAssist,
}: {
  title: string;
  team: FiveSide;
  side: "home" | "away";
  matchId: number;
  canEdit: boolean;
  onGoal: (id: number, side: "home" | "away", playerName: string, goals: number) => void;
  onAssist: (id: number, side: "home" | "away", playerName: string, assists: number) => void;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-display tracking-wider">{title}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3 w-3" /> {team.players.length} players
        </div>
      </div>
      <div className="space-y-2">
        {team.players.map((player) => (
          <div
            key={playerKey(player)}
            className="grid grid-cols-[1fr_140px] items-center gap-2 rounded-lg bg-secondary p-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-display text-xs text-primary-foreground">
                {initials(player.name)}
              </span>
              <span className="truncate text-sm">{player.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3 text-accent" />
                <Input
                  type="number"
                  min={0}
                  value={goalValue(team, player)}
                  onChange={(e) => onGoal(matchId, side, player.name, Number(e.target.value))}
                  disabled={!canEdit}
                  className="h-8 w-11 text-center font-display"
                  aria-label={`${player.name} goals`}
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-display text-accent">A</span>
                <Input
                  type="number"
                  min={0}
                  value={assistValue(team, player)}
                  onChange={(e) => onAssist(matchId, side, player.name, Number(e.target.value))}
                  disabled={!canEdit}
                  className="h-8 w-11 text-center font-display"
                  aria-label={`${player.name} assists`}
                />
              </div>
            </div>
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
