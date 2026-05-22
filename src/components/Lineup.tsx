import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Format = "5v5" | "7v7" | "8v8";

const FORMATIONS: Record<Format, { home: [number, number][]; away: [number, number][] }> = {
  "5v5": {
    home: [[50, 92], [25, 70], [75, 70], [35, 50], [65, 50]],
    away: [[50, 8], [25, 30], [75, 30], [35, 50], [65, 50]],
  },
  "7v7": {
    home: [[50, 94], [20, 75], [50, 75], [80, 75], [25, 55], [50, 55], [75, 55]],
    away: [[50, 6], [20, 25], [50, 25], [80, 25], [25, 45], [50, 45], [75, 45]],
  },
  "8v8": {
    home: [[50, 94], [18, 78], [40, 78], [60, 78], [82, 78], [30, 58], [50, 58], [70, 58]],
    away: [[50, 6], [18, 22], [40, 22], [60, 22], [82, 22], [30, 42], [50, 42], [70, 42]],
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
  const [format, setFormat] = useState<Format>("7v7");
  const [homeColor, setHomeColor] = useState("#1e3a5f");
  const [awayColor, setAwayColor] = useState("#d44a2a");
  const [homeNames, setHomeNames] = useState<string[]>([]);
  const [awayNames, setAwayNames] = useState<string[]>([]);

  const size = useMemo(() => parseInt(format), [format]);
  const positions = FORMATIONS[format];

  const setName = (team: "home" | "away", i: number, v: string) => {
    const arr = team === "home" ? [...homeNames] : [...awayNames];
    arr[i] = v;
    team === "home" ? setHomeNames(arr) : setAwayNames(arr);
  };

  return (
    <section id="lineup" className="bg-background border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-sm tracking-[0.3em] text-ember" style={{ color: "var(--color-ember)" }}>
          Tactics Board
        </p>
        <h2 className="mt-2 text-5xl md:text-6xl">The Squad</h2>

        {/* Controls */}
        <div className="mt-10 flex flex-wrap items-end gap-8">
          <div>
            <p className="mb-3 text-xs tracking-[0.25em] text-muted-foreground">FORMAT</p>
            <div className="flex gap-2">
              {(["5v5", "7v7", "8v8"] as Format[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-5 py-2 font-display text-lg border-2 transition ${
                    format === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <ColorPicker label="HOME KIT" value={homeColor} onChange={setHomeColor} />
          <ColorPicker label="AWAY KIT" value={awayColor} onChange={setAwayColor} />
        </div>

        {/* Field + Rosters */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Pitch */}
          <div className="relative aspect-[3/4] sm:aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border-2 border-primary">
            <Pitch />
            {positions.away.map(([x, y], i) => (
              <Jersey key={`a${i}`} x={x} y={y} color={awayColor} number={i + 1} name={awayNames[i]} />
            ))}
            {positions.home.map(([x, y], i) => (
              <Jersey key={`h${i}`} x={x} y={y} color={homeColor} number={i + 1} name={homeNames[i]} />
            ))}
          </div>

          {/* Rosters */}
          <div className="flex flex-col gap-6">
            <Roster
              title="Ararat Porto"
              color={homeColor}
              size={size}
              names={homeNames}
              onChange={(i, v) => setName("home", i, v)}
            />
            <Roster
              title="Rivals FC"
              color={awayColor}
              size={size}
              names={awayNames}
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
      <div className="flex gap-2 items-center">
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
        {/* boxes */}
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
        className="h-9 w-9 sm:h-11 sm:w-11 rounded-full border-2 border-white flex items-center justify-center font-display text-lg shadow-lg"
        style={{ backgroundColor: color, color: isLight ? "#1a1a1a" : "#ffffff" }}
      >
        {number}
      </div>
      {name && (
        <span className="mt-1 px-1.5 py-0.5 text-[10px] font-semibold bg-primary text-primary-foreground rounded whitespace-nowrap max-w-[80px] truncate">
          {name}
        </span>
      )}
    </div>
  );
}
