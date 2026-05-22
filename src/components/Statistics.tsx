import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useMatch, type Goal } from "@/lib/match-store";

export function Statistics() {
  const { match, update } = useMatch();

  const updateStat = (i: number, side: "home" | "away", v: number) => {
    update("stats", match.stats.map((st, idx) => (idx === i ? { ...st, [side]: v } : st)));
  };

  const homeGoals = match.goals.filter((g) => g.team === "home").length;
  const awayGoals = match.goals.filter((g) => g.team === "away").length;

  const addGoal = (team: "home" | "away") =>
    update("goals", [...match.goals, { id: Date.now(), team, minute: "", scorer: "", assist: "" }]);
  const updateGoal = (id: number, patch: Partial<Goal>) =>
    update("goals", match.goals.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const removeGoal = (id: number) =>
    update("goals", match.goals.filter((x) => x.id !== id));

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
          />
          <GoalColumn
            title={`${match.opponent} Goals`}
            goals={match.goals.filter((g) => g.team === "away")}
            onAdd={() => addGoal("away")}
            onUpdate={updateGoal}
            onRemove={removeGoal}
          />
        </div>

        {/* Stats */}
        <div className="mt-12 flex flex-col gap-6">
          {match.stats.map((s, i) => {
            const total = s.home + s.away || 1;
            const homePct = (s.home / total) * 100;
            return (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-2">
                  <Input
                    type="number"
                    value={s.home}
                    onChange={(e) => updateStat(i, "home", Number(e.target.value))}
                    className="w-20 h-9 text-center bg-primary border-accent/40 text-primary-foreground"
                  />
                  <p className="font-display tracking-[0.2em] text-accent text-center">{s.label.toUpperCase()}</p>
                  <Input
                    type="number"
                    value={s.away}
                    onChange={(e) => updateStat(i, "away", Number(e.target.value))}
                    className="w-20 h-9 text-center bg-primary border-accent/40 text-primary-foreground"
                  />
                </div>
                <div className="flex h-2 rounded-full overflow-hidden bg-accent/20">
                  <div className="bg-accent transition-all" style={{ width: `${homePct}%` }} />
                  <div className="bg-primary-foreground/70 transition-all" style={{ width: `${100 - homePct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function GoalColumn({
  title,
  goals,
  onAdd,
  onUpdate,
  onRemove,
}: {
  title: string;
  goals: Goal[];
  onAdd: () => void;
  onUpdate: (id: number, patch: Partial<Goal>) => void;
  onRemove: (id: number) => void;
}) {
  return (
    <div className="border-2 border-accent/40 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl text-accent">{title}</h3>
        <Button
          size="sm"
          onClick={onAdd}
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
          <div key={g.id} className="grid grid-cols-[50px_1fr_1fr_auto] gap-2 items-center">
            <Input
              placeholder="min"
              value={g.minute}
              onChange={(e) => onUpdate(g.id, { minute: e.target.value })}
              className="h-9 text-center bg-primary border-accent/40 text-primary-foreground"
            />
            <Input
              placeholder="Scorer"
              value={g.scorer}
              onChange={(e) => onUpdate(g.id, { scorer: e.target.value })}
              className="h-9 bg-primary border-accent/40 text-primary-foreground"
            />
            <Input
              placeholder="Assist"
              value={g.assist}
              onChange={(e) => onUpdate(g.id, { assist: e.target.value })}
              className="h-9 bg-primary border-accent/40 text-primary-foreground"
            />
            <button
              onClick={() => onRemove(g.id)}
              className="text-primary-foreground/60 hover:text-destructive p-2"
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
