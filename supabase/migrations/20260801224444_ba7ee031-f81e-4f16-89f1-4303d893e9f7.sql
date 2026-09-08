REVOKE EXECUTE ON FUNCTION public.close_stale_job_runs() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.daily_health_check() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_job_runner_secret() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_workout_history_partition(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.close_stale_job_runs() TO service_role;
GRANT EXECUTE ON FUNCTION public.daily_health_check() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_job_runner_secret() TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_workout_history_partition(integer) TO service_role;