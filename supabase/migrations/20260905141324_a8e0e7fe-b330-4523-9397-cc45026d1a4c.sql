ALTER TABLE public.workout_plans REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workout_plans;