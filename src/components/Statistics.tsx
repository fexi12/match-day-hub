import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarChart3, Plus, Trash2, Trophy } from "lucide-react";
import { playerIdentity, useMatch, type Goal, type Player, type Stat } from "@/lib/match-store";
import { reportModeForFormat } from "@/lib/match-report";
import {
  emptyFiveModeState,
  sideScore,
  teamStandingsFor,
  standingsFor,
  type FiveModeState,
} from "@/lib/five-mode";

const FIVE_MODE_LABEL = "__5X5X5_MODE__";
const visibleStats = (stats: Stat[]): Stat[] => stats.filter((s) => s.label !== FIVE_MODE_LABEL);
type FiveStat = Stat & { fiveMode?: FiveModeState };
const getFiveMode = (stats: Stat[]): FiveModeState => {
  const row = stats.find((s) => s.label === FIVE_MODE_LABEL) as FiveStat | undefined;
  return { ...emptyFiveModeState(), ...row?.fiveMode };
};

export function Statistics() {
  const { match, update, canEdit } = useMatch();
  const ro = !canEdit;
  const stats = visibleStats(match.stats);
  const reportMode = reportModeForFormat(match.format);

  const updateStat = (i: number, side: "home" | "away", v: number) => {
    const visibleIndex = stats[i];
    if (!visibleIndex) return;
    update(
      "stats",
      match.stats.map((st) => (st.label === visibleIndex.label ? { ...st, [side]: v } : st)),
    );
  };

  const homeGoals = match.goals.filter((g) => g.team === "home").length;
  const awayGoals = match.goals.filter((g) => g.team === "away").length;

  if (reportMode === "five-mode") {
    return <FiveModeFullTimeReport />;
  }

  const addGoal = (team: "home" | "away") =>
    update("goals", [
      ...match.goals,
      { id: Date.now(), team, minute: "", scorer: "", assist: "", own_goal: false },
    ]);
  const updateGoal = (id: number, patch: Partial<Goal>) =>
    update(
      "goals",
      match.goals.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    );
  const removeGoal = (id: number) =>
    update(
      "goals",
      match.goals.filter((x) => x.id !== id),
    );

  return (
    <section id="stats" className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <p className="text-sm tracking-[0.3em] text-accent">Full Time Report</p>
        <h2 className="mt-2 text-5xl md:text-6xl">Statistics</h2>

        {/* Scoreline */}
        <div className="mt-10 grid grid-cols-3 items-center gap-6 border-y-2 border-accent/40 py-10">
          <div className="text-right">
            <p className="text-xs tracking-[0.25em] text-accent">HOME</p>
            <p className="text-2xl md:text-3xl mt-1">Ararat Porto</p>
          </div>
          <div className="text-center font-display text-6xl md:text-8xl">
            <span>{homeGoals}</span>
            <span className="text-accent mx-4">:</span>
            <span>{awayGoals}</span>
          </div>
          <div className="text-left">
            <p className="text-xs tracking-[0.25em] text-accent">AWAY</p>
            <p className="text-2xl md:text-3xl mt-1">{match.opponent}</p>
          </div>
        </div>

        {/* Goals log */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <GoalColumn
            title="Ararat Porto Goals"
            goals={match.goals.filter((g) => g.team === "home")}
            onAdd={() => addGoal("home")}
            onUpdate={updateGoal}
            onRemove={removeGoal}
            ro={ro}
            players={match.home_players}
            ownGoalPlayers={match.away_players}
          />
          <GoalColumn
            title={`${match.opponent} Goals`}
            goals={match.goals.filter((g) => g.team === "away")}
            onAdd={() => addGoal("away")}
            onUpdate={updateGoal}
            onRemove={removeGoal}
            ro={ro}
            players={match.away_players}
            ownGoalPlayers={match.home_players}
          />
        </div>

        {/* Stats */}
        <div className="mt-12 flex flex-col gap-6">
          {stats.map((s, i) => {
            const total = s.home + s.away || 1;
            const homePct = (s.home / total) * 100;
            return (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-2">
                  <Input
                    type="number"
                    value={s.home}
                    onChange={(e) => updateStat(i, "home", Number(e.target.value))}
                    readOnly={ro}
                    disabled={ro}
                    className="w-20 h-9 text-center bg-primary border-accent/40 text-primary-foreground"
                  />
                  <p className="font-display tracking-[0.2em] text-accent text-center">
                    {s.label.toUpperCase()}
                  </p>
                  <Input
                    type="number"
                    value={s.away}
                    onChange={(e) => updateStat(i, "away", Number(e.target.value))}
                    readOnly={ro}
                    disabled={ro}
                    className="w-20 h-9 text-center bg-primary border-accent/40 text-primary-foreground"
                  />
                </div>
                <div className="flex h-2 rounded-full overflow-hidden bg-accent/20">
                  <div className="bg-accent transition-all" style={{ width: `${homePct}%` }} />
                  <div
                    className="bg-primary-foreground/70 transition-all"
                    style={{ width: `${100 - homePct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FiveModeFullTimeReport() {
  const { match } = useMatch();
  const current = getFiveMode(match.stats);
  const teamStandings = teamStandingsFor(current.matches);
  const playerStandings = standingsFor(current.matches);
  const totalGoals = current.matches.reduce(
    (sum, item) => sum + sideScore(item.home) + sideScore(item.away),
    0,
  );
  const totalAssists = playerStandings.reduce((sum, row) => sum + row.assists, 0);
  const maxTeamGoals = Math.max(1, ...teamStandings.map((row) => row.goalsFor));

  return (
    <section id="stats" className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <p className="text-sm tracking-[0.3em] text-accent">Full Time Report</p>
        <h2 className="mt-2 text-5xl md:text-6xl">5x5x5 Statistics</h2>
        <p className="mt-4 max-w-2xl text-primary-foreground/70">
          This format uses the team leaderboard and goals graph instead of the normal two-team match
          report.
        </p>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8">
          <div className="border-2 border-accent/40 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-accent" />
              <h3 className="text-2xl text-accent">Team Leaderboard</h3>
            </div>
            {teamStandings.length === 0 ? (
              <p className="text-sm text-primary-foreground/60 italic">
                Create 5x5x5 mini-matches manually and add player goals to create the table.
              </p>
            ) : (
              <div className="space-y-2">
                {teamStandings.map((row, index) => (
                  <div
                    key={row.name}
                    className="grid grid-cols-[32px_1fr_auto] items-center gap-3 rounded-lg border border-accent/30 p-2"
                  >
                    <span className="font-display text-lg text-primary-foreground/60">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{row.name}</p>
                      <p className="text-xs text-primary-foreground/60">
                        {row.wins}W {row.draws}D {row.losses}L · {row.goalsFor} GF · GD{" "}
                        {row.goalsFor - row.goalsAgainst}
                      </p>
                    </div>
                    <span className="font-display text-2xl text-accent">{row.wins}W</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-2 border-accent/40 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-accent" />
              <h3 className="text-2xl text-accent">Goals Graph</h3>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center mb-5">
              <FiveMetric label="Teams" value={current.teamCount || teamStandings.length || 3} />
              <FiveMetric label="Goals" value={totalGoals} />
              <FiveMetric label="Assists" value={totalAssists} />
            </div>
            {teamStandings.length === 0 ? (
              <p className="text-sm text-primary-foreground/60 italic">
                Goals per team will appear here after scoring the mini-matches.
              </p>
            ) : (
              <div className="space-y-3">
                {teamStandings.map((row) => (
                  <div key={row.name}>
                    <div className="mb-1 flex justify-between gap-3 text-xs">
                      <span className="truncate">{row.name}</span>
                      <span>
                        {row.goalsFor} GF / {row.wins}W
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-primary-foreground/20 overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all"
                        style={{ width: `${Math.max(6, (row.goalsFor / maxTeamGoals) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FiveMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-primary-foreground/10 p-3">
      <p className="text-[10px] tracking-[0.2em] text-accent">{label.toUpperCase()}</p>
      <p className="font-display text-3xl">{value}</p>
    </div>
  );
}

function GoalColumn({
  title,
  goals,
  onAdd,
  onUpdate,
  onRemove,
  ro,
  players,
  ownGoalPlayers,
}: {
  title: string;
  goals: Goal[];
  onAdd: () => void;
  onUpdate: (id: number, patch: Partial<Goal>) => void;
  onRemove: (id: number) => void;
  ro: boolean;
  players: Player[];
  ownGoalPlayers: Player[];
}) {
  const selectableFor = (items: Player[]) =>
    items
      .map((player) => ({ ...player, id: playerIdentity(player) }))
      .filter((player) => player.id && (player.name || player.email));
  const selectablePlayers = selectableFor(players);
  const selectableOwnGoalPlayers = selectableFor(ownGoalPlayers);

  const applyPlayer = (goal: Goal, role: "scorer" | "assist", value: string) => {
    const sourcePlayers =
      goal.own_goal && role === "scorer" ? selectableOwnGoalPlayers : selectablePlayers;
    const player = sourcePlayers.find((p) => p.id === value);
    if (!player) {
      onUpdate(
        goal.id,
        role === "scorer"
          ? { scorer_id: undefined, scorer: "" }
          : { assist_id: undefined, assist: "" },
      );
      return;
    }
    onUpdate(
      goal.id,
      role === "scorer"
        ? { scorer_id: player.id, scorer: player.name }
        : { assist_id: player.id, assist: player.name },
    );
  };

  const toggleOwnGoal = (goal: Goal) => {
    onUpdate(goal.id, {
      own_goal: !goal.own_goal,
      scorer_id: undefined,
      scorer: "",
      assist_id: undefined,
      assist: "",
    });
  };
  return (
    <div className="border-2 border-accent/40 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl text-accent">{title}</h3>
        <Button
          size="sm"
          onClick={onAdd}
          disabled={ro}
          className="bg-accent text-accent-foreground hover:bg-accent/90 font-display tracking-wider"
        >
          <Plus className="h-4 w-4 mr-1" /> GOAL
        </Button>
      </div>

      {goals.length === 0 && (
        <p className="text-sm text-primary-foreground/60 italic">No goals yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {goals.map((g) => (
          <div key={g.id} className="grid grid-cols-[50px_56px_1fr_1fr_auto] gap-2 items-center">
            <Input
              placeholder="min"
              value={g.minute}
              onChange={(e) => onUpdate(g.id, { minute: e.target.value })}
              readOnly={ro}
              disabled={ro}
              className="h-9 text-center bg-primary border-accent/40 text-primary-foreground"
            />
            <Button
              type="button"
              size="sm"
              variant={g.own_goal ? "destructive" : "outline"}
              onClick={() => toggleOwnGoal(g)}
              disabled={ro}
              className="h-9 px-2 font-display text-xs"
              title="Own goal: goal counts for this team, scorer is selected from the opponent"
            >
              OG
            </Button>
            <PlayerSelect
              label={g.own_goal ? "Own goal by" : "Scorer"}
              value={g.scorer_id ?? ""}
              snapshot={g.scorer}
              players={g.own_goal ? selectableOwnGoalPlayers : selectablePlayers}
              disabled={ro}
              onChange={(value) => applyPlayer(g, "scorer", value)}
            />
            <PlayerSelect
              label="Assist"
              value={g.assist_id ?? ""}
              snapshot={g.assist}
              players={selectablePlayers}
              disabled={ro || !!g.own_goal}
              allowNone
              onChange={(value) => applyPlayer(g, "assist", value)}
            />
            <button
              onClick={() => onRemove(g.id)}
              disabled={ro}
              className="text-primary-foreground/60 hover:text-destructive p-2 disabled:opacity-40"
              aria-label="Remove goal"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayerSelect({
  label,
  value,
  snapshot,
  players,
  disabled,
  allowNone = false,
  onChange,
}: {
  label: string;
  value: string;
  snapshot: string;
  players: Array<Player & { id: string }>;
  disabled: boolean;
  allowNone?: boolean;
  onChange: (value: string) => void;
}) {
  const selectedExists = value && players.some((player) => player.id === value);
  return (
    <select
      aria-label={label}
      value={selectedExists ? value : ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="h-9 min-w-0 rounded-md border border-accent/40 bg-primary px-2 text-sm text-primary-foreground disabled:opacity-60"
    >
      <option value="">{snapshot || (allowNone ? "No assist" : label)}</option>
      {snapshot && !selectedExists && (
        <option value="" disabled>
          {snapshot} (snapshot)
        </option>
      )}
      {players.map((player) => (
        <option key={player.id} value={player.id}>
          {player.name || player.email}
        </option>
      ))}
    </select>
  );
}
