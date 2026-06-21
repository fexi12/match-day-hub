-- Let every authenticated user edit by default, while preserving admin revocation.
-- The existing app_role value 'user' is now used as an explicit revoked/viewer marker.

DROP POLICY IF EXISTS "Approved can insert matches" ON public.matches;
DROP POLICY IF EXISTS "Approved can update matches" ON public.matches;
DROP POLICY IF EXISTS "Authenticated insert matches" ON public.matches;
DROP POLICY IF EXISTS "Authenticated update matches" ON public.matches;

CREATE POLICY "Non-revoked users can insert matches"
  ON public.matches FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR NOT public.has_role(auth.uid(), 'user')
  );

CREATE POLICY "Non-revoked users can update matches"
  ON public.matches FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR NOT public.has_role(auth.uid(), 'user')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR NOT public.has_role(auth.uid(), 'user')
  );
