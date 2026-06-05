import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const sql = fs.readFileSync(
  path.join(root, "supabase/migrations/20260605000100_allow_claiming_manual_lineup_slots.sql"),
  "utf8",
);

assert.match(sql, /_slot_email\s+text/i, "migration tracks target slot email");
assert.match(
  sql,
  /_slot_email\s+<>\s+''\s+AND\s+_slot_email\s+<>\s+_email/i,
  "migration blocks stealing another Google-account slot",
);
assert.doesNotMatch(
  sql,
  /coalesce\(_slot ->> 'name', ''\) <> '' OR coalesce\(_slot ->> 'email', ''\) <> ''/,
  "migration no longer blocks manual name-only slots",
);

console.log("lineup claim sql ok");
