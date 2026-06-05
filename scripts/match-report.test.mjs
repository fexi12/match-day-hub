import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const sourcePath = path.join(root, "src/lib/match-report.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const tmp = path.join(os.tmpdir(), `match-report-${Date.now()}.mjs`);
fs.writeFileSync(tmp, transpiled);
const mod = await import(`file://${tmp}`);

assert.equal(
  mod.reportModeForFormat("5x5x5"),
  "five-mode",
  "5x5x5 full-time report uses leaderboard and goals graph",
);
assert.equal(
  mod.reportModeForFormat("7v7"),
  "standard",
  "normal match formats keep standard full-time statistics",
);
assert.equal(
  mod.reportModeForFormat("11v11"),
  "standard",
  "11v11 keeps standard full-time statistics",
);

console.log("match report logic ok");
