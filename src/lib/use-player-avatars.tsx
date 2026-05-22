import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Fetches Google avatars stored in player_avatars for the given emails. */
export function usePlayerAvatars(emails: string[]) {
  const [map, setMap] = useState<Record<string, string>>({});
  const key = emails
    .filter(Boolean)
    .map((e) => e.toLowerCase())
    .sort()
    .join(",");

  useEffect(() => {
    const list = key ? key.split(",") : [];
    if (list.length === 0) {
      setMap({});
      return;
    }
    supabase
      .from("player_avatars")
      .select("email, avatar_url")
      .in("email", list)
      .then(({ data }) => {
        const next: Record<string, string> = {};
        (data ?? []).forEach((r) => {
          next[r.email.toLowerCase()] = r.avatar_url;
        });
        setMap(next);
      });
  }, [key]);

  return map;
}

export function initialsOf(name: string | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Deterministic hue 0-359 derived from a string. */
export function hueOf(seed: string | undefined): number {
  if (!seed) return 210;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % 360;
}
