import { createFileRoute } from "@tanstack/react-router";
import logo from "@/assets/ararat-porto-logo.jpg";

import { Lineup } from "@/components/Lineup";
import { Statistics } from "@/components/Statistics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ararat Porto FC — Matchday" },
      { name: "description", content: "Matchday hub for Ararat Porto: fixture details, lineup and statistics." },
      { property: "og:title", content: "Ararat Porto FC — Matchday" },
      { property: "og:description", content: "Matchday hub for Ararat Porto." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10 opacity-[0.05]" style={{
          backgroundImage: "radial-gradient(circle at 20% 20%, var(--color-foreground) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />
        <nav className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Ararat Porto crest" className="h-10 w-10 object-contain" />
            <span className="font-display text-lg tracking-wider">Ararat Porto FC</span>
          </div>
          <div className="hidden sm:flex gap-8 text-sm font-semibold tracking-wider">
            <a href="#match" className="hover:text-accent transition">FIXTURE</a>
            <a href="#lineup" className="hover:text-accent transition">SQUAD</a>
            <a href="#stats" className="hover:text-accent transition">STATS</a>
          </div>
        </nav>

        <div className="mx-auto max-w-6xl px-6 pt-12 pb-24 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-12 items-center">
          <div>
            <p className="text-sm tracking-[0.3em] text-muted-foreground" style={{ color: "var(--color-ember)" }}>
              EST. PORTO · NEXT FIXTURE
            </p>
            <h1 className="mt-4 text-6xl sm:text-7xl md:text-8xl leading-[0.9]">
              Matchday<br />
              <span className="text-accent">Awaits.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              From the bridges of Porto to the slopes of Ararat — set the pitch, pick the kits, track every play.
            </p>
            <div className="mt-8 flex gap-3 font-display tracking-wider">
              <a href="#lineup" className="px-6 py-3 bg-primary text-primary-foreground border-2 border-primary">
                BUILD THE LINEUP
              </a>
              <a href="#match" className="px-6 py-3 border-2 border-primary hover:bg-primary hover:text-primary-foreground transition">
                FIXTURE INFO
              </a>
            </div>
          </div>
          <div className="w-full md:w-80 border-2 border-primary rounded-xl bg-card p-5 shadow-xl">
            <p className="text-xs tracking-[0.25em]" style={{ color: "var(--color-ember)" }}>
              MATCHDAY 01
            </p>
            <p className="mt-2 font-display text-2xl leading-tight">
              Ararat Porto <span className="text-accent">vs</span> Rivals FC
            </p>
            <div className="mt-4 border-t border-border pt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <p className="text-[10px] tracking-[0.2em] text-muted-foreground">DATE</p>
                <p className="font-semibold">Sat 30 May</p>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.2em] text-muted-foreground">KICK-OFF</p>
                <p className="font-semibold">19:30</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] tracking-[0.2em] text-muted-foreground">LOCATION</p>
                <p className="font-semibold">Campo do Dragão · Porto</p>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.2em] text-muted-foreground">DURATION</p>
                <p className="font-semibold">90 min</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      
      <Lineup />
      <Statistics />

      <footer className="bg-background py-10 text-center text-sm text-muted-foreground">
        <p>© Ararat Porto FC · Forjado no Porto</p>
      </footer>
    </main>
  );
}
