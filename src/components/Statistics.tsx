import { useState } from "react";
import { Input } from "@/components/ui/input";

type Stat = { label: string; home: number; away: number };

const DEFAULT: Stat[] = [
  { label: "Goals", home: 0, away: 0 },
  { label: "Shots on Target", home: 0, away: 0 },
  { label: "Possession %", home: 50, away: 50 },
  { label: "Corners", home: 0, away: 0 },
  { label: "Fouls", home: 0, away: 0 },
  { label: "Yellow Cards", home: 0, away: 0 },
];

export function Statistics() {
  const [stats, setStats] = useState<Stat[]>(DEFAULT);

  const update = (i: number, side: "home" | "away", v: number) => {
    setStats((s) => s.map((st, idx) => (idx === i ? { ...st, [side]: v } : st)));
  };

  return (
    <section id="stats" className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-sm tracking-[0.3em] text-accent">Full Time Report</p>
        <h2 className="mt-2 text-5xl md:text-6xl">Statistics</h2>

        {/* Scoreline */}
        <div className="mt-10 grid grid-cols-3 items-center gap-6 border-y-2 border-accent/40 py-10">
          <div className="text-right">
            <p className="text-xs tracking-[0.25em] text-accent">HOME</p>
            <p className="text-2xl md:text-3xl mt-1">Ararat Porto</p>
          </div>
          <div className="text-center font-display text-6xl md:text-8xl">
            <span>{stats[0].home}</span>
            <span className="text-accent mx-4">:</span>
            <span>{stats[0].away}</span>
          </div>
          <div className="text-left">
            <p className="text-xs tracking-[0.25em] text-accent">AWAY</p>
            <p className="text-2xl md:text-3xl mt-1">Rivals FC</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-10 flex flex-col gap-6">
          {stats.map((s, i) => {
            const total = s.home + s.away || 1;
            const homePct = (s.home / total) * 100;
            return (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-2">
                  <Input
                    type="number"
                    value={s.home}
                    onChange={(e) => update(i, "home", Number(e.target.value))}
                    className="w-20 h-9 text-center bg-primary border-accent/40 text-primary-foreground"
                  />
                  <p className="font-display tracking-[0.2em] text-accent">{s.label.toUpperCase()}</p>
                  <Input
                    type="number"
                    value={s.away}
                    onChange={(e) => update(i, "away", Number(e.target.value))}
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
