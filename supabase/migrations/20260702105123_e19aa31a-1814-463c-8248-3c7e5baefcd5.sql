
CREATE OR REPLACE FUNCTION public.is_master_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = uid
      AND (raw_app_meta_data->>'role' = 'master_admin')
  )
$$;

DROP POLICY IF EXISTS "Admin can view job runs" ON public.job_runs;
DROP POLICY IF EXISTS "Admin can update alert status" ON public.job_runs;

CREATE POLICY "Master admin can view job runs"
  ON public.job_runs FOR SELECT
  USING (public.is_master_admin(auth.uid()));

CREATE POLICY "Master admin can update alert status"
  ON public.job_runs FOR UPDATE
  USING (public.is_master_admin(auth.uid()))
  WITH CHECK (public.is_master_admin(auth.uid()));
