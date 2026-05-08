// Job runner: invoca uma edge function alvo com retry exponencial,
// timeout configurável e log de cada tentativa em public.job_runs.
// Acionado via pg_cron usando a service-role key.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

let cachedSecret: string | null = null;
async function getRunnerSecret(): Promise<string> {
  if (cachedSecret) return cachedSecret;
  const { data, error } = await admin.rpc("get_job_runner_secret");
  if (error || !data) throw new Error(`runner secret unavailable: ${error?.message ?? "empty"}`);
  cachedSecret = String(data);
  return cachedSecret;
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

interface JobRequest {
  job_name: string;
  target: string;            // nome da edge function alvo
  payload?: Record<string, unknown>;
  max_attempts?: number;     // padrão 3
  timeout_ms?: number;       // padrão 60s
  alert_after_attempts?: number; // padrão = max_attempts (alerta no esgotamento)
}

async function callTarget(
  target: string,
  payload: Record<string, unknown>,
  timeoutMs: number,
): Promise<{ ok: boolean; status: number; body: string; timedOut: boolean }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${target}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE}`,
        apikey: SERVICE_ROLE,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = await res.text();
    return { ok: res.ok, status: res.status, body, timedOut: false };
  } catch (e) {
    const aborted = e instanceof DOMException && e.name === "AbortError";
    return { ok: false, status: 0, body: aborted ? "timeout" : String(e), timedOut: aborted };
  } finally {
    clearTimeout(timer);
  }
}

async function logRun(row: Record<string, unknown>) {
  await admin.from("job_runs").insert(row);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Autenticação: aceita o JWT da service-role OU o segredo dedicado do runner
  const auth = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  let runnerSecret = "";
  try { runnerSecret = await getRunnerSecret(); } catch (_) { /* fallback abaixo */ }
  if (auth !== SERVICE_ROLE && (!runnerSecret || auth !== runnerSecret)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: JobRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const jobName = body.job_name;
  const target = body.target;
  if (!jobName || !target) {
    return new Response(JSON.stringify({ error: "job_name and target required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const maxAttempts = Math.min(Math.max(body.max_attempts ?? 3, 1), 5);
  const timeoutMs = Math.min(Math.max(body.timeout_ms ?? 60_000, 5_000), 300_000);
  const alertAfter = body.alert_after_attempts ?? maxAttempts;
  const payload = body.payload ?? {};

  let attempt = 0;
  let lastError = "";

  while (attempt < maxAttempts) {
    attempt++;
    const startedAt = new Date();
    const t0 = performance.now();
    const result = await callTarget(target, payload, timeoutMs);
    const duration = Math.round(performance.now() - t0);
    const finishedAt = new Date();

    if (result.ok) {
      await logRun({
        job_name: jobName,
        status: "success",
        attempt,
        duration_ms: duration,
        payload,
        started_at: startedAt.toISOString(),
        finished_at: finishedAt.toISOString(),
      });
      return new Response(JSON.stringify({ ok: true, attempt, duration_ms: duration }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    lastError = `HTTP ${result.status}: ${result.body.slice(0, 500)}`;
    const isLast = attempt >= maxAttempts;
    const status = result.timedOut ? "timeout" : isLast ? "failed" : "retrying";
    const alert = isLast && attempt >= alertAfter;

    await logRun({
      job_name: jobName,
      status,
      attempt,
      duration_ms: duration,
      error_message: lastError,
      payload,
      alert_raised: alert,
      started_at: startedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
    });

    if (isLast) break;
    // backoff exponencial: 2s, 4s, 8s...
    await new Promise((r) => setTimeout(r, 2000 * 2 ** (attempt - 1)));
  }

  return new Response(
    JSON.stringify({ ok: false, attempts: attempt, error: lastError }),
    { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
