import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMatch, normalizePlayers, type Format, type Player } from "@/lib/match-store";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { usePlayerAvatars, initialsOf, hueOf } from "@/lib/use-player-avatars";
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
  const { match, update, load, save, canEdit } = useMatch();
  const { user, signInWithGoogle } = useAuth();
  const size = useMemo(() => parseInt(match.format), [match.format]);
  const positions = FORMATIONS[match.format];

  const homePlayers = ensureSize(match.home_players, size);
  const awayPlayers = ensureSize(match.away_players, size);

  // Look up Google avatars for any player with an email
  const allEmails = useMemo(
    () => [...homePlayers, ...awayPlayers].map((p) => p.email ?? "").filter(Boolean),
    [homePlayers, awayPlayers],
  );
  const avatarMap = usePlayerAvatars(allEmails);

  const resolvePhoto = (p: Player): string | undefined => {
    if (p.email && avatarMap[p.email.toLowerCase()]) return avatarMap[p.email.toLowerCase()];
    return p.photo_url;
  };

  const setPlayer = (team: "home" | "away", i: number, patch: Partial<Player>) => {
    const key = team === "home" ? "home_players" : "away_players";
    const arr = ensureSize(match[key], size);
    arr[i] = { ...arr[i], ...patch };
    update(key, arr);
  };

  const removeSelf = (team: "home" | "away", i: number) => {
    if (!user) return;
    const key = team === "home" ? "home_players" : "away_players";
    const arr = ensureSize(match[key], size);
    arr[i] = { name: "", email: "" };
    update(key, arr);
    toast.success("Removed from squad");
  };

  const claimSlot = async (team: "home" | "away", i: number) => {
    if (!user) {
      await signInWithGoogle();
      return;
    }
    let matchId = match.id;
    if (!matchId) {
      if (!canEdit) {
        toast.error("Ask an admin to save the match first");
        return;
      }
      const saved = await save();
      if (!saved) return;
      matchId = saved;
    }
    const { error } = await supabase.rpc("claim_lineup_slot", {
      _match_id: matchId,
      _team: team,
      _slot_index: i,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    // Refresh the match row to reflect the change
    const { data, error: fetchErr } = await supabase
      .from("matches")
      .select("home_players, away_players")
      .eq("id", matchId)
      .single();
    if (fetchErr || !data) {
      toast.success("Claimed!");
      return;
    }
    load({
      ...match,
      home_players: normalizePlayers(data.home_players),
      away_players: normalizePlayers(data.away_players),
    });
    toast.success("You're on the pitch!");
  };


  return (
    <section id="lineup" className="bg-background border-b border-border">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <p className="text-sm tracking-[0.3em]" style={{ color: "var(--color-ember)" }}>
          Tactics Board
        </p>
        <h2 className="mt-2 text-5xl md:text-6xl">The Squad</h2>

        {user && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm" style={{ backgroundColor: "oklch(0.65 0.22 35 / 0.08)", borderColor: "oklch(0.65 0.22 35 / 0.25)", color: "oklch(0.65 0.22 35)" }}>
            <span>💡</span>
            <span>
              <strong>Tip:</strong> Click any empty position on the pitch to take that spot — your name and Google photo appear there instantly.
            </span>
          </div>
        )}

<div className="mt-6 flex items-center gap-8">
          <ColorPicker label="HOME KIT" value={match.home_color} onChange={(v) => update("home_color", v)} />
          <ColorPicker label="AWAY KIT" value={match.away_color} onChange={(v) => update("away_color", v)} />
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[2.2fr_1fr] gap-8">
          <div className="relative aspect-[2/3] sm:aspect-[3/5] md:aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border-2 border-primary">
            <Pitch />
            {positions.away.map(([x, y], i) => (
              <PlayerMarker
                key={`a${i}`}
                x={x}
                y={y}
                color={match.away_color}
                number={i + 1}
                player={awayPlayers[i]}
                photo={resolvePhoto(awayPlayers[i])}
                onClaim={() => claimSlot("away", i)}
                onRemoveSelf={() => removeSelf("away", i)}
                userEmail={user?.email ?? null}
                isSignedIn={!!user}
              />
            ))}
            {positions.home.map(([x, y], i) => (
              <PlayerMarker
                key={`h${i}`}
                x={x}
                y={y}
                color={match.home_color}
                number={i + 1}
                player={homePlayers[i]}
                photo={resolvePhoto(homePlayers[i])}
                onClaim={() => claimSlot("home", i)}
                onRemoveSelf={() => removeSelf("home", i)}
                userEmail={user?.email ?? null}
                isSignedIn={!!user}
              />
            ))}

          </div>

          <div className="flex flex-col gap-6">
            <Roster
              title="Home Team"
              color={match.home_color}
              size={size}
              players={homePlayers}
              canEdit={canEdit}
              onChange={(i, patch) => setPlayer("home", i, patch)}
            />
            <Roster
              title={match.opponent || "Away Team"}
              color={match.away_color}
              size={size}
              players={awayPlayers}
              canEdit={canEdit}
              onChange={(i, patch) => setPlayer("away", i, patch)}
            />

            {!user && (
              <p className="text-xs text-muted-foreground italic">
                Sign in to add players. Each player's Google photo appears once they sign in with the email you set.
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
  canEdit,
  onChange,
}: {
  title: string;
  color: string;
  size: number;
  players: Player[];
  canEdit: boolean;
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
            canEdit={canEdit}
            onChange={(patch) => onChange(i, patch)}
          />
        ))}
      </div>
    </div>
  );
}

function InitialsAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = initialsOf(name);
  const hue = hueOf(name);
  const sizes = {
    sm: "h-9 w-9 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-full w-full text-base",
  };
  return (
    <div
      className={`${sizes[size]} flex items-center justify-center font-display font-bold text-white`}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 65% 45%), hsl(${(hue + 40) % 360} 65% 35%))` }}
    >
      {initials}
    </div>
  );
}

function PlayerRow({
  index,
  player,
  canEdit,
  onChange,
}: {
  index: number;
  player: Player;
  canEdit: boolean;
  onChange: (patch: Partial<Player>) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-display text-lg w-7 text-muted-foreground">{index + 1}</span>
      <Input
        value={player.name ?? ""}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder={`Add player ${index + 1}`}
        className="h-9 flex-1"
        readOnly={!canEdit}
        disabled={!canEdit}
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
  photo,
  onClaim,
  userEmail,
  isSignedIn,
}: {
  x: number;
  y: number;
  color: string;
  number: number;
  player: Player;
  photo: string | undefined;
  onClaim: () => void | Promise<void>;
  onRemoveSelf: () => void | Promise<void>;
  userEmail: string | null;
  isSignedIn: boolean;
}) {
  const isLight = ["#f0e8d6", "#ffffff", "#e0b441", "#5cbdb9"].includes(color);
  const name = player?.name;
  const isEmpty = !name && !player?.email;
  const isMine = !!userEmail && !!player?.email && player.email.toLowerCase() === userEmail.toLowerCase();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={`relative h-10 w-10 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-full border-2 shadow-lg overflow-hidden flex items-center justify-center font-display transition ${
              isMine || isEmpty ? "cursor-pointer hover:scale-110 hover:ring-2 hover:ring-primary/60" : "cursor-default"
            } ${isMine ? "ring-2 ring-primary" : ""}`}
            style={{
              backgroundColor: color,
              color: isLight ? "#1a1a1a" : "#ffffff",
              borderColor: "#ffffff",
            }}
          >
            {photo ? (
              <img src={photo} alt={name ?? `Player ${number}`} className="absolute inset-0 h-full w-full object-cover" />
            ) : name ? (
              <InitialsAvatar name={name} size="lg" />
            ) : (
              <span className="text-sm sm:text-xl md:text-2xl">{number}</span>
            )}
            {isMine && (
              <div
                className="absolute top-0 right-0 h-4 w-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                style={{ backgroundColor: "oklch(0.65 0.22 35)" }}
              >×</div>
            )}
          </button>
          {name && !isMine && (
            <span className="mt-1 px-2 py-0.5 text-[11px] font-semibold bg-primary text-primary-foreground rounded whitespace-nowrap max-w-[120px] truncate">
              {name}
            </span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" side="top">
        {isMine ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">That's you! Click to remove yourself.</p>
            <button
              type="button"
              onClick={async () => {
                setOpen(false);
                await onRemoveSelf();
              }}
              className="w-full px-3 py-2 rounded font-display text-sm hover:opacity-90 transition"
              style={{ backgroundColor: "oklch(0.65 0.22 35)", color: "white" }}
            >
              Remove me
            </button>
          </div>
        ) : isSignedIn ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">Take position #{number}</p>
            <button
              type="button"
              onClick={async () => {
                setOpen(false);
                await onClaim();
              }}
              className="w-full px-3 py-2 rounded bg-primary text-primary-foreground font-display text-sm hover:opacity-90 transition"
            >
              Place me here
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">Sign in to claim this spot with your Google photo.</p>
            <button
              type="button"
              onClick={async () => {
                setOpen(false);
                await onClaim();
              }}
              className="w-full px-3 py-2 rounded bg-primary text-primary-foreground font-display text-sm hover:opacity-90 transition"
            >
              Sign in with Google
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

