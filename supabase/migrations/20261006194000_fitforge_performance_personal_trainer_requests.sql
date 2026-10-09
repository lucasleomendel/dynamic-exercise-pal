-- Performance hardening for personal trainer requests.
CREATE INDEX IF NOT EXISTS idx_personal_trainer_requests_reviewed_by
  ON public.personal_trainer_requests (reviewed_by);

DROP POLICY IF EXISTS "Master admins can view personal trainer requests"
  ON public.personal_trainer_requests;

DROP POLICY IF EXISTS "Users can view own personal trainer request"
  ON public.personal_trainer_requests;

CREATE POLICY "Users and master admins can view personal trainer requests"
  ON public.personal_trainer_requests
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT is_master_admin((SELECT auth.uid())))
  );