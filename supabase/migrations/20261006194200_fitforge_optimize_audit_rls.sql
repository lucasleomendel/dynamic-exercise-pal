ALTER POLICY "Users can insert own audit events"
ON public.audit_log
WITH CHECK (
  (actor_id = (SELECT auth.uid()))
  AND (((SELECT auth.jwt()) -> 'app_metadata'::text) ->> 'role'::text)
      = ANY (ARRAY['personal'::text, 'master_admin'::text])
);