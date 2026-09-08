-- 1) Agenda a geração de imagens dos exercícios (fila persistente já existe na tabela)
SELECT cron.unschedule('generate-exercise-images') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-exercise-images');

SELECT cron.schedule(
  'generate-exercise-images',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://lepswwvnbbyilijjldga.supabase.co/functions/v1/job-runner',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'job_runner_secret' LIMIT 1)
    ),
    body := jsonb_build_object(
      'job_name', 'generate-exercise-images',
      'target', 'generate-exercise-images',
      'max_attempts', 1,
      'timeout_ms', 120000,
      'payload', jsonb_build_object('limit', 5)
    )
  );
  $$
);

-- 2) Marca execuções travadas (sem finished_at há mais de 1h) como falhas, para não ficarem em "retrying" para sempre
CREATE OR REPLACE FUNCTION public.close_stale_job_runs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_count integer;
BEGIN
  UPDATE public.job_runs
     SET status = 'failed',
         finished_at = now(),
         error_message = COALESCE(error_message, '') || ' | encerrado automaticamente (execução travada)',
         alert_raised = true
   WHERE finished_at IS NULL
     AND status IN ('retrying', 'running', 'timeout')
     AND started_at < now() - interval '1 hour';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

SELECT public.close_stale_job_runs();