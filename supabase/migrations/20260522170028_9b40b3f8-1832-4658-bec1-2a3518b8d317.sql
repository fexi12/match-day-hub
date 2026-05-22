REVOKE EXECUTE ON FUNCTION public.claim_lineup_slot(uuid, text, int) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_lineup_slot(uuid, text, int) TO authenticated;