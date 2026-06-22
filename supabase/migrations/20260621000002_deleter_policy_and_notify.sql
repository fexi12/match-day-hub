-- Update DELETE policy on matches: allow admin OR deleter
DROP POLICY IF EXISTS "Admins delete matches" ON public.matches;

CREATE POLICY "Admin or deleter can delete matches"
  ON public.matches FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'deleter')
  );

-- Enable pg_net for outbound HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Trigger function: calls the notify-new-user edge function on every signup
CREATE OR REPLACE FUNCTION public.notify_on_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM net.http_post(
    url    := 'https://eastmqvhaydhpcssgjuo.supabase.co/functions/v1/notify-new-user',
    body   := jsonb_build_object(
                'email',      NEW.email,
                'user_id',    NEW.id::text,
                'created_at', NEW.created_at::text
              ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block signup if the notification fails
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_notify ON auth.users;
CREATE TRIGGER on_auth_user_created_notify
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_user();
