-- Public lookup of avatar URL by email (populated on Google sign-in)
CREATE TABLE public.player_avatars (
  email text PRIMARY KEY,
  avatar_url text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.player_avatars ENABLE ROW LEVEL SECURITY;

-- Anyone can read (so squad pages render avatars for visitors)
CREATE POLICY "Public read player_avatars"
  ON public.player_avatars FOR SELECT
  TO public USING (true);

-- A logged-in user can only upsert the row matching their own email
CREATE POLICY "Users upsert own avatar (insert)"
  ON public.player_avatars FOR INSERT
  TO authenticated
  WITH CHECK (lower(email) = lower((auth.jwt() ->> 'email')));

CREATE POLICY "Users upsert own avatar (update)"
  ON public.player_avatars FOR UPDATE
  TO authenticated
  USING (lower(email) = lower((auth.jwt() ->> 'email')))
  WITH CHECK (lower(email) = lower((auth.jwt() ->> 'email')));