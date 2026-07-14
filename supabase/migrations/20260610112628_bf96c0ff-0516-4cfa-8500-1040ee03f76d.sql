-- Remove possíveis duplicatas antes de criar os constraints
DELETE FROM public.weight_logs a USING public.weight_logs b
WHERE a.id > b.id AND a.user_id = b.user_id AND a.exercise_key = b.exercise_key AND a.logged_at = b.logged_at;

DELETE FROM public.workout_history a USING public.workout_history b
WHERE a.id > b.id AND a.user_id = b.user_id AND a.workout_date = b.workout_date;

-- Unique constraint em weight_logs
ALTER TABLE public.weight_logs
  ADD CONSTRAINT weight_logs_user_exercise_date_key
  UNIQUE (user_id, exercise_key, logged_at);

-- Unique constraint em workout_history (inclui workout_date pois é tabela particionada por workout_date)
ALTER TABLE public.workout_history
  ADD CONSTRAINT workout_history_user_date_key
  UNIQUE (user_id, workout_date);