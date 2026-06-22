import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, X } from "lucide-react";
import { useMatch, withPlayerIdentity, playerIdentity, type Player } from "@/lib/match-store";
import { usePlayerAvatars, initialsOf, hueOf } from "@/lib/use-player-avatars";

export function Attendance() {
  const { match, update, canEdit } = useMatch();
  const [newName, setNewName] = useState("");

  const attendees = match.attendees ?? [];

  const rosterPlayers = useMemo(() => {
    const seen = new Set<string>();
    const out: Player[] = [];
    for (const p of [...match.home_players, ...match.away_players]) {
      const id = playerIdentity(p);
      if (!id || !(p.name || p.email) || seen.has(id)) continue;
      seen.add(id);
      out.push(p);
    }
    return out;
  }, [match.home_players, match.away_players]);

  const attendingIds = useMemo(
    () => new Set(attendees.map((p) => playerIdentity(p)).filter(Boolean)),
    [attendees],
  );

  const allEmails = useMemo(
    () => [...rosterPlayers, ...attendees].map((p) => p.email ?? "").filter(Boolean),
    [rosterPlayers, attendees],
  );
  const avatarMap = usePlayerAvatars(allEmails);
  const resolvePhoto = (p: Player) => (p.email && avatarMap[p.email.toLowerCase()]) || p.photo_url;

  const toggleRosterPlayer = (player: Player) => {
    if (!canEdit) return;
    const id = playerIdentity(player);
    if (attendingIds.has(id)) {
      update(
        "attendees",
        attendees.filter((p) => playerIdentity(p) !== id),
      );
    } else {
      update("attendees", [...attendees, withPlayerIdentity(player)]);
    }
  };

  const addManual = () => {
    const name = newName.trim();
    if (!name) return;
    const player = withPlayerIdentity({ name }, { generateManualId: true });
    update("attendees", [...attendees, player]);
    setNewName("");
  };

  const removeAttendee = (id: string) => {
    update(
      "attendees",
      attendees.filter((p) => playerIdentity(p) !== id),
    );
  };

  return (
    <section id="attendance" className="bg-background border-b border-border">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <p className="text-sm tracking-[0.3em]" style={{ color: "var(--color-ember)" }}>
          Who Showed Up
        </p>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="mt-2 text-5xl md:text-6xl">Attendance</h2>
          <div className="flex items-center gap-2 rounded-full border-2 border-primary px-4 py-2">
            <Users className="h-4 w-4 text-accent" />
            <span className="font-display text-lg">{attendees.length}</span>
            <span className="text-xs text-muted-foreground tracking-widest">PRESENT</span>
          </div>
        </div>

        {rosterPlayers.length > 0 && (
          <div className="mt-8">
            <p className="text-xs tracking-[0.2em] text-muted-foreground mb-3">
              TAP TO MARK PRESENT — FROM TODAY'S SQUAD
            </p>
            <div className="flex flex-wrap gap-2">
              {rosterPlayers.map((p) => {
                const id = playerIdentity(p);
                const present = attendingIds.has(id);
                const photo = resolvePhoto(p);
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => toggleRosterPlayer(p)}
                    className={`flex items-center gap-2 rounded-full border-2 pl-1.5 pr-3 py-1.5 transition disabled:cursor-default ${
                      present
                        ? "border-accent bg-accent/15"
                        : "border-border hover:border-accent/60"
                    }`}
                  >
                    {photo ? (
                      <img src={photo} alt="" className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: `hsl(${hueOf(p.email ?? p.name)} 60% 45%)` }}
                      >
                        {initialsOf(p.name)}
                      </span>
                    )}
                    <span className="text-sm font-semibold">{p.name || p.email}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8">
          <p className="text-xs tracking-[0.2em] text-muted-foreground mb-3">
            EXTRA ATTENDEES (NOT IN SQUAD)
          </p>
          <div className="flex flex-wrap gap-2">
            {attendees
              .filter((p) => !rosterPlayers.some((r) => playerIdentity(r) === playerIdentity(p)))
              .map((p) => {
                const id = playerIdentity(p);
                return (
                  <span
                    key={id}
                    className="flex items-center gap-2 rounded-full border-2 border-accent bg-accent/15 pl-3 pr-1.5 py-1.5"
                  >
                    <span className="text-sm font-semibold">{p.name || p.email}</span>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => removeAttendee(id)}
                        className="rounded-full p-1 hover:bg-accent/30"
                        aria-label="Remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                );
              })}
            {attendees.filter(
              (p) => !rosterPlayers.some((r) => playerIdentity(r) === playerIdentity(p)),
            ).length === 0 && <p className="text-sm text-muted-foreground italic">None yet.</p>}
          </div>

          {canEdit && (
            <div className="mt-4 flex gap-2 max-w-sm">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addManual()}
                placeholder="Add a name…"
              />
              <Button type="button" onClick={addManual} variant="outline">
                <UserPlus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
