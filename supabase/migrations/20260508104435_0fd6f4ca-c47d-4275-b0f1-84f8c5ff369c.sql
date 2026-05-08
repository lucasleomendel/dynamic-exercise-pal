CREATE OR REPLACE FUNCTION public.get_job_runner_secret()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, vault
AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'job_runner_secret' LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.get_job_runner_secret() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_job_runner_secret() TO service_role;