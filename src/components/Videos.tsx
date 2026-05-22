import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, PlayCircle } from "lucide-react";
import { useMatch } from "@/lib/match-store";

function toEmbed(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    // YouTube
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    // Vimeo
    if (u.hostname.includes("vimeo.com")) {
      return `https://player.vimeo.com/video/${u.pathname.slice(1)}`;
    }
    return url;
  } catch {
    return null;
  }
}

export function Videos() {
  const { match, update } = useMatch();

  const add = () =>
    update("videos", [...match.videos, { id: Date.now(), title: "", url: "" }]);
  const edit = (id: number, patch: { title?: string; url?: string }) =>
    update("videos", match.videos.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  const remove = (id: number) =>
    update("videos", match.videos.filter((v) => v.id !== id));

  return (
    <section id="videos" className="bg-background border-b border-border">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm tracking-[0.3em]" style={{ color: "var(--color-ember)" }}>
              On Tape
            </p>
            <h2 className="mt-2 text-5xl md:text-6xl">Video Highlights</h2>
          </div>
          <Button onClick={add} className="font-display tracking-wider">
            <Plus className="h-4 w-4 mr-1" /> ADD VIDEO
          </Button>
        </div>

        {match.videos.length === 0 && (
          <div className="mt-10 border-2 border-dashed border-border rounded-xl p-12 text-center text-muted-foreground">
            <PlayCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No highlights yet. Paste a YouTube or Vimeo link to get started.</p>
          </div>
        )}

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {match.videos.map((v) => {
            const embed = toEmbed(v.url);
            return (
              <div key={v.id} className="border-2 border-primary rounded-xl overflow-hidden bg-card">
                <div className="aspect-video bg-primary/10 flex items-center justify-center">
                  {embed ? (
                    <iframe
                      src={embed}
                      title={v.title || "Match highlight"}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  ) : (
                    <PlayCircle className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <Input
                    placeholder="Title (e.g. Opening goal)"
                    value={v.title}
                    onChange={(e) => edit(v.id, { title: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="YouTube or Vimeo URL"
                      value={v.url}
                      onChange={(e) => edit(v.id, { url: e.target.value })}
                    />
                    <button
                      onClick={() => remove(v.id)}
                      className="px-3 text-muted-foreground hover:text-destructive"
                      aria-label="Remove video"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
