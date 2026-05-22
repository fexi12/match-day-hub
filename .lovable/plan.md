# Simplify roster + rely on Google login for photos

## Changes to `src/components/Lineup.tsx` — `PlayerRow`

Remove from each roster row:
- The small avatar circle (photo / initials / "+") on the left
- The Mail "link Google email" button + its `promptEmail` handler
- The Upload custom photo button, the hidden file input, and the `upload` handler
- The X "remove custom photo" button

Keep: the number, the name input (still editable by admins/moderators for naming non-app teammates).

Also drop now-unused imports from that file: `Mail`, `Upload`, `X`, `useRef`, `supabase` (only used by upload), and the `photo`/`resolvePhoto`/`canUpload` plumbing into `PlayerRow` (the prop on `Roster` stays only as far as needed — simplest: drop `photo` and `resolvePhoto` from `Roster` + `PlayerRow` signatures entirely).

## Photo flow (already working, no code needed)

- On Google sign-in (`src/lib/auth.tsx`) we already upsert `{ email, avatar_url }` into `player_avatars`.
- When a signed-in user clicks an empty pitch slot → "Place me here", the `claim_lineup_slot` RPC writes their name + email + Google `photo_url` into the slot and refreshes the avatar lookup.
- The pitch marker resolves the photo via `usePlayerAvatars` (email → avatar_url) so it shows their Google picture automatically.

No backend changes needed. Single-file edit.