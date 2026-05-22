
CREATE OR REPLACE FUNCTION public.claim_lineup_slot(
  _match_id uuid,
  _team text,
  _slot_index int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _jwt jsonb := auth.jwt();
  _email text;
  _name text;
  _photo text;
  _meta jsonb;
  _col text;
  _other_col text;
  _arr jsonb;
  _other_arr jsonb;
  _i int;
  _slot jsonb;
  _new_slot jsonb;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _team NOT IN ('home','away') THEN
    RAISE EXCEPTION 'Invalid team';
  END IF;
  IF _slot_index < 0 OR _slot_index > 31 THEN
    RAISE EXCEPTION 'Invalid slot';
  END IF;

  _email := lower(coalesce(_jwt ->> 'email', ''));
  IF _email = '' THEN
    RAISE EXCEPTION 'No email on session';
  END IF;

  _meta := coalesce(_jwt -> 'user_metadata', '{}'::jsonb);
  _name := coalesce(
    _meta ->> 'full_name',
    _meta ->> 'name',
    split_part(_email, '@', 1)
  );
  _photo := coalesce(_meta ->> 'avatar_url', _meta ->> 'picture');

  _col := CASE WHEN _team = 'home' THEN 'home_players' ELSE 'away_players' END;
  _other_col := CASE WHEN _team = 'home' THEN 'away_players' ELSE 'home_players' END;

  EXECUTE format(
    'SELECT %I, %I FROM public.matches WHERE id = $1 FOR UPDATE',
    _col, _other_col
  ) INTO _arr, _other_arr USING _match_id;

  IF _arr IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  -- Pad the target array up to _slot_index (inclusive) with empty slots
  WHILE jsonb_array_length(_arr) <= _slot_index LOOP
    _arr := _arr || jsonb_build_array(jsonb_build_object('name', ''));
  END LOOP;

  _slot := _arr -> _slot_index;
  IF coalesce(_slot ->> 'name', '') <> '' OR coalesce(_slot ->> 'email', '') <> '' THEN
    RAISE EXCEPTION 'Slot already taken';
  END IF;

  -- Clear caller from any existing slot on either team (match by email)
  FOR _i IN 0 .. jsonb_array_length(_arr) - 1 LOOP
    IF lower(coalesce(_arr -> _i ->> 'email', '')) = _email THEN
      _arr := jsonb_set(_arr, ARRAY[_i::text], jsonb_build_object('name', ''));
    END IF;
  END LOOP;
  IF _other_arr IS NOT NULL THEN
    FOR _i IN 0 .. jsonb_array_length(_other_arr) - 1 LOOP
      IF lower(coalesce(_other_arr -> _i ->> 'email', '')) = _email THEN
        _other_arr := jsonb_set(_other_arr, ARRAY[_i::text], jsonb_build_object('name', ''));
      END IF;
    END LOOP;
  END IF;

  _new_slot := jsonb_build_object('name', _name, 'email', _email);
  IF _photo IS NOT NULL AND _photo <> '' THEN
    _new_slot := _new_slot || jsonb_build_object('photo_url', _photo);
  END IF;

  _arr := jsonb_set(_arr, ARRAY[_slot_index::text], _new_slot);

  EXECUTE format(
    'UPDATE public.matches SET %I = $1, %I = $2, updated_at = now() WHERE id = $3',
    _col, _other_col
  ) USING _arr, coalesce(_other_arr, '[]'::jsonb), _match_id;

  IF _photo IS NOT NULL AND _photo <> '' THEN
    INSERT INTO public.player_avatars(email, avatar_url, updated_at)
    VALUES (_email, _photo, now())
    ON CONFLICT (email) DO UPDATE SET avatar_url = EXCLUDED.avatar_url, updated_at = now();
  END IF;
END;
$$;
