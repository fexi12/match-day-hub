-- Tighten matches RLS: only admin or moderator (approved editor) can write
DROP POLICY IF EXISTS "Authenticated insert matches" ON public.matches;
DROP POLICY IF EXISTS "Authenticated update matches" ON public.matches;

CREATE POLICY "Approved can insert matches"
  ON public.matches FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Approved can update matches"
  ON public.matches FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));