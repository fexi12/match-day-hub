# Claim a position with your Google profile

## Goal
On any match, a signed-in user clicks an empty position on the pitch and sees a "Place me here" button. Clicking it drops their Google display name + profile photo into that slot. Their email is stored on the slot so the photo follows them across devices and matches (via the existing `player_avatars` lookup).

## Behaviour

- Hover/click an **empty** slot → small popover appears with: avatar preview (Google photo + name) and a **"Place me here"** button.
- Click the button → slot is filled with `{ name, email, photo_url }` from the Google session. Pitch marker immediately shows the Google photo.
- Slot already filled → no claim UI; existing edit controls (only for admins/moderators) unchanged.
- Not signed in → popover shows a "Sign in with Google to claim" prompt that calls the existing `signInWithGoogle()`.
- The same user can move themselves: clicking another empty slot clears their previous slot and fills the new one (only within the same match, both teams scanned).

## Permissions / RLS

Today `matches` UPDATE is restricted to admin/moderator. We need any signed-in user to write to `home_players` / `away_players` for the claim action only. Approach: a SECURITY DEFINER RPC `claim_lineup_slot(match_id, team, slot_index)` that:
- requires `auth.uid()` and `auth.jwt() ->> 'email'` to be present;
- loads the match, ensures the target slot is empty;
- removes the caller from any slot they currently occupy (match by email);
- writes `{ name, email, photo_url }` into the target slot using the values from `auth.jwt()` (name from `user_metadata.full_name`, picture from `user_metadata.avatar_url`/`picture`);
- updates `updated_at`.

Frontend calls this via `supabase.rpc('claim_lineup_slot', ...)`. Existing admin/moderator edit policies stay untouched.

## Files to change

- `supabase/migrations/<new>.sql` — add `claim_lineup_slot` SECURITY DEFINER function.
- `src/components/Lineup.tsx` — render a Popover on empty pitch markers with the "Place me here" CTA; wire RPC call; show toast on success/error; also a small "Claim my spot" hint above the pitch when signed in.
- (No changes to `auth.tsx`; the existing avatar upsert already records the Google photo by email so other clients render it without extra fetches.)

## Non-goals
- No removal/unclaim UI in this pass (admins can still clear slots via the existing roster editor).
- Roster-list editing rules unchanged.
