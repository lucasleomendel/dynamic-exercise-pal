CREATE OR REPLACE FUNCTION public.is_personal_trainer(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = uid
      AND (raw_app_meta_data->>'role' IN ('personal','master_admin'))
  )
$function$;

DROP POLICY IF EXISTS "Personal trainers can update students" ON public.students;
CREATE POLICY "Personal trainers can update students"
ON public.students FOR UPDATE TO authenticated
USING (
  public.is_personal_trainer(auth.uid())
  AND id IN (SELECT student_id FROM public.personal_student_links WHERE personal_id = auth.uid())
)
WITH CHECK (
  public.is_personal_trainer(auth.uid())
  AND id IN (SELECT student_id FROM public.personal_student_links WHERE personal_id = auth.uid())
);