
-- Fix privilege escalation: use admin-controlled app_metadata instead of user-writable user_metadata
CREATE OR REPLACE FUNCTION public.is_personal_trainer(uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = uid AND (
      raw_app_meta_data->>'role' = 'personal'
      OR email = 'lucas.mendel@hotmail.com'
    )
  )
$$;

-- Restrict trainers to only their linked students
DROP POLICY IF EXISTS "Personal trainers can view students" ON public.students;
CREATE POLICY "Personal trainers can view students"
ON public.students
FOR SELECT
TO authenticated
USING (
  is_personal_trainer(auth.uid())
  AND id IN (
    SELECT student_id FROM public.personal_student_links
    WHERE personal_id = auth.uid()
  )
);

-- Add missing DELETE policy for water_logs
CREATE POLICY "Users delete own water"
ON public.water_logs
FOR DELETE
USING (auth.uid() = user_id);

-- Add missing UPDATE policy for body_compositions
CREATE POLICY "Users update own bodycomp"
ON public.body_compositions
FOR UPDATE
USING (auth.uid() = user_id);

-- Add RLS policies on workout_history partition tables (mirror parent)
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['workout_history_2026','workout_history_2027','workout_history_default']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Users view own history" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Users view own history" ON public.%I FOR SELECT USING (auth.uid() = user_id)', t);
    EXECUTE format('DROP POLICY IF EXISTS "Users insert own history" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Users insert own history" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)', t);
    EXECUTE format('DROP POLICY IF EXISTS "Users delete own history" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Users delete own history" ON public.%I FOR DELETE USING (auth.uid() = user_id)', t);
  END LOOP;
END $$;
