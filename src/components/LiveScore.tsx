import { useMatch } from "@/lib/match-store";

export function LiveScore() {
  const { match } = useMatch();

  const homeGoals =
    match.goals.filter((g) => g.team === "home" && !g.own_goal).length +
    match.goals.filter((g) => g.team === "away" && g.own_goal).length;
  const awayGoals =
    match.goals.filter((g) => g.team === "away" && !g.own_goal).length +
    match.goals.filter((g) => g.team === "home" && g.own_goal).length;

  const hasGoals = match.goals.length > 0;

  return (
    <section className="border-b-2 border-border bg-card">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Score strip */}
        <div className="grid grid-cols-3 items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] tracking-[0.25em] text-muted-foreground mb-1">HOME</p>
            <p className="font-display text-lg md:text-2xl">Ararat Porto</p>
          </div>

          <div className="text-center">
            <p className="text-[10px] tracking-[0.25em] text-muted-foreground mb-1">LIVE</p>
            <div className="font-display text-5xl md:text-7xl flex items-center justify-center gap-3 leading-none">
              <span className="transition-all duration-300" style={{ color: match.home_color }}>
                {homeGoals}
              </span>
              <span className="text-muted-foreground text-3xl md:text-5xl">:</span>
              <span className="transition-all duration-300" style={{ color: match.away_color }}>
                {awayGoals}
              </span>
            </div>
          </div>

          <div className="text-left">
            <p className="text-[10px] tracking-[0.25em] text-muted-foreground mb-1">AWAY</p>
            <p className="font-display text-lg md:text-2xl">{match.opponent || "Opponent"}</p>
          </div>
        </div>

        {/* Goal feed */}
        {hasGoals && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {[...match.goals].reverse().map((g) => {
              const isHome = g.team === "home";
              const color = isHome ? match.home_color : match.away_color;
              const label = g.own_goal
                ? `${g.scorer} (OG)`
                : g.scorer || (isHome ? "Ararat Porto" : match.opponent);
              return (
                <span
                  key={g.id}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{ borderColor: color, color }}
                >
                  <span
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  {g.minute ? `${g.minute}' ` : ""}
                  {label}
                  {g.assist ? ` · ${g.assist}` : ""}
                </span>
              );
            })}
          </div>
        )}

        {!hasGoals && (
          <p className="mt-4 text-center text-xs text-muted-foreground tracking-widest">
            NO GOALS YET
          </p>
        )}
      </div>
    </section>
  );
}
