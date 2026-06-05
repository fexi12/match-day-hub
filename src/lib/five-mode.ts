export const FIVE_MODE_LABEL = "__5X5X5_MODE__";
export const TEAM_SIZE = 5;
export const DEFAULT_TEAM_COUNT = 3;
export const DEFAULT_MATCH_COUNT = 3;

export type FivePlayer = {
  name: string;
  photo_url?: string;
  email?: string;
};

export type PlayerGoal = {
  playerName: string;
  goals: number;
};

export type PlayerAssist = {
  playerName: string;
  assists: number;
};

export type FiveTeam = {
  name: string;
  players: FivePlayer[];
};

export type FiveSide = FiveTeam & {
  score: number;
  goals: PlayerGoal[];
  assists: PlayerAssist[];
};

export type FiveMiniMatch = {
  id: number;
  round: number;
  home: FiveSide;
  away: FiveSide;
};

export type FiveModeState = {
  enabled: boolean;
  targetMatches: number;
  teamCount: number;
  matches: FiveMiniMatch[];
};

export type PlayerStanding = {
  name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals: number;
  assists: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

export const emptyFiveModeState = (): FiveModeState => ({
  enabled: false,
  targetMatches: DEFAULT_MATCH_COUNT,
  teamCount: DEFAULT_TEAM_COUNT,
  matches: [],
});

export const normalizeScore = (value: number) =>
  Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;

export const playerKey = (player: FivePlayer) =>
  (player.email?.trim().toLowerCase() || player.name.trim().toLowerCase()).replace(/\s+/g, " ");

export const uniquePlayers = (players: FivePlayer[]): FivePlayer[] => {
  const seen = new Set<string>();
  return players
    .map((p) => ({ ...p, name: p.name.trim() }))
    .filter((p) => {
      if (!p.name) return false;
      const key = playerKey(p);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

export const playersFromNames = (value: string): FivePlayer[] =>
  uniquePlayers(
    value
      .split(/[\n,]+/)
      .map((name) => ({ name }))
      .filter((player) => player.name.trim()),
  );

export const maxTeamsFor = (players: FivePlayer[]) => uniquePlayers(players).length;

export const normalizeTeamCount = (players: FivePlayer[], requested: number) => {
  const pool = uniquePlayers(players);
  const maxTeams = pool.length;
  if (pool.length < TEAM_SIZE * 2 || maxTeams < 2) return 0;
  return Math.min(maxTeams, Math.max(2, normalizeScore(requested || DEFAULT_TEAM_COUNT)));
};

export const buildFiveTeams = (players: FivePlayer[], requestedTeamCount: number): FiveTeam[] => {
  const pool = uniquePlayers(players);
  const teamCount = normalizeTeamCount(pool, requestedTeamCount);
  if (teamCount < 2) return [];

  const baseSize = Math.floor(pool.length / teamCount);
  const extraPlayers = pool.length % teamCount;
  let cursor = 0;

  return Array.from({ length: teamCount }).map((_, index) => {
    const size = baseSize + (index < extraPlayers ? 1 : 0);
    const playersForTeam = pool.slice(cursor, cursor + size);
    cursor += size;

    return {
      name: `Team ${index + 1}`,
      players: playersForTeam,
    };
  });
};

export const buildFiveTeamsFromLineup = (players: FivePlayer[]): FiveTeam[] => {
  const pool = players
    .map((player) => ({ ...player, name: player.name.trim() }))
    .filter((player) => player.name);
  const teams: FiveTeam[] = [];

  for (let cursor = 0; cursor < pool.length; cursor += TEAM_SIZE) {
    const playersForTeam = pool.slice(cursor, cursor + TEAM_SIZE);
    if (playersForTeam.length === 0) continue;
    teams.push({
      name: `Team ${teams.length + 1}`,
      players: playersForTeam,
    });
  }

  return teams;
};

const sideFromTeam = (team: FiveTeam): FiveSide => ({
  ...team,
  score: 0,
  goals: [],
  assists: [],
});

const pairTeams = (teams: FiveTeam[]) => {
  const pairs: Array<[FiveTeam, FiveTeam]> = [];
  for (let home = 0; home < teams.length; home += 1) {
    for (let away = home + 1; away < teams.length; away += 1) {
      pairs.push([teams[home], teams[away]]);
    }
  }
  return pairs;
};

export const buildMiniMatchesFromTeams = (
  teams: FiveTeam[],
  targetMatches?: number,
): FiveMiniMatch[] => {
  if (teams.length < 2) return [];

  const pairs = pairTeams(teams);
  const count = Math.max(1, normalizeScore(targetMatches ?? pairs.length));
  return Array.from({ length: count }).map((_, index) => {
    const [home, away] = pairs[index % pairs.length];
    return {
      id: Date.now() + index,
      round: index + 1,
      home: sideFromTeam(home),
      away: sideFromTeam(away),
    };
  });
};

export const buildMiniMatches = (
  players: FivePlayer[],
  requestedTeamCount: number,
  targetMatches?: number,
): FiveMiniMatch[] =>
  buildMiniMatchesFromTeams(buildFiveTeams(players, requestedTeamCount), targetMatches);

export const sideScore = (side: FiveSide) => {
  if (Array.isArray(side.goals) && side.goals.length > 0) {
    return side.goals.reduce((sum, row) => sum + normalizeScore(row.goals), 0);
  }
  return normalizeScore(side.score);
};

export const updatePlayerGoal = (
  matches: FiveMiniMatch[],
  matchId: number,
  side: "home" | "away",
  playerName: string,
  goals: number,
): FiveMiniMatch[] =>
  matches.map((match) => {
    if (match.id !== matchId) return match;

    const cleanGoals = normalizeScore(goals);
    const currentSide = match[side];
    const withoutPlayer = (currentSide.goals ?? []).filter((row) => row.playerName !== playerName);
    const nextGoals =
      cleanGoals > 0 ? [...withoutPlayer, { playerName, goals: cleanGoals }] : withoutPlayer;
    const nextSide = {
      ...currentSide,
      goals: nextGoals,
      score: nextGoals.reduce((sum, row) => sum + row.goals, 0),
    };

    return { ...match, [side]: nextSide };
  });

export const updatePlayerAssist = (
  matches: FiveMiniMatch[],
  matchId: number,
  side: "home" | "away",
  playerName: string,
  assists: number,
): FiveMiniMatch[] =>
  matches.map((match) => {
    if (match.id !== matchId) return match;

    const cleanAssists = normalizeScore(assists);
    const currentSide = match[side];
    const withoutPlayer = (currentSide.assists ?? []).filter(
      (row) => row.playerName !== playerName,
    );
    const nextAssists =
      cleanAssists > 0 ? [...withoutPlayer, { playerName, assists: cleanAssists }] : withoutPlayer;

    return { ...match, [side]: { ...currentSide, assists: nextAssists } };
  });

const goalsForPlayer = (side: FiveSide, player: FivePlayer) =>
  (side.goals ?? []).find((row) => row.playerName === player.name)?.goals ?? 0;

const assistsForPlayer = (side: FiveSide, player: FivePlayer) =>
  (side.assists ?? []).find((row) => row.playerName === player.name)?.assists ?? 0;

export const standingsFor = (matches: FiveMiniMatch[]): PlayerStanding[] => {
  const table = new Map<string, PlayerStanding>();

  const ensure = (player: FivePlayer) => {
    const key = playerKey(player);
    if (!table.has(key)) {
      table.set(key, {
        name: player.name,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals: 0,
        assists: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      });
    }
    return table.get(key)!;
  };

  matches.forEach((match) => {
    const homeScore = sideScore(match.home);
    const awayScore = sideScore(match.away);
    const homeWon = homeScore > awayScore;
    const awayWon = awayScore > homeScore;

    match.home.players.forEach((player) => {
      const row = ensure(player);
      row.played += 1;
      row.goals += goalsForPlayer(match.home, player);
      row.assists += assistsForPlayer(match.home, player);
      row.goalsFor += homeScore;
      row.goalsAgainst += awayScore;
      if (homeWon) {
        row.wins += 1;
        row.points += 3;
      } else if (awayWon) {
        row.losses += 1;
      } else {
        row.draws += 1;
        row.points += 1;
      }
    });

    match.away.players.forEach((player) => {
      const row = ensure(player);
      row.played += 1;
      row.goals += goalsForPlayer(match.away, player);
      row.assists += assistsForPlayer(match.away, player);
      row.goalsFor += awayScore;
      row.goalsAgainst += homeScore;
      if (awayWon) {
        row.wins += 1;
        row.points += 3;
      } else if (homeWon) {
        row.losses += 1;
      } else {
        row.draws += 1;
        row.points += 1;
      }
    });
  });

  return [...table.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.goals - a.goals ||
      b.assists - a.assists ||
      b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst) ||
      a.name.localeCompare(b.name),
  );
};
