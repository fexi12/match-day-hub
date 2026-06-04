import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const sourcePath = path.join(root, "src/lib/five-mode.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const tmp = path.join(os.tmpdir(), `five-mode-${Date.now()}.mjs`);
fs.writeFileSync(tmp, transpiled);
const mod = await import(`file://${tmp}`);

const players = Array.from({ length: 14 }, (_, index) => ({ name: `Player ${index + 1}` }));

const teams = mod.buildFiveTeams(players, 3);
assert.equal(teams.length, 3, "user can choose 3 teams even when there are more than 10 people");
assert.deepEqual(
  teams.map((team) => team.players.length),
  [5, 5, 4],
  "all people are distributed across the chosen teams instead of forcing extra teams",
);

const matches = mod.buildMiniMatches(players, 3, 3);
assert.equal(matches.length, 3, "chosen 3 teams create a round-robin of 3 matches");
assert.deepEqual(
  matches.map((match) => `${match.home.name} vs ${match.away.name}`),
  ["Team 1 vs Team 2", "Team 1 vs Team 3", "Team 2 vs Team 3"],
);

let updated = mod.updatePlayerGoal(matches, matches[0].id, "home", "Player 1", 2);
updated = mod.updatePlayerGoal(updated, matches[0].id, "away", "Player 6", 1);
updated = mod.updatePlayerGoal(updated, matches[1].id, "away", "Player 11", 3);

updated = mod.updatePlayerAssist(updated, matches[0].id, "home", "Player 2", 1);
updated = mod.updatePlayerAssist(updated, matches[0].id, "away", "Player 7", 2);

const first = updated[0];
assert.equal(first.home.score, 2, "home score is derived from player goals");
assert.equal(first.away.score, 1, "away score is derived from player goals");
assert.equal(first.home.goals[0].playerName, "Player 1", "goal belongs to a player");
assert.equal(first.home.assists[0].playerName, "Player 2", "assist belongs to a player");
assert.equal(first.away.assists[0].assists, 2, "assists can be recorded per player");
assert.equal(first.home.score, 2, "assists do not change the match score");

const standings = mod.standingsFor(updated);
const p11 = standings.find((row) => row.name === "Player 11");
const p1 = standings.find((row) => row.name === "Player 1");
const p2 = standings.find((row) => row.name === "Player 2");
assert.equal(p11?.goals, 3, "leaderboard tracks goals by player");
assert.equal(p1?.goals, 2, "player goals are not copied to every team mate");
assert.equal(p2?.assists, 1, "leaderboard tracks assists by player");

console.log("five-mode logic ok");
