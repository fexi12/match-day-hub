import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Target, Handshake, Users, CalendarCheck, Star } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { usePlayerAvatars, initialsOf, hueOf } from "@/lib/use-player-avatars";
import { buildSeasonStats, normalizeNameKey, type SeasonMatchRow } from "@/lib/season-stats";
import { normalizeRatingKey } from "@/lib/rating-key";

type Props = {
  name: string;
  email?: string;
  photoUrl?: string;
  children: ReactNode;
};

export function PlayerProfileTrigger({ name, email, photoUrl, children }: Props) {
  const [open, setOpen] = useState(false);
  if (!name && !email) return <>{children}</>;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        {open && <PlayerProfileBody name={name} email={email} photoUrl={photoUrl} />}
      </DialogContent>
    </Dialog>
  );
}

function PlayerProfileBody({ name, email, photoUrl }: Omit<Props, "children">) {
  const [matches, setMatches] = useState<SeasonMatchRow[]>([]);
  const [ratings, setRatings] = useState<{ rating: number; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const displayYear = new Date().getFullYear();
  const avatarMap = usePlayerAvatars(email ? [email] : []);
  const avatar = (email && avatarMap[email.toLowerCase()]) || photoUrl;

  useEffect(() => {
    const start = `${displayYear}-01-01`;
    const end = `${displayYear + 1}-01-01`;
    setLoading(true);
    Promise.all([
      supabase
        .from("matches")
        .select("id,name,match_date,format,home_players,away_players,goals,stats,attendees")
        .gte("match_date", start)
        .lt("match_date", end)
        .order("match_date", { ascending: true }),
      supabase
        .from("player_ratings")
        .select("rating, created_at")
        .eq("player_key", normalizeRatingKey(name))
        .order("created_at", { ascending: true }),
    ]).then(([matchesRes, ratingsRes]) => {
      setMatches((matchesRes.data ?? []) as SeasonMatchRow[]);
      setRatings(ratingsRes.data ?? []);
      setLoading(false);
    });
  }, [name, displayYear]);

  const seasonStats = useMemo(() => buildSeasonStats(matches), [matches]);
  const key = normalizeNameKey(name);
  const stats = seasonStats.find((s) => s.key === key);

  const ratingAvg = ratings.length
    ? Math.round((ratings.reduce((a, b) => a + b.rating, 0) / ratings.length) * 10) / 10
    : null;

  const trendData = ratings.map((r) => ({ date: r.created_at, rating: r.rating }));

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          {avatar ? (
            <img src={avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: `hsl(${hueOf(email ?? name)} 60% 45%)` }}
            >
              {initialsOf(name)}
            </span>
          )}
          <span className="font-display text-2xl tracking-wider">{name}</span>
        </DialogTitle>
      </DialogHeader>

      {loading ? (
        <p className="py-10 text-center text-muted-foreground">Loading…</p>
      ) : (
        <div className="mt-2">
          <p className="text-xs tracking-[0.2em] text-muted-foreground mb-3">
            SEASON {displayYear}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              icon={<Target className="h-4 w-4" />}
              label="Goals"
              value={stats?.goals ?? 0}
            />
            <StatCard
              icon={<Handshake className="h-4 w-4" />}
              label="Assists"
              value={stats?.assists ?? 0}
            />
            <StatCard
              icon={<Users className="h-4 w-4" />}
              label="Appearances"
              value={stats?.appearances ?? 0}
            />
            <StatCard
              icon={<CalendarCheck className="h-4 w-4" />}
              label="Attendances"
              value={stats?.attendances ?? 0}
            />
          </div>

          <div className="mt-6 rounded-xl border-2 border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-4 w-4 text-accent" />
              <p className="font-display text-sm tracking-wider">Rating Trend</p>
              {ratingAvg !== null && (
                <span className="ml-auto font-display text-xl">{ratingAvg}/10</span>
              )}
            </div>
            {trendData.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-4 text-center">
                No ratings yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(d) => {
                      try {
                        return format(parseISO(d), "MMM d");
                      } catch {
                        return d;
                      }
                    }}
                  />
                  <YAxis domain={[0, 10]} ticks={[0, 5, 10]} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "2px solid var(--color-border)",
                      borderRadius: "8px",
                    }}
                    formatter={(val: number) => [`${val}/10`, "Rating"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="rating"
                    stroke="#d44a2a"
                    strokeWidth={2}
                    dot={{ fill: "#d44a2a", r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border-2 border-border p-3 text-center">
      <div className="flex items-center justify-center gap-1.5 text-accent">{icon}</div>
      <p className="mt-1 font-display text-2xl">{value}</p>
      <p className="text-[10px] tracking-[0.15em] text-muted-foreground">{label.toUpperCase()}</p>
    </div>
  );
}
