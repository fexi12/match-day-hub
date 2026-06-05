import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const index = fs.readFileSync(path.join(root, "src/routes/index.tsx"), "utf8");
const matchesDialog = fs.readFileSync(path.join(root, "src/components/MatchesDialog.tsx"), "utf8");

assert.match(index, /const navBtn =/, "home page exposes a shared nav button class");
assert.match(
  index,
  /const navBtnPrimary =/,
  "header primary actions should use the same shared button shape",
);
assert.match(
  index,
  /<button[\s\S]*?onClick=\{handleNewGame\}[\s\S]*?disabled=\{saving\}[\s\S]*?className=\{navBtnDisabled\}/s,
  "desktop NEW GAME header button uses shared nav button styling",
);
assert.match(
  index,
  /<button[^>]*onClick=\{signOut\}[^>]*className=\{navBtn\}/s,
  "desktop SIGN OUT header button uses shared nav button styling",
);
assert.match(
  index,
  /<Link to="\/login" className=\{navBtnPrimary\}>/s,
  "desktop SIGN IN header link uses shared nav button styling",
);

assert.match(
  matchesDialog,
  /<DialogTrigger asChild>\s*<button/s,
  "MATCHES trigger is a plain button so it can exactly match anchor CTAs",
);
assert.doesNotMatch(
  matchesDialog,
  /DialogTrigger asChild>[\s\S]*?<Button[\s\S]*?>\s*MATCHES\s*<\/Button>/,
  "MATCHES trigger should not inherit shadcn Button height/outline styles",
);

console.log("nav style ok");
