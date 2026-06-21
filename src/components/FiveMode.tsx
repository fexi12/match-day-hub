import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMatch, type Stat } from "@/lib/match-store";
import { isFiveModeFormat } from "@/lib/match-formats";
import { Goal, Plus, Shuffle, Target, Users } from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_MATCH_COUNT,
  DEFAULT_TEAM_COUNT,
  FIVE_MODE_LABEL,
  TEAM_SIZE,
  buildFiveTeamsFromLineup,
  buildMiniMatchesFromTeams,
  emptyFiveModeState,
  normalizeScore,
  playerKey,
  renamePlayerInMiniMatches,
  sideScore,
  updatePlayerAssist,
  updatePlayerGoal,
  type FivePlayer,
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

const statBelongsToPlayer = (row: { playerId?: string; playerName: string }, player: FivePlayer) =>
  row.playerId ? row.playerId === playerKey(player) : row.playerName === player.name;

const goalValue = (side: FiveSide, player: FivePlayer) =>
  side.goals?.find((row) => statBelongsToPlayer(row, player) && !row.ownGoal)?.goals ?? 0;

const ownGoalValue = (opponentSide: FiveSide, player: FivePlayer) =>
  opponentSide.goals?.find((row) => statBelongsToPlayer(row, player) && row.ownGoal)?.goals ?? 0;

const assistValue = (side: FiveSide, player: FivePlayer) =>
  side.assists?.find((row) => statBelongsToPlayer(row, player))?.assists ?? 0;

export function FiveMode() {
  const { match, update, canEdit } = useMatch();
  const isSelected = isFiveModeFormat(match.format);
  const current = getFiveMode(match.stats);
  const [targetMatches, setTargetMatches] = useState(current.targetMatches || DEFAULT_MATCH_COUNT);
  const [teamCount, setTeamCount] = useState(current.teamCount || DEFAULT_TEAM_COUNT);

  const lineupTeams = useMemo(
    () => buildFiveTeamsFromLineup(match.home_players),
    [match.home_players],
  );
  const players = useMemo(() => lineupTeams.flatMap((team) => team.players), [lineupTeams]);
  const maxTeams = players.length >= TEAM_SIZE * 2 ? lineupTeams.length : 0;
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
      toast.error("Need at least 10 players across the pitch teams to generate 5v5 teams.");
      return;
    }

    const teams = Math.min(maxTeams, Math.max(2, normalizeScore(teamCount || DEFAULT_TEAM_COUNT)));
    const selectedTeams = buildFiveTeamsFromLineup(players).slice(0, teams);
    const count = Math.max(1, targetMatches || (teams * (teams - 1)) / 2);
    const matches = buildMiniMatchesFromTeams(selectedTeams, count);

    saveFiveMode({
      enabled: true,
      targetMatches: count,
      teamCount: teams,
      matches,
    });
    setTeamCount(teams);
    setTargetMatches(count);
    toast.success(`Generated ${teams} balanced teams and ${count} mini-matches`);
  };

  const addMatch = () => {
    const teams = Math.min(
      maxTeams,
      Math.max(2, current.teamCount || teamCount || DEFAULT_TEAM_COUNT),
    );
    const nextRound = current.matches.length + 1;
    const extra = buildMiniMatchesFromTeams(
      buildFiveTeamsFromLineup(players).slice(0, teams),
      nextRound,
    ).at(-1);
    if (!extra) {
      toast.error("Need at least 10 players across the pitch teams to add a 5v5 match.");
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

  const updateGoal = (id: number, side: "home" | "away", player: FivePlayer, goals: number) => {
    saveFiveMode({
      ...current,
      matches: updatePlayerGoal(current.matches, id, side, player, goals),
    });
  };

  const updateOwnGoal = (
    id: number,
    concedingSide: "home" | "away",
    player: FivePlayer,
    goals: number,
  ) => {
    const scoringSide = concedingSide === "home" ? "away" : "home";
    saveFiveMode({
      ...current,
      matches: updatePlayerGoal(current.matches, id, scoringSide, player, goals, { ownGoal: true }),
    });
  };

  const updateAssist = (id: number, side: "home" | "away", player: FivePlayer, assists: number) => {
    saveFiveMode({
      ...current,
      matches: updatePlayerAssist(current.matches, id, side, player, assists),
    });
  };

  const renamePlayer = (player: FivePlayer, nextName: string) => {
    saveFiveMode({
      ...current,
      matches: renamePlayerInMiniMatches(current.matches, player, nextName),
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
            <div className="mt-4 rounded-lg border border-border bg-secondary/40 p-3">
              <p className="text-[10px] tracking-[0.2em] text-muted-foreground">PLAYER SOURCE</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Using {players.length} player names from the pitch above. Uneven groups are balanced
                automatically, e.g. 13 players become 5 / 4 / 4.
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

        <div className="mt-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Goal className="h-5 w-5 text-accent" />
              <h3 className="text-2xl">Player Goals & Assists</h3>
            </div>
            {current.matches.length === 0 ? (
              <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center text-muted-foreground">
                Add player names to the 5x5x5 pitch teams above, choose how many teams you want to
                use, then generate the 5x5x5 session. The mini-matches keep those team groups.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {current.matches.map((miniMatch) => (
                  <MiniMatchCard
                    key={miniMatch.id}
                    miniMatch={miniMatch}
                    canEdit={canEdit}
                    onGoal={updateGoal}
                    onOwnGoal={updateOwnGoal}
                    onAssist={updateAssist}
                    onRename={renamePlayer}
                  />
                ))}
              </div>
            )}
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
  onOwnGoal,
  onAssist,
  onRename,
}: {
  miniMatch: FiveMiniMatch;
  canEdit: boolean;
  onGoal: (id: number, side: "home" | "away", player: FivePlayer, goals: number) => void;
  onOwnGoal: (id: number, side: "home" | "away", player: FivePlayer, goals: number) => void;
  onAssist: (id: number, side: "home" | "away", player: FivePlayer, assists: number) => void;
  onRename: (player: FivePlayer, nextName: string) => void;
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
          opponentTeam={miniMatch.away}
          canEdit={canEdit}
          onGoal={onGoal}
          onOwnGoal={onOwnGoal}
          onAssist={onAssist}
          onRename={onRename}
        />
        <TeamGoalBlock
          title={miniMatch.away.name}
          side="away"
          matchId={miniMatch.id}
          team={miniMatch.away}
          opponentTeam={miniMatch.home}
          canEdit={canEdit}
          onGoal={onGoal}
          onOwnGoal={onOwnGoal}
          onAssist={onAssist}
          onRename={onRename}
        />
      </div>
    </div>
  );
}

function TeamGoalBlock({
  title,
  team,
  opponentTeam,
  side,
  matchId,
  canEdit,
  onGoal,
  onOwnGoal,
  onAssist,
  onRename,
}: {
  title: string;
  team: FiveSide;
  opponentTeam: FiveSide;
  side: "home" | "away";
  matchId: number;
  canEdit: boolean;
  onGoal: (id: number, side: "home" | "away", player: FivePlayer, goals: number) => void;
  onOwnGoal: (id: number, side: "home" | "away", player: FivePlayer, goals: number) => void;
  onAssist: (id: number, side: "home" | "away", player: FivePlayer, assists: number) => void;
  onRename: (player: FivePlayer, nextName: string) => void;
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
            className="grid grid-cols-[1fr_200px] items-center gap-2 rounded-lg bg-secondary p-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-display text-xs text-primary-foreground">
                {initials(player.name)}
              </span>
              <Input
                value={player.name}
                onChange={(e) => onRename(player, e.target.value)}
                disabled={!canEdit}
                className="h-8 min-w-0 text-sm"
                aria-label="Player name"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3 text-accent" />
                <Input
                  type="number"
                  min={0}
                  value={goalValue(team, player)}
                  onChange={(e) => onGoal(matchId, side, player, Number(e.target.value))}
                  disabled={!canEdit}
                  className="h-8 w-11 text-center font-display"
                  aria-label={`${player.name} goals`}
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-display text-destructive">OG</span>
                <Input
                  type="number"
                  min={0}
                  value={ownGoalValue(opponentTeam, player)}
                  onChange={(e) => onOwnGoal(matchId, side, player, Number(e.target.value))}
                  disabled={!canEdit}
                  className="h-8 w-11 text-center font-display"
                  aria-label={`${player.name} own goals`}
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-display text-accent">A</span>
                <Input
                  type="number"
                  min={0}
                  value={assistValue(team, player)}
                  onChange={(e) => onAssist(matchId, side, player, Number(e.target.value))}
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
