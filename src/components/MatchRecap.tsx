import { useRef, useState } from "react";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMatch } from "@/lib/match-store";
import logo from "@/assets/ararat-porto-logo.png";
import { toast } from "sonner";

export function MatchRecap() {
  const { match } = useMatch();
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const homeGoals =
    match.goals.filter((g) => g.team === "home" && !g.own_goal).length +
    match.goals.filter((g) => g.team === "away" && g.own_goal).length;
  const awayGoals =
    match.goals.filter((g) => g.team === "away" && !g.own_goal).length +
    match.goals.filter((g) => g.team === "home" && g.own_goal).length;

  const scorerCounts = new Map<string, number>();
  for (const g of match.goals) {
    if (g.own_goal || !g.scorer) continue;
    scorerCounts.set(g.scorer, (scorerCounts.get(g.scorer) ?? 0) + 1);
  }
  const topScorer = [...scorerCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  const dateLabel = match.match_date
    ? new Date(match.match_date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const renderToPng = async () => {
    if (!cardRef.current) return null;
    const { toPng } = await import("html-to-image");
    return toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
  };

  const filename = `${(match.name || "matchday").replace(/\s+/g, "-").toLowerCase()}-recap.png`;

  const download = async () => {
    setBusy(true);
    try {
      const dataUrl = await renderToPng();
      if (!dataUrl) return;
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = filename;
      a.click();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate image");
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    setBusy(true);
    try {
      const dataUrl = await renderToPng();
      if (!dataUrl) return;
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: match.name || "Matchday Recap",
          text: `Ararat Porto ${homeGoals} : ${awayGoals} ${match.opponent}`,
        });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = filename;
        a.click();
        toast.info("Sharing isn't supported here — downloaded instead.");
      }
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") {
        toast.error(e.message || "Failed to share");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="recap" className="bg-background border-b border-border">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <p className="text-sm tracking-[0.3em]" style={{ color: "var(--color-ember)" }}>
          Share The Result
        </p>
        <h2 className="mt-2 text-5xl md:text-6xl">Match Recap</h2>

        <div className="mt-10 flex flex-col items-center gap-6">
          <div
            ref={cardRef}
            className="w-full max-w-md rounded-2xl border-2 border-primary bg-card p-8 text-foreground"
          >
            <div className="flex items-center justify-center gap-2">
              <img src={logo} alt="" className="h-8 w-8 object-contain" />
              <span className="font-display text-sm tracking-[0.25em] text-muted-foreground">
                ARARAT PORTO FC
              </span>
            </div>

            <p className="mt-6 text-center text-xs tracking-[0.25em] text-muted-foreground">
              {dateLabel || "MATCHDAY"}
            </p>

            <div className="mt-4 grid grid-cols-3 items-center gap-2 text-center">
              <p className="font-display text-lg leading-tight">Ararat Porto</p>
              <p className="font-display text-5xl">
                {homeGoals}
                <span className="text-accent mx-1">:</span>
                {awayGoals}
              </p>
              <p className="font-display text-lg leading-tight">{match.opponent || "Opponent"}</p>
            </div>

            {topScorer && (
              <p className="mt-6 text-center text-sm">
                <span className="text-accent font-semibold">⚽ Top Scorer:</span> {topScorer[0]} ·{" "}
                {topScorer[1]} {topScorer[1] > 1 ? "goals" : "goal"}
              </p>
            )}

            {match.goals.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <p className="text-center text-[10px] tracking-[0.2em] text-muted-foreground mb-2">
                  GOALS
                </p>
                <div className="flex flex-col gap-1 text-center text-sm">
                  {match.goals.map((g) => (
                    <p key={g.id}>
                      {g.minute ? `${g.minute}' ` : ""}
                      {g.scorer || (g.team === "home" ? "Ararat Porto" : match.opponent)}
                      {g.own_goal ? " (OG)" : ""}
                      {g.assist ? ` (assist: ${g.assist})` : ""}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <p className="mt-8 text-center text-[10px] tracking-[0.2em] text-muted-foreground">
              ARARATPORTOFC.COM · MATCHDAY HUB
            </p>
          </div>

          <div className="flex gap-3">
            <Button onClick={download} disabled={busy} className="font-display tracking-wider">
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
            <Button
              onClick={share}
              disabled={busy}
              variant="outline"
              className="font-display tracking-wider"
            >
              <Share2 className="h-4 w-4 mr-2" /> Share
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
