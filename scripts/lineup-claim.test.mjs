import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const sourcePath = path.join(root, "src/lib/lineup-claim.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const tmp = path.join(os.tmpdir(), `lineup-claim-${Date.now()}.mjs`);
fs.writeFileSync(tmp, transpiled);
const mod = await import(`file://${tmp}`);

assert.equal(
  mod.canUserPlaceSelfInSlot({ name: "" }, "fexi@example.com"),
  true,
  "signed-in Google users can claim empty slots",
);
assert.equal(
  mod.canUserPlaceSelfInSlot({ name: "Manual Player" }, "fexi@example.com"),
  true,
  "signed-in Google users can replace a manual name-only slot with their own account",
);
assert.equal(
  mod.canUserPlaceSelfInSlot({ name: "Other", email: "other@example.com" }, "fexi@example.com"),
  false,
  "signed-in users cannot replace another Google-account claimed slot",
);
assert.equal(
  mod.placeSelfButtonLabel({ name: "Manual Player" }, "fexi@example.com"),
  "Place me here",
  "name-only slots still show Place me here",
);
assert.equal(
  mod.placeSelfButtonLabel({ name: "Other", email: "other@example.com" }, "fexi@example.com"),
  "Position taken",
  "other account slots do not show a misleading Place me here action",
);

console.log("lineup claim logic ok");
