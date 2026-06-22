import {
  normalizePlayers,
  playerIdentity,
  type Goal,
  type Player,
  type Stat,
} from "@/lib/match-store";
import { FIVE_MODE_LABEL, type FiveModeState, type FiveSide } from "@/lib/five-mode";

export type SeasonMatchRow = {
  id: string;
  name: string;
  match_date: string | null;
  format: string | null;
  home_players: unknown;
  away_players: unknown;
  goals: unknown;
  stats: unknown;
  attendees: unknown;
};

export type PlayerSeasonStats = {
  key: string;
  name: string;
  appearances: number;
  attendances: number;
  goals: number;
  assists: number;
  matches: Set<string> | undefined;
};

export const normalizeNameKey = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

export const playerKeyFrom = (player: Pick<Player, "id" | "email" | "name">) =>
  playerIdentity(player) || normalizeNameKey(player.name || player.email || "");

const getOrCreate = (
  table: Map<string, PlayerSeasonStats>,
  key: string,
  name: string,
): PlayerSeasonStats => {
  const cleanKey = key || normalizeNameKey(name);
  if (!table.has(cleanKey)) {
    table.set(cleanKey, {
      key: cleanKey,
      name: name || "Unknown player",
      appearances: 0,
      attendances: 0,
      goals: 0,
      assists: 0,
      matches: new Set<string>(),
    });
  }
  const row = table.get(cleanKey)!;
  if ((!row.name || row.name === "Unknown player") && name) row.name = name;
  return row;
};

const addAppearance = (table: Map<string, PlayerSeasonStats>, matchId: string, player: Player) => {
  if (!player.name && !player.email) return;
  const row = getOrCreate(
    table,
    playerKeyFrom(player),
    player.name || player.email || "Unknown player",
  );
  if (!row.matches!.has(matchId)) {
    row.matches!.add(matchId);
    row.appearances += 1;
  }
};

const addAttendance = (table: Map<string, PlayerSeasonStats>, player: Player) => {
  if (!player.name && !player.email) return;
  const row = getOrCreate(
    table,
    playerKeyFrom(player),
    player.name || player.email || "Unknown player",
  );
  row.attendances += 1;
};

const addGoals = (
  table: Map<string, PlayerSeasonStats>,
  key: string | undefined,
  name: string | undefined,
  goals: number,
) => {
  if (!goals || goals <= 0 || (!key && !name)) return;
  getOrCreate(table, key || "", name || "Unknown player").goals += goals;
};

const addAssists = (
  table: Map<string, PlayerSeasonStats>,
  key: string | undefined,
  name: string | undefined,
  assists: number,
) => {
  if (!assists || assists <= 0 || (!key && !name)) return;
  getOrCreate(table, key || "", name || "Unknown player").assists += assists;
};

const applyStandardMatch = (table: Map<string, PlayerSeasonStats>, match: SeasonMatchRow) => {
  const homePlayers = normalizePlayers(match.home_players);
  const awayPlayers = normalizePlayers(match.away_players);
  [...homePlayers, ...awayPlayers].forEach((player) => addAppearance(table, match.id, player));

  normalizePlayers(match.attendees).forEach((player) => addAttendance(table, player));

  const goals = Array.isArray(match.goals) ? (match.goals as Goal[]) : [];
  goals.forEach((goal) => {
    if (!goal.own_goal) {
      addGoals(table, goal.scorer_id, goal.scorer, 1);
      addAssists(table, goal.assist_id, goal.assist, goal.assist || goal.assist_id ? 1 : 0);
    }
  });
};

const applyFiveSide = (table: Map<string, PlayerSeasonStats>, matchId: string, side: FiveSide) => {
  side.players?.forEach((player) => addAppearance(table, matchId, player));
  side.goals?.forEach((row) => {
    if (!row.ownGoal) addGoals(table, row.playerId, row.playerName, row.goals);
  });
  side.assists?.forEach((row) => addAssists(table, row.playerId, row.playerName, row.assists));
};

const applyFiveModeMatch = (table: Map<string, PlayerSeasonStats>, match: SeasonMatchRow) => {
  const stats = Array.isArray(match.stats)
    ? (match.stats as Array<Stat & { fiveMode?: FiveModeState }>)
    : [];
  const fiveMode = stats.find((row) => row.label === FIVE_MODE_LABEL)?.fiveMode;
  if (!fiveMode?.matches?.length) return;

  fiveMode.matches.forEach((miniMatch) => {
    const miniMatchId = `${match.id}:${miniMatch.id}`;
    applyFiveSide(table, miniMatchId, miniMatch.home);
    applyFiveSide(table, miniMatchId, miniMatch.away);
  });
};

export const buildSeasonStats = (matches: SeasonMatchRow[]): PlayerSeasonStats[] => {
  const table = new Map<string, PlayerSeasonStats>();
  matches.forEach((match) => {
    applyStandardMatch(table, match);
    applyFiveModeMatch(table, match);
  });
  return [...table.values()]
    .map((row) => ({ ...row, matches: undefined }))
    .sort(
      (a, b) =>
        b.goals - a.goals ||
        b.assists - a.assists ||
        b.appearances - a.appearances ||
        a.name.localeCompare(b.name),
    );
};
