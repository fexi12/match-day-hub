import { useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useMatch, type Format, type Player } from "@/lib/match-store";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

const FORMATIONS: Record<Format, { home: [number, number][]; away: [number, number][] }> = {
  "5v5": {
    home: [[50, 96], [22, 82], [78, 82], [50, 70], [50, 58]],
    away: [[50, 4], [22, 18], [78, 18], [50, 30], [50, 42]],
  },
  "7v7": {
    home: [[50, 96], [25, 84], [75, 84], [18, 72], [50, 72], [82, 72], [50, 58]],
    away: [[50, 4], [25, 16], [75, 16], [18, 28], [50, 28], [82, 28], [50, 42]],
  },
  "8v8": {
    home: [[50, 96], [20, 84], [50, 84], [80, 84], [20, 72], [50, 72], [80, 72], [50, 58]],
    away: [[50, 4], [20, 16], [50, 16], [80, 16], [20, 28], [50, 28], [80, 28], [50, 42]],
  },
  "11v11": {
    home: [[50, 96], [12, 84], [37, 84], [63, 84], [88, 84], [12, 70], [37, 70], [63, 70], [88, 70], [35, 56], [65, 56]],
    away: [[50, 4], [12, 16], [37, 16], [63, 16], [88, 16], [12, 30], [37, 30], [63, 30], [88, 30], [35, 44], [65, 44]],
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

const ensureSize = (arr: Player[], n: number): Player[] => {
  const out = [...arr];
  while (out.length < n) out.push({ name: "" });
  return out.slice(0, n);
};

export function Lineup() {
  const { match, update } = useMatch();
  const { user } = useAuth();
  const size = useMemo(() => parseInt(match.format), [match.format]);
  const positions = FORMATIONS[match.format];

  const setPlayer = (team: "home" | "away", i: number, patch: Partial<Player>) => {
    const key = team === "home" ? "home_players" : "away_players";
    const arr = ensureSize(match[key], size);
    arr[i] = { ...arr[i], ...patch };
    update(key, arr);
  };

  const homePlayers = ensureSize(match.home_players, size);
  const awayPlayers = ensureSize(match.away_players, size);

  return (
    <section id="lineup" className="bg-background border-b border-border">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <p className="text-sm tracking-[0.3em]" style={{ color: "var(--color-ember)" }}>
          Tactics Board
        </p>
        <h2 className="mt-2 text-5xl md:text-6xl">The Squad</h2>

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

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[2.2fr_1fr] gap-8">
          <div className="relative aspect-[2/3] sm:aspect-[3/5] md:aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border-2 border-primary">
            <Pitch />
            {positions.away.map(([x, y], i) => (
              <PlayerMarker key={`a${i}`} x={x} y={y} color={match.away_color} number={i + 1} player={awayPlayers[i]} />
            ))}
            {positions.home.map(([x, y], i) => (
              <PlayerMarker key={`h${i}`} x={x} y={y} color={match.home_color} number={i + 1} player={homePlayers[i]} />
            ))}
          </div>

          <div className="flex flex-col gap-6">
            <Roster
              title="Home Team"
              color={match.home_color}
              size={size}
              players={homePlayers}
              canUpload={!!user}
              onChange={(i, patch) => setPlayer("home", i, patch)}
            />
            <Roster
              title={match.opponent || "Away Team"}
              color={match.away_color}
              size={size}
              players={awayPlayers}
              canUpload={!!user}
              onChange={(i, patch) => setPlayer("away", i, patch)}
            />
            {!user && (
              <p className="text-xs text-muted-foreground italic">
                Sign in to upload player photos.
              </p>
            )}
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
  players,
  canUpload,
  onChange,
}: {
  title: string;
  color: string;
  size: number;
  players: Player[];
  canUpload: boolean;
  onChange: (i: number, patch: Partial<Player>) => void;
}) {
  return (
    <div className="border-2 border-primary rounded-xl p-5 bg-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-5 w-5 rounded-full border-2 border-primary" style={{ backgroundColor: color }} />
        <h3 className="text-xl">{title}</h3>
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: size }).map((_, i) => (
          <PlayerRow
            key={i}
            index={i}
            player={players[i] ?? { name: "" }}
            canUpload={canUpload}
            onChange={(patch) => onChange(i, patch)}
          />
        ))}
      </div>
    </div>
  );
}

function PlayerRow({
  index,
  player,
  canUpload,
  onChange,
}: {
  index: number;
  player: Player;
  canUpload: boolean;
  onChange: (patch: Partial<Player>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;
    const { error } = await supabase.storage.from("player-photos").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    const { data } = supabase.storage.from("player-photos").getPublicUrl(path);
    onChange({ photo_url: data.publicUrl });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="font-display text-lg w-7 text-muted-foreground">{index + 1}</span>
      <button
        type="button"
        onClick={() => canUpload && inputRef.current?.click()}
        disabled={!canUpload}
        title={canUpload ? "Upload photo" : "Sign in to upload"}
        className="h-9 w-9 shrink-0 rounded-full border-2 border-border overflow-hidden flex items-center justify-center bg-muted hover:border-primary transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {player.photo_url ? (
          <img src={player.photo_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImagePlus className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      <Input
        value={player.name ?? ""}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder={`Player ${index + 1}`}
        className="h-9 flex-1"
      />
      {player.photo_url && (
        <button
          type="button"
          onClick={() => onChange({ photo_url: undefined })}
          className="text-muted-foreground hover:text-destructive p-1"
          title="Remove photo"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
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

function PlayerMarker({
  x,
  y,
  color,
  number,
  player,
}: {
  x: number;
  y: number;
  color: string;
  number: number;
  player: Player;
}) {
  const isLight = ["#f0e8d6", "#ffffff", "#e0b441", "#5cbdb9"].includes(color);
  const name = player?.name;
  const photo = player?.photo_url;
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div
        className="relative h-10 w-10 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-full border-2 shadow-lg overflow-hidden flex items-center justify-center font-display"
        style={{
          backgroundColor: color,
          color: isLight ? "#1a1a1a" : "#ffffff",
          borderColor: "#ffffff",
        }}
      >
        {photo ? (
          <>
            <img src={photo} alt={name ?? `Player ${number}`} className="absolute inset-0 h-full w-full object-cover" />
            <span
              className="absolute -bottom-0.5 -right-0.5 h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] sm:text-xs font-display"
              style={{ backgroundColor: color, color: isLight ? "#1a1a1a" : "#ffffff" }}
            >
              {number}
            </span>
          </>
        ) : (
          <span className="text-sm sm:text-xl md:text-2xl">{number}</span>
        )}
      </div>
      {name && (
        <span className="mt-1 px-2 py-0.5 text-[11px] font-semibold bg-primary text-primary-foreground rounded whitespace-nowrap max-w-[120px] truncate">
          {name}
        </span>
      )}
    </div>
  );
}
