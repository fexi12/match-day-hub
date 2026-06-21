import { Input } from "@/components/ui/input";
import { useMatch } from "@/lib/match-store";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import venue from "@/assets/match-venue.jpg";
import type { Format } from "@/lib/match-store";
import { MATCH_FORMATS } from "@/lib/match-formats";

export function MatchHero() {
  const { match, update, canEdit } = useMatch();

  const mapsUrl = match.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.location)}`
    : "#";

  return (
    <div className="w-full md:w-96 border-2 border-primary rounded-xl bg-card shadow-xl overflow-hidden">
      <img src={venue} alt="Match venue" className="h-40 w-full object-cover" />
      <div className="p-5 space-y-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] text-muted-foreground">MATCH NAME</p>
          <Input
            value={match.name}
            onChange={(e) => update("name", e.target.value)}
            className="mt-1 font-display text-xl border-0 px-0 focus-visible:ring-0 shadow-none h-auto py-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="HOME">
            <span className="font-display text-sm">Ararat Porto</span>
          </Field>
          <Field label="OPPONENT">
            <Input
              value={match.opponent}
              onChange={(e) => update("opponent", e.target.value)}
              className="h-7 px-1"
            />
          </Field>
          <Field label="DATE">
            <Input
              type="date"
              value={match.match_date}
              onChange={(e) => update("match_date", e.target.value)}
              className="h-7 px-1"
            />
          </Field>
          <Field label="KICK-OFF">
            <Input
              type="time"
              value={match.kickoff}
              onChange={(e) => update("kickoff", e.target.value)}
              className="h-7 px-1"
            />
          </Field>
          <Field label="DURATION">
            <Input
              value={match.duration}
              onChange={(e) => update("duration", e.target.value)}
              className="h-7 px-1"
            />
          </Field>
          <div>
            <p className="text-[10px] tracking-[0.2em] text-muted-foreground">FORMAT</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="mt-1">
                    <select
                      value={match.format}
                      onChange={(e) => update("format", e.target.value as Format)}
                      className="h-7 px-1 w-full bg-background border border-border rounded text-xs font-display cursor-help"
                    >
                      {MATCH_FORMATS.map((format) => (
                        <option key={format.value} value={format.value}>
                          {format.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px] text-center">
                  <p>
                    Select the match format. 5x5x5 opens the player pool and manual mini-match
                    creator.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Field label="MAP">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold underline hover:text-accent"
            >
              Open
            </a>
          </Field>
          <div className="col-span-2">
            <p className="text-[10px] tracking-[0.2em] text-muted-foreground">LOCATION</p>
            <Input
              value={match.location}
              onChange={(e) => update("location", e.target.value)}
              className="h-8 mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.2em] text-muted-foreground">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}
