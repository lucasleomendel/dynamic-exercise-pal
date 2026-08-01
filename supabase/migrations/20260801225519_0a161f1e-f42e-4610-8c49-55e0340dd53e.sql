SELECT cron.unschedule('refresh-exercise-library');

SELECT cron.schedule(
  'refresh-exercise-library',
  '0 4 */5 * *',
  $$
  SELECT net.http_post(
    url := 'https://lepswwvnbbyilijjldga.supabase.co/functions/v1/job-runner',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'job_runner_secret' LIMIT 1)
    ),
    body := jsonb_build_object(
      'job_name', 'refresh-exercise-library',
      'target', 'refresh-library',
      'max_attempts', 2,
      'timeout_ms', 140000,
      'payload', jsonb_build_object('batch', 3)
    )
  );
  $$
);

CREATE OR REPLACE FUNCTION public.daily_health_check()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_orphans INTEGER := 0;
  v_old_history INTEGER := 0;
  v_invalid_weights INTEGER := 0;
  v_old_sync INTEGER := 0;
  v_stale_jobs INTEGER := 0;
BEGIN
  DELETE FROM public.workout_history WHERE workout_date < now() - INTERVAL '90 days';
  GET DIAGNOSTICS v_old_history = ROW_COUNT;

  DELETE FROM public.weight_logs WHERE weight <= 0;
  GET DIAGNOSTICS v_invalid_weights = ROW_COUNT;

  DELETE FROM public.sync_log WHERE created_at < now() - INTERVAL '30 days';
  GET DIAGNOSTICS v_old_sync = ROW_COUNT;

  INSERT INTO public.profiles (user_id, email)
  SELECT u.id, u.email FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE p.id IS NULL
  ON CONFLICT (user_id) DO NOTHING;
  GET DIAGNOSTICS v_orphans = ROW_COUNT;

  v_stale_jobs := public.close_stale_job_runs();

  RETURN jsonb_build_object(
    'ran_at', now(),
    'profiles_created', v_orphans,
    'old_history_purged', v_old_history,
    'invalid_weights_removed', v_invalid_weights,
    'old_sync_purged', v_old_sync,
    'stale_jobs_closed', v_stale_jobs
  );
END; $function$;

REVOKE EXECUTE ON FUNCTION public.daily_health_check() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.daily_health_check() TO service_role;

SELECT public.close_stale_job_runs();