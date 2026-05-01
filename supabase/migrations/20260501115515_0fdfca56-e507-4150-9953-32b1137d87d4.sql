ALTER TABLE public.workout_history_2026 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_history_2027 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_history_default ENABLE ROW LEVEL SECURITY;

REVOKE EXECUTE ON FUNCTION public.daily_health_check() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_workout_history_partition(INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;