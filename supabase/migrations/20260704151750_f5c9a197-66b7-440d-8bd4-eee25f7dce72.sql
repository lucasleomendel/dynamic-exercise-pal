
-- 1) Adiciona colunas para mídia dos exercícios (imagem e vídeo)
ALTER TABLE public.exercise_library
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS steps text[];

-- 2) Concede grants no Data API para TODAS as tabelas públicas.
-- Sem isso o PostgREST retorna "permission denied" mesmo com RLS liberado.

-- Tabelas de leitura pública (têm policy USING (true) para SELECT)
GRANT SELECT ON public.exercise_library TO anon, authenticated;
GRANT SELECT ON public.training_methods TO anon, authenticated;
GRANT SELECT ON public.library_updates  TO anon, authenticated;

-- Tabelas escopadas por auth.uid() — apenas authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.body_compositions   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diet_plans          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_checks     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.progression_log     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sync_log            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.water_logs          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weight_logs         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_plans       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_history           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_history_2026      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_history_2027      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_history_default   TO authenticated;

-- Tabelas de personal trainer
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students                TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.personal_student_links  TO authenticated;

-- Tabelas restritas a master admin (o service_role + policy fazem o gating)
GRANT SELECT, UPDATE ON public.job_runs TO authenticated;

-- service_role: full access em tudo (necessário para edge functions/admin)
GRANT ALL ON public.exercise_library, public.training_methods, public.library_updates,
             public.profiles, public.body_compositions, public.diet_plans,
             public.exercise_checks, public.progression_log, public.sync_log,
             public.water_logs, public.weight_logs, public.workout_plans,
             public.workout_history, public.workout_history_2026,
             public.workout_history_2027, public.workout_history_default,
             public.students, public.personal_student_links, public.job_runs
  TO service_role;
