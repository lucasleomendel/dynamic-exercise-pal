CREATE POLICY "Master admin can create any link"
ON public.personal_student_links FOR INSERT TO authenticated
WITH CHECK (public.is_master_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.list_personals()
RETURNS TABLE (id uuid, email text, role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.email::text, (u.raw_app_meta_data->>'role')::text
  FROM auth.users u
  WHERE public.is_master_admin(auth.uid())
    AND (u.raw_app_meta_data->>'role') IN ('personal','master_admin')
  ORDER BY u.email
$$;

REVOKE ALL ON FUNCTION public.list_personals() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.list_personals() TO authenticated;