-- Atomically replace a user's active plan so a failed insert cannot leave
-- the account without an active plan. The advisory lock also serializes races.
CREATE OR REPLACE FUNCTION public.sync_active_workout_plan(
  p_title text,
  p_description text,
  p_days_per_week integer,
  p_plan_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing_plan jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '28000', MESSAGE = 'Authentication required';
  END IF;

  IF p_title IS NULL OR length(trim(p_title)) = 0
     OR p_plan_data IS NULL OR jsonb_typeof(p_plan_data) <> 'object' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Invalid workout plan payload';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  SELECT wp.plan_data
    INTO v_existing_plan
    FROM public.workout_plans AS wp
   WHERE wp.user_id = v_user_id
     AND wp.is_active IS TRUE
   ORDER BY wp.created_at DESC
   LIMIT 1
   FOR UPDATE;

  IF FOUND AND v_existing_plan = p_plan_data THEN
    RETURN;
  END IF;

  -- The update and insert are part of the same function transaction.
  UPDATE public.workout_plans
     SET is_active = false
   WHERE user_id = v_user_id
     AND is_active IS TRUE;

  INSERT INTO public.workout_plans (
    user_id, title, description, days_per_week, plan_data, is_active
  ) VALUES (
    v_user_id, p_title, p_description, p_days_per_week, p_plan_data, true
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.sync_active_workout_plan(text, text, integer, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_active_workout_plan(text, text, integer, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.sync_active_workout_plan(text, text, integer, jsonb) TO authenticated;
