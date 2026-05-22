import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FolderOpen, Search, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMatch, defaultMatch, normalizePlayers, type MatchState } from "@/lib/match-store";
import { toast } from "sonner";

type Row = {
  id: string;
  name: string;
  opponent: string;
  match_date: string | null;
  location: string | null;
  created_at: string;
};

export function MatchesDialog() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const { load } = useMatch();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from("matches")
      .select("id,name,opponent,match_date,location,created_at")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        else setRows(data ?? []);
        setLoading(false);
      });
  }, [open]);

  const filtered = rows.filter((r) => {
    const s = q.toLowerCase().trim();
    if (!s) return true;
    return (
      r.name.toLowerCase().includes(s) ||
      r.opponent.toLowerCase().includes(s) ||
      (r.location ?? "").toLowerCase().includes(s) ||
      (r.match_date ?? "").includes(s)
    );
  });

  const openMatch = async (id: string) => {
    const { data, error } = await supabase.from("matches").select("*").eq("id", id).single();
    if (error || !data) {
      toast.error(error?.message ?? "Failed to load");
      return;
    }
    const m: MatchState = {
      id: data.id,
      name: data.name,
      opponent: data.opponent,
      match_date: data.match_date ?? "",
      kickoff: data.kickoff ?? "",
      duration: data.duration ?? "",
      location: data.location ?? "",
      format: data.format as MatchState["format"],
      home_color: data.home_color,
      away_color: data.away_color,
      home_players: normalizePlayers(data.home_players),
      away_players: normalizePlayers(data.away_players),
      stats: (data.stats as MatchState["stats"]) ?? [],
      goals: (data.goals as MatchState["goals"]) ?? [],
      videos: (data.videos as MatchState["videos"]) ?? [],
    };
    load(m);
    setOpen(false);
    toast.success(`Loaded "${m.name}"`);
  };

  const removeRow = async (id: string) => {
    const { error } = await supabase.from("matches").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((r) => r.filter((x) => x.id !== id));
    toast.success("Deleted");
  };

  const newMatch = () => {
    load(defaultMatch());
    setOpen(false);
    toast.success("Started a new match");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="font-display tracking-wider">
          <FolderOpen className="h-4 w-4 mr-2" /> MATCHES
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-wider">Past Matches</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, opponent, location or date…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={newMatch} variant="default">
            <Plus className="h-4 w-4 mr-1" /> New
          </Button>
        </div>

        <div className="max-h-[400px] overflow-y-auto flex flex-col gap-2 mt-2">
          {loading && <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground py-10 text-center italic">
              No matches found. Save one from the main page.
            </p>
          )}
          {filtered.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 border-2 border-border rounded-lg p-3 hover:border-primary transition cursor-pointer"
              onClick={() => openMatch(r.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="font-display text-lg truncate">{r.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  vs {r.opponent}
                  {r.match_date ? ` · ${r.match_date}` : ""}
                  {r.location ? ` · ${r.location}` : ""}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeRow(r.id);
                }}
                className="text-muted-foreground hover:text-destructive p-2"
                aria-label="Delete match"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
