import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import logo from "@/assets/ararat-porto-logo.png";
import jersey from "@/assets/ararat-porto-jersey.png";
import { Lineup } from "@/components/Lineup";
import { Jerseys } from "@/components/Jerseys";
import { Statistics } from "@/components/Statistics";
import { Videos } from "@/components/Videos";
import { MatchHero } from "@/components/MatchHero";
import { MatchesDialog } from "@/components/MatchesDialog";
import { MatchProvider, useMatch } from "@/lib/match-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ararat Porto FC — Matchday" },
      { name: "description", content: "Matchday hub for Ararat Porto: fixture, lineup, stats and highlights." },
      { property: "og:title", content: "Ararat Porto FC — Matchday" },
      { property: "og:description", content: "Matchday hub for Ararat Porto." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <MatchProvider>
      <Toaster richColors position="top-center" />
      <Page />
    </MatchProvider>
  );
}

function Page() {
  const { save, saving } = useMatch();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 -z-10 opacity-[0.05]"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 20%, var(--color-foreground) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <nav className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Ararat Porto crest" className="h-10 w-10 object-contain" />
            <span className="font-display text-lg tracking-wider">Ararat Porto FC</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex gap-6 text-sm font-semibold tracking-wider mr-4">
              <a href="#lineup" className="hover:text-accent transition">SQUAD</a>
              <a href="#jerseys" className="hover:text-accent transition">KIT</a>
              <a href="#stats" className="hover:text-accent transition">STATS</a>
              <a href="#videos" className="hover:text-accent transition">VIDEOS</a>
            </div>
            <MatchesDialog />
            <Button onClick={save} disabled={saving} className="font-display tracking-wider">
              <Save className="h-4 w-4 mr-2" /> {saving ? "SAVING…" : "SAVE"}
            </Button>
          </div>
        </nav>

        <div className="mx-auto max-w-7xl px-6 pt-12 pb-24 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-12 items-center">
          <div>
            <p className="text-sm tracking-[0.3em]" style={{ color: "var(--color-ember)" }}>
              MATCHDAY HUB
            </p>
            <h1 className="mt-4 text-6xl sm:text-7xl md:text-8xl leading-[0.9]">
              Matchday<br />
              <span className="text-accent">Awaits.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              From the bridges of Porto to the slopes of Ararat — set the pitch, pick the kits,
              track every play, and keep every match on record.
            </p>
            <div className="mt-10 flex items-center gap-6">
              <img
                src={jersey}
                alt="Ararat Porto official jersey"
                className="h-48 md:h-56 w-auto object-contain drop-shadow-xl"
              />
              <div>
                <p className="text-xs tracking-[0.3em] text-muted-foreground">OFFICIAL KIT</p>
                <p className="font-display text-2xl mt-1">2026 Home Jersey</p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 font-display tracking-wider">
              <a href="#lineup" className="px-6 py-3 bg-primary text-primary-foreground border-2 border-primary">
                BUILD THE LINEUP
              </a>
              <a href="#videos" className="px-6 py-3 border-2 border-primary hover:bg-primary hover:text-primary-foreground transition">
                HIGHLIGHTS
              </a>
            </div>
          </div>
          <MatchHero />
        </div>
      </header>

      <Lineup />
      <Jerseys />
      <Statistics />
      <Videos />

      <footer className="bg-background py-10 text-center text-sm text-muted-foreground">
        <p>© Ararat Porto FC · Forjado no Porto</p>
      </footer>
    </main>
  );
}
