import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { useMatch, type Format } from "@/lib/match-store";

const FORMATIONS: Record<Format, { home: [number, number][]; away: [number, number][] }> = {
  "5v5": {
    home: [[50, 95], [22, 78], [78, 78], [50, 62], [50, 45]],
    away: [[50, 5], [22, 22], [78, 22], [50, 38], [50, 55]],
  },
  "7v7": {
    home: [[50, 95], [25, 80], [75, 80], [18, 62], [50, 62], [82, 62], [50, 47]],
    away: [[50, 5], [25, 20], [75, 20], [18, 38], [50, 38], [82, 38], [50, 53]],
  },
  "8v8": {
    home: [[50, 95], [20, 80], [50, 80], [80, 80], [20, 62], [50, 62], [80, 62], [50, 47]],
    away: [[50, 5], [20, 20], [50, 20], [80, 20], [20, 38], [50, 38], [80, 38], [50, 53]],
  },
  "11v11": {
    home: [[50, 96], [12, 82], [37, 82], [63, 82], [88, 82], [12, 64], [37, 64], [63, 64], [88, 64], [35, 48], [65, 48]],
    away: [[50, 4], [12, 18], [37, 18], [63, 18], [88, 18], [12, 36], [37, 36], [63, 36], [88, 36], [35, 52], [65, 52]],
  },
};

const SHIRT_COLORS = [
  { name: "Navy", value: "#1e3a5f" },
  { name: "Cream", value: "#f0e8d6" },
  { name: "Ember", value: "#d44a2a" },
  { name: "Gold", value: "#e0b441" },
  { name: "Forest", value: "#2d5a3d" },
  { name: "Snow", value: "#ffffff" },
  { name: "Coal", value: "#1a1a1a" },
  { name: "Sky", value: "#5cbdb9" },
];

export function Lineup() {
  const { match, update } = useMatch();
  const size = useMemo(() => parseInt(match.format), [match.format]);
  const positions = FORMATIONS[match.format];

  const setName = (team: "home" | "away", i: number, v: string) => {
    const key = team === "home" ? "home_players" : "away_players";
    const arr = [...match[key]];
    arr[i] = v;
    update(key, arr);
  };

  return (
    <section id="lineup" className="bg-background border-b border-border">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <p className="text-sm tracking-[0.3em]" style={{ color: "var(--color-ember)" }}>
          Tactics Board
        </p>
        <h2 className="mt-2 text-5xl md:text-6xl">The Squad</h2>

        {/* Controls */}
        <div className="mt-10 flex flex-wrap items-end gap-8">
          <div>
            <p className="mb-3 text-xs tracking-[0.25em] text-muted-foreground">FORMAT</p>
            <div className="flex flex-wrap gap-2">
              {(["5v5", "7v7", "8v8", "11v11"] as Format[]).map((f) => (
                <button
                  key={f}
                  onClick={() => update("format", f)}
                  className={`px-5 py-2 font-display text-lg border-2 transition ${
                    match.format === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <ColorPicker label="HOME KIT" value={match.home_color} onChange={(v) => update("home_color", v)} />
          <ColorPicker label="AWAY KIT" value={match.away_color} onChange={(v) => update("away_color", v)} />
        </div>

        {/* Field + Rosters — pitch gets much more room */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[2.2fr_1fr] gap-8">
          <div className="relative aspect-[2/3] sm:aspect-[3/5] md:aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border-2 border-primary">
            <Pitch />
            {positions.away.map(([x, y], i) => (
              <Jersey key={`a${i}`} x={x} y={y} color={match.away_color} number={i + 1} name={match.away_players[i]} />
            ))}
            {positions.home.map(([x, y], i) => (
              <Jersey key={`h${i}`} x={x} y={y} color={match.home_color} number={i + 1} name={match.home_players[i]} />
            ))}
          </div>

          <div className="flex flex-col gap-6">
            <Roster
              title="Home Team"
              color={match.home_color}
              size={size}
              names={match.home_players}
              onChange={(i, v) => setName("home", i, v)}
            />
            <Roster
              title={match.opponent || "Away Team"}
              color={match.away_color}
              size={size}
              names={match.away_players}
              onChange={(i, v) => setName("away", i, v)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="mb-3 text-xs tracking-[0.25em] text-muted-foreground">{label}</p>
      <div className="flex gap-2 items-center flex-wrap">
        {SHIRT_COLORS.map((c) => (
          <button
            key={c.value}
            onClick={() => onChange(c.value)}
            title={c.name}
            className={`h-8 w-8 rounded-full border-2 transition ${
              value === c.value ? "border-primary scale-110" : "border-border"
            }`}
            style={{ backgroundColor: c.value }}
          />
        ))}
      </div>
    </div>
  );
}

function Roster({
  title,
  color,
  size,
  names,
  onChange,
}: {
  title: string;
  color: string;
  size: number;
  names: string[];
  onChange: (i: number, v: string) => void;
}) {
  return (
    <div className="border-2 border-primary rounded-xl p-5 bg-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-5 w-5 rounded-full border-2 border-primary" style={{ backgroundColor: color }} />
        <h3 className="text-xl">{title}</h3>
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: size }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="font-display text-lg w-7 text-muted-foreground">{i + 1}</span>
            <Input
              value={names[i] ?? ""}
              onChange={(e) => onChange(i, e.target.value)}
              placeholder={`Player ${i + 1}`}
              className="h-9"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function Pitch() {
  return (
    <svg viewBox="0 0 100 140" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
      <defs>
        <pattern id="stripes" width="100" height="14" patternUnits="userSpaceOnUse">
          <rect width="100" height="14" fill="#2d5a3d" />
          <rect y="7" width="100" height="7" fill="#326a45" />
        </pattern>
      </defs>
      <rect width="100" height="140" fill="url(#stripes)" />
      <g fill="none" stroke="#f0e8d6" strokeWidth="0.4" opacity="0.9">
        <rect x="3" y="3" width="94" height="134" />
        <line x1="3" y1="70" x2="97" y2="70" />
        <circle cx="50" cy="70" r="10" />
        <circle cx="50" cy="70" r="0.8" fill="#f0e8d6" />
        <rect x="25" y="3" width="50" height="16" />
        <rect x="37" y="3" width="26" height="7" />
        <rect x="25" y="121" width="50" height="16" />
        <rect x="37" y="130" width="26" height="7" />
      </g>
    </svg>
  );
}

function Jersey({ x, y, color, number, name }: { x: number; y: number; color: string; number: number; name?: string }) {
  const isLight = ["#f0e8d6", "#ffffff", "#e0b441", "#5cbdb9"].includes(color);
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div
        className="h-8 w-8 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-full border-2 border-white flex items-center justify-center font-display text-sm sm:text-xl md:text-2xl shadow-lg"
        style={{ backgroundColor: color, color: isLight ? "#1a1a1a" : "#ffffff" }}
      >
        {number}
      </div>
      {name && (
        <span className="mt-1 px-2 py-0.5 text-[11px] font-semibold bg-primary text-primary-foreground rounded whitespace-nowrap max-w-[110px] truncate">
          {name}
        </span>
      )}
    </div>
  );
}
