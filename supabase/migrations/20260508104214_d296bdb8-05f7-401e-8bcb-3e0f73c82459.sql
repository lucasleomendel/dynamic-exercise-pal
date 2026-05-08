-- Tabela de runs (histórico de jobs em segundo plano)
CREATE TABLE IF NOT EXISTS public.job_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success','failed','timeout','retrying')),
  attempt INTEGER NOT NULL DEFAULT 1,
  duration_ms INTEGER,
  error_message TEXT,
  payload JSONB,
  alert_raised BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_job_runs_name_started ON public.job_runs (job_name, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_runs_status ON public.job_runs (status) WHERE status <> 'success';

ALTER TABLE public.job_runs ENABLE ROW LEVEL SECURITY;

-- Apenas Master Admin (Personal) pode visualizar
CREATE POLICY "Admin can view job runs"
ON public.job_runs FOR SELECT
USING (public.is_personal_trainer(auth.uid()));

-- Apenas service role escreve (edge function); nada de INSERT/UPDATE público
CREATE POLICY "Admin can update alert status"
ON public.job_runs FOR UPDATE
USING (public.is_personal_trainer(auth.uid()))
WITH CHECK (public.is_personal_trainer(auth.uid()));

-- View resumo: últimas falhas pendentes de alerta
CREATE OR REPLACE VIEW public.job_alerts AS
  SELECT id, job_name, status, attempt, error_message, started_at, finished_at
  FROM public.job_runs
  WHERE alert_raised = true
  ORDER BY started_at DESC;