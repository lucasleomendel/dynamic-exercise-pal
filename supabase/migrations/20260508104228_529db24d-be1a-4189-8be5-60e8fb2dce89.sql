DROP VIEW IF EXISTS public.job_alerts;
CREATE VIEW public.job_alerts
WITH (security_invoker = true) AS
  SELECT id, job_name, status, attempt, error_message, started_at, finished_at
  FROM public.job_runs
  WHERE alert_raised = true
  ORDER BY started_at DESC;