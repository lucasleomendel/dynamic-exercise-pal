CREATE UNIQUE INDEX IF NOT EXISTS uq_body_compositions_user_measured_at
ON public.body_compositions (user_id, measured_at);