import { MapPin, Clock, Timer, Calendar } from "lucide-react";
import { useMatch } from "@/lib/match-store";
import { format, parseISO } from "date-fns";

export function MatchInfo() {
  const { match } = useMatch();

  const dateDisplay = match.match_date
    ? format(parseISO(match.match_date), "EEEE, d MMMM yyyy")
    : "TBD";

  const items = [
    { icon: Calendar, label: "Date", value: dateDisplay },
    { icon: MapPin, label: "Location", value: match.location || "TBD" },
    { icon: Clock, label: "Kick-off", value: match.kickoff || "TBD" },
    { icon: Timer, label: "Duration", value: match.duration || "TBD" },
  ];

  return (
    <section id="match" className="border-b border-border bg-primary text-primary-foreground">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 flex items-end justify-between gap-6 flex-wrap">
          <div>
            <p className="text-sm tracking-[0.3em] text-accent">{match.name}</p>
            <h2 className="mt-2 text-5xl md:text-6xl text-primary-foreground">The Fixture</h2>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">
              Ararat Porto <span className="text-accent">vs</span>{" "}
              {match.opponent}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-accent/30 border border-accent/30 rounded-xl overflow-hidden">
          {items.map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-primary p-8 flex flex-col gap-3">
              <Icon className="h-7 w-7 text-accent" strokeWidth={1.5} />
              <p className="text-xs tracking-[0.25em] text-accent/80">{label.toUpperCase()}</p>
              <p className="text-lg font-semibold leading-snug">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}