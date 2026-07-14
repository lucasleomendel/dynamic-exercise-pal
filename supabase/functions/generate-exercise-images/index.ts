// Gera imagens ilustrativas para exercícios com fila persistente, retry automático e rate limiting.
// - Fila: registra tentativas na tabela exercise_library (colunas image_attempts, image_last_error, image_last_try).
// - Rate limit: no máximo N por invocação, gap mínimo entre chamadas ao provedor, backoff em 429.
// - Retry: reprocessa itens que falharam se attempts < MAX_ATTEMPTS e passou o cooldown.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "exercise-images";

// Parâmetros de controle
const MAX_ATTEMPTS = 5;              // desiste após N falhas
const COOLDOWN_MIN = 15;             // minutos entre retries do mesmo item
const PROVIDER_GAP_MS = 1200;        // gap mínimo entre chamadas ao provedor (rate limit)
const RATE_LIMIT_BACKOFF_MS = 8000;  // pausa extra em 429
const MAX_PER_INVOCATION = 10;       // teto de segurança

const MUSCLE_PT: Record<string, string> = {
  peito: "peitoral", costas: "dorsais/costas", quadriceps: "quadríceps",
  posterior: "posterior de coxa", gluteos: "glúteos", ombros: "deltoides",
  biceps: "bíceps", triceps: "tríceps", abdomen: "abdômen", panturrilha: "panturrilha",
};

function slugify(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface GenResult { bytes?: Uint8Array; retryAfterMs?: number; error?: string }

async function generateImage(name: string, muscle: string, equipment: string | null): Promise<GenResult> {
  const prompt = `Illustration of a fit athletic person performing "${name}" exercise${equipment ? ` using ${equipment}` : ""}, focused on ${MUSCLE_PT[muscle] ?? muscle}. Cinematic gym photography, dramatic side lighting, dark moody background, muscular anatomy visible, realistic proportions, correct technique, professional fitness magazine style, sharp focus, high contrast, orange rim light. No text, no watermark, no logos.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3.1-flash-image",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });

  if (res.status === 429) {
    const ra = Number(res.headers.get("retry-after")) || 0;
    return { retryAfterMs: (ra > 0 ? ra * 1000 : RATE_LIMIT_BACKOFF_MS), error: "rate_limited" };
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { error: `provider_${res.status}: ${body.slice(0, 180)}` };
  }
  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) return { error: "no_image_in_response" };
  return { bytes: Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)) };
}

interface Pending {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string | null;
  image_attempts: number | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? "3"), 1), MAX_PER_INVOCATION);
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Seleciona a fila: sem imagem, ativos, ainda dentro do limite de tentativas
  // e fora do cooldown. Ordena por menos tentativas primeiro (fair queue).
  const cooldownIso = new Date(Date.now() - COOLDOWN_MIN * 60_000).toISOString();
  const { data: pending, error } = await sb
    .from("exercise_library")
    .select("id,name,muscle_group,equipment,image_attempts,image_last_try")
    .is("image_url", null)
    .eq("active", true)
    .or(`image_attempts.is.null,image_attempts.lt.${MAX_ATTEMPTS}`)
    .or(`image_last_try.is.null,image_last_try.lt.${cooldownIso}`)
    .order("image_attempts", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  if (!pending || pending.length === 0) {
    const { count } = await sb.from("exercise_library").select("id", { count: "exact", head: true })
      .is("image_url", null).eq("active", true);
    return new Response(JSON.stringify({ done: true, processed: 0, remaining: count ?? 0, results: [] }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const results: Array<{ id: string; ok: boolean; url?: string; error?: string; attempts: number }> = [];
  let lastCallAt = 0;

  for (const ex of pending as Pending[]) {
    const attemptsBefore = ex.image_attempts ?? 0;

    // Respeita gap mínimo entre chamadas
    const wait = PROVIDER_GAP_MS - (Date.now() - lastCallAt);
    if (wait > 0) await sleep(wait);

    let gen = await generateImage(ex.name, ex.muscle_group, ex.equipment);
    lastCallAt = Date.now();

    // Backoff em rate limit e 1 retry imediato
    if (gen.retryAfterMs) {
      await sleep(gen.retryAfterMs);
      gen = await generateImage(ex.name, ex.muscle_group, ex.equipment);
      lastCallAt = Date.now();
    }

    if (!gen.bytes) {
      const attempts = attemptsBefore + 1;
      await sb.from("exercise_library").update({
        image_attempts: attempts,
        image_last_error: (gen.error ?? "unknown").slice(0, 240),
        image_last_try: new Date().toISOString(),
      }).eq("id", ex.id);
      results.push({ id: ex.id, ok: false, error: gen.error ?? "unknown", attempts });
      continue;
    }

    // Upload + update
    try {
      const path = `${ex.muscle_group}/${slugify(ex.name)}-${ex.id.slice(0, 8)}.png`;
      const up = await sb.storage.from(BUCKET).upload(path, gen.bytes, { contentType: "image/png", upsert: true });
      if (up.error) throw new Error(up.error.message);
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
      const upd = await sb.from("exercise_library").update({
        image_url: publicUrl,
        image_attempts: attemptsBefore + 1,
        image_last_error: null,
        image_last_try: new Date().toISOString(),
      }).eq("id", ex.id);
      if (upd.error) throw new Error(upd.error.message);
      results.push({ id: ex.id, ok: true, url: publicUrl, attempts: attemptsBefore + 1 });
    } catch (e) {
      const attempts = attemptsBefore + 1;
      await sb.from("exercise_library").update({
        image_attempts: attempts,
        image_last_error: (e as Error).message.slice(0, 240),
        image_last_try: new Date().toISOString(),
      }).eq("id", ex.id);
      results.push({ id: ex.id, ok: false, error: (e as Error).message, attempts });
    }
  }

  const { count: remaining } = await sb.from("exercise_library").select("id", { count: "exact", head: true })
    .is("image_url", null).eq("active", true)
    .or(`image_attempts.is.null,image_attempts.lt.${MAX_ATTEMPTS}`);
  const { count: dead } = await sb.from("exercise_library").select("id", { count: "exact", head: true })
    .is("image_url", null).eq("active", true).gte("image_attempts", MAX_ATTEMPTS);

  return new Response(JSON.stringify({
    processed: results.length,
    succeeded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    remaining: remaining ?? 0,
    dead_letter: dead ?? 0,
    results,
  }), { headers: { ...cors, "Content-Type": "application/json" } });
});
