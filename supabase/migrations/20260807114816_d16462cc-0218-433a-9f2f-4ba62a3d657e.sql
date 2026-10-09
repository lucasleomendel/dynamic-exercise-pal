CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_email text,
  actor_role text,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  entity_label text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Actors can insert their own audit entries"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() AND (public.is_personal_trainer(auth.uid()) OR public.is_master_admin(auth.uid())));

CREATE POLICY "Admins see all audit entries, personals see their own"
  ON public.audit_log FOR SELECT TO authenticated
  USING (public.is_master_admin(auth.uid()) OR actor_id = auth.uid());

CREATE INDEX idx_audit_log_created_at ON public.audit_log (created_at DESC);
CREATE INDEX idx_audit_log_entity ON public.audit_log (entity, created_at DESC);

-- Master admin full access to students
CREATE POLICY "Master admin can view all students"
  ON public.students FOR SELECT TO authenticated
  USING (public.is_master_admin(auth.uid()));

CREATE POLICY "Master admin can update all students"
  ON public.students FOR UPDATE TO authenticated
  USING (public.is_master_admin(auth.uid()))
  WITH CHECK (public.is_master_admin(auth.uid()));

CREATE POLICY "Master admin can delete students"
  ON public.students FOR DELETE TO authenticated
  USING (public.is_master_admin(auth.uid()));

-- Master admin full access to personal/student links
CREATE POLICY "Master admin can view all links"
  ON public.personal_student_links FOR SELECT TO authenticated
  USING (public.is_master_admin(auth.uid()));

CREATE POLICY "Master admin can delete any link"
  ON public.personal_student_links FOR DELETE TO authenticated
  USING (public.is_master_admin(auth.uid()));