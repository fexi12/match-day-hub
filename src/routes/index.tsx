import { createFileRoute, Link } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { Plus, LogIn, LogOut, ShieldCheck, Menu } from "lucide-react";
import logo from "@/assets/ararat-porto-logo.png";
import venue from "@/assets/match-venue.jpg";

import { Lineup } from "@/components/Lineup";
import { Jerseys } from "@/components/Jerseys";
import { Statistics } from "@/components/Statistics";
import { Videos } from "@/components/Videos";
import { MatchHero } from "@/components/MatchHero";
import { FiveMode } from "@/components/FiveMode";
import { Weather } from "@/components/Weather";
import { MatchesDialog } from "@/components/MatchesDialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MatchProvider, useMatch } from "@/lib/match-store";
import { AuthProvider, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ararat Porto FC — Matchday" },
      {
        name: "description",
        content: "Matchday hub for Ararat Porto: fixture, lineup, stats and highlights.",
      },
      { property: "og:title", content: "Ararat Porto FC — Matchday" },
      { property: "og:description", content: "Ararat Porto FC matchday hub." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <AuthProvider>
      <MatchProvider>
        <Toaster richColors position="top-center" />
        <Page />
      </MatchProvider>
    </AuthProvider>
  );
}

// Uniform boxed-button style shared across header + hero (same size, width, padding, font, border)
const navBtn =
  "inline-flex items-center justify-center min-w-[140px] px-6 py-3 border-2 border-primary " +
  "font-display text-sm tracking-wider rounded-md transition " +
  "hover:bg-primary hover:text-primary-foreground";
const navBtnActive = navBtn + " bg-primary text-primary-foreground";
const navBtnPrimary = navBtnActive;
const navBtnDisabled = navBtnPrimary + " disabled:pointer-events-none disabled:opacity-50";

function Page() {
  const { match, saving, createNewMatch } = useMatch();
  const { user, signOut, isAdmin } = useAuth();

  const handleNewGame = async () => {
    const ok = window.confirm(
      "Start a new game? The current game stays saved in MATCHES. " +
        "A fresh squad, stats, goals and videos will be created.",
    );
    if (!ok) return;
    await createNewMatch();
  };

  const navLinks = user ? (
    <div className="flex flex-col gap-1">
      <a
        href="#lineup"
        className="px-4 py-3 text-sm font-semibold tracking-wider hover:bg-accent/20 rounded-lg transition"
      >
        SQUAD
      </a>
      <a
        href="#stats"
        className="px-4 py-3 text-sm font-semibold tracking-wider hover:bg-accent/20 rounded-lg transition"
      >
        STATS
      </a>
      <a
        href="#videos"
        className="px-4 py-3 text-sm font-semibold tracking-wider hover:bg-accent/20 rounded-lg transition"
      >
        VIDEOS
      </a>
      <a
        href="/rankings"
        className="px-4 py-3 text-sm font-semibold tracking-wider hover:bg-accent/20 rounded-lg transition"
      >
        RANKINGS
      </a>
    </div>
  ) : (
    <div className="flex flex-col gap-1">
      <a
        href="#lineup"
        className="px-4 py-3 text-sm font-semibold tracking-wider hover:bg-accent/20 rounded-lg transition"
      >
        SQUAD
      </a>
      <a
        href="#stats"
        className="px-4 py-3 text-sm font-semibold tracking-wider hover:bg-accent/20 rounded-lg transition"
      >
        STATS
      </a>
      <a
        href="#videos"
        className="px-4 py-3 text-sm font-semibold tracking-wider hover:bg-accent/20 rounded-lg transition"
      >
        VIDEOS
      </a>
    </div>
  );

  const actions = user ? (
    <>
      {isAdmin && (
        <Link to="/admin" className={`${navBtn} w-full`}>
          <ShieldCheck className="h-4 w-4 mr-2" />
          ADMIN
        </Link>
      )}
      <Link to="/rankings" className={`${navBtn} w-full`}>
        📊 RANKINGS
      </Link>
      <button
        type="button"
        onClick={handleNewGame}
        disabled={saving}
        className={`${navBtnDisabled} w-full`}
      >
        <Plus className="h-4 w-4 mr-2" /> NEW GAME
      </button>
      <button type="button" onClick={signOut} className={`${navBtn} w-full`}>
        <LogOut className="h-4 w-4 mr-2" /> SIGN OUT
      </button>
    </>
  ) : (
    <Link to="/login" className={`${navBtnPrimary} w-full`}>
      <LogIn className="h-4 w-4 mr-2" /> SIGN IN
    </Link>
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 -z-10 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, var(--color-foreground) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <nav className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Ararat Porto crest" className="h-10 w-10 object-contain" />
            <span className="font-display text-lg tracking-wider">Ararat Porto FC</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex gap-6 text-sm font-semibold tracking-wider mr-4">
              <a href="#lineup" className="hover:text-accent transition">
                SQUAD
              </a>
              <a href="#stats" className="hover:text-accent transition">
                STATS
              </a>
              <a href="#videos" className="hover:text-accent transition">
                VIDEOS
              </a>
              {user && (
                <a href="/rankings" className="hover:text-accent transition">
                  RANKINGS
                </a>
              )}
            </div>
            {user && (
              <>
                <MatchesDialog className={navBtn} />
                {isAdmin && (
                  <Link to="/admin" className={navBtn}>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    ADMIN
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleNewGame}
                  disabled={saving}
                  className={navBtnDisabled}
                >
                  <Plus className="h-4 w-4 mr-2" /> NEW GAME
                </button>
                <button type="button" onClick={signOut} className={navBtn}>
                  <LogOut className="h-4 w-4 mr-2" /> SIGN OUT
                </button>
              </>
            )}
            {!user && (
              <Link to="/login" className={navBtnPrimary}>
                <LogIn className="h-4 w-4 mr-2" /> SIGN IN
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            {user && saving && (
              <span className="text-xs text-muted-foreground font-display tracking-wider animate-pulse">
                Saving…
              </span>
            )}
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="p-2 rounded-md hover:bg-accent/20 transition"
                  aria-label="Open menu"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 pt-8">
                {navLinks}
                <div className="mt-6 flex flex-col gap-2">
                  {user && (
                    <div className="mb-2">
                      <MatchesDialog />
                    </div>
                  )}
                  {actions}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>

        <div className="mx-auto max-w-7xl px-6 pt-12 pb-24 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-12 items-center">
          <div>
            <p className="text-sm tracking-[0.3em]" style={{ color: "var(--color-ember)" }}>
              MATCHDAY HUB
            </p>
            <h1 className="mt-4 text-6xl sm:text-7xl md:text-8xl leading-[0.9]">
              Matchday
              <br />
              <span className="text-accent">Awaits.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              From the bridges of Porto to the slopes of Ararat — set the pitch, pick the kits,
              track every play, and keep every match on record.
            </p>
            <div className="mt-10 flex flex-wrap gap-3 font-display tracking-wider">
              {user ? (
                <>
                  <a href="#lineup" className={navBtnActive}>
                    BUILD THE LINEUP
                  </a>
                  <a href="#videos" className={navBtn}>
                    HIGHLIGHTS
                  </a>
                  <a href="/rankings" className={navBtn}>
                    RANKINGS
                  </a>
                  <MatchesDialog className={navBtn} />
                </>
              ) : (
                <>
                  <a href="#lineup" className={navBtnActive}>
                    BUILD THE LINEUP
                  </a>
                  <a href="#videos" className={navBtn}>
                    HIGHLIGHTS
                  </a>
                  <a href="#stats" className={navBtn}>
                    STATS
                  </a>
                </>
              )}
            </div>
          </div>
          {user && <MatchHero />}
          {!user && (
            <div className="w-full md:w-96 border-2 border-primary rounded-xl bg-card shadow-xl overflow-hidden">
              <img src={venue} alt="Match venue" className="h-40 w-full object-cover" />
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-[10px] tracking-[0.2em] text-muted-foreground">MATCH NAME</p>
                  <p className="mt-1 font-display text-xl border-0 px-0 shadow-none h-auto py-1">
                    {match.name}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] tracking-[0.2em] text-muted-foreground">HOME</p>
                    <p className="mt-1 font-display text-sm">Ararat Porto</p>
                  </div>
                  <div>
                    <p className="text-[10px] tracking-[0.2em] text-muted-foreground">OPPONENT</p>
                    <p className="mt-1 font-display text-sm">{match.opponent || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] tracking-[0.2em] text-muted-foreground">DATE</p>
                    <p className="mt-1 font-display text-sm">{match.match_date || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] tracking-[0.2em] text-muted-foreground">KICK-OFF</p>
                    <p className="mt-1 font-display text-sm">{match.kickoff || "—"}</p>
                  </div>
                  {match.referee && (
                    <div>
                      <p className="text-[10px] tracking-[0.2em] text-muted-foreground">REFEREE</p>
                      <p className="mt-1 font-display text-sm">{match.referee}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] tracking-[0.2em] text-muted-foreground">FORMAT</p>
                    <p className="mt-1 font-display text-sm">{match.format}</p>
                  </div>
                  <div>
                    <p className="text-[10px] tracking-[0.2em] text-muted-foreground">DURATION</p>
                    <p className="mt-1 font-display text-sm">{match.duration || "—"}</p>
                  </div>
                  {match.location && (
                    <div className="col-span-2">
                      <p className="text-[10px] tracking-[0.2em] text-muted-foreground">LOCATION</p>
                      <p className="mt-1 font-display text-sm">{match.location}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <Lineup />
      <FiveMode />
      <Weather />
      <Statistics />
      <Videos />

      <Jerseys />

      <footer className="bg-background py-10 text-center text-sm text-muted-foreground">
        <p>© Ararat Porto FC · Forjado no Porto</p>
      </footer>
    </main>
  );
}
