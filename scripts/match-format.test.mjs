import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const sourcePath = path.join(root, "src/lib/match-formats.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const tmp = path.join(os.tmpdir(), `match-formats-${Date.now()}.mjs`);
fs.writeFileSync(tmp, transpiled);
const mod = await import(`file://${tmp}`);

assert.ok(
  mod.MATCH_FORMATS.some((format) => format.value === "5x5x5" && format.label === "5x5x5"),
  "format selector includes 5x5x5",
);
assert.equal(mod.lineupSizeForFormat("5x5x5"), 15, "5x5x5 creates a 15-player pool on the field");
assert.equal(mod.lineupSizeForFormat("7v7"), 7, "normal formats keep their numeric lineup size");
assert.equal(mod.isFiveModeFormat("5x5x5"), true, "5x5x5 activates the mini-match generator");
assert.equal(
  mod.isFiveModeFormat("5v5"),
  false,
  "regular 5v5 does not activate the mini-match generator",
);

console.log("match format logic ok");
