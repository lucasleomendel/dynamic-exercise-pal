// Gera imagens ilustrativas específicas por exercício em background via Lovable AI (Gemini image),
// faz upload no bucket privado 'exercise-images' e grava a URL pública em exercise_library.image_url.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "exercise-images";

const MUSCLE_PT: Record<string, string> = {
  peito: "peitoral", costas: "dorsais/costas", quadriceps: "quadríceps",
  posterior: "posterior de coxa", gluteos: "glúteos", ombros: "deltoides",
  biceps: "bíceps", triceps: "tríceps", abdomen: "abdômen", panturrilha: "panturrilha",
};

function slugify(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

async function generateImage(name: string, muscle: string, equipment: string | null): Promise<Uint8Array | null> {
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
  if (!res.ok) { console.error("image gen failed", res.status, await res.text().catch(() => "")); return null; }
  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) return null;
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return bin;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "3"), 10);
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

  const { data: pending, error } = await sb
    .from("exercise_library")
    .select("id,name,muscle_group,equipment")
    .is("image_url", null)
    .eq("active", true)
    .limit(limit);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  if (!pending || pending.length === 0) return new Response(JSON.stringify({ done: true, processed: 0 }), { headers: { ...cors, "Content-Type": "application/json" } });

  const results: Array<{ id: string; ok: boolean; url?: string; error?: string }> = [];

  for (const ex of pending) {
    try {
      const bytes = await generateImage(ex.name, ex.muscle_group, ex.equipment);
      if (!bytes) { results.push({ id: ex.id, ok: false, error: "no image" }); continue; }
      const path = `${ex.muscle_group}/${slugify(ex.name)}-${ex.id.slice(0, 8)}.png`;
      const up = await sb.storage.from(BUCKET).upload(path, bytes, { contentType: "image/png", upsert: true });
      if (up.error) { results.push({ id: ex.id, ok: false, error: up.error.message }); continue; }
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
      const upd = await sb.from("exercise_library").update({ image_url: publicUrl }).eq("id", ex.id);
      if (upd.error) { results.push({ id: ex.id, ok: false, error: upd.error.message }); continue; }
      results.push({ id: ex.id, ok: true, url: publicUrl });
    } catch (e) {
      results.push({ id: ex.id, ok: false, error: (e as Error).message });
    }
  }

  const { count } = await sb.from("exercise_library").select("id", { count: "exact", head: true }).is("image_url", null).eq("active", true);

  return new Response(JSON.stringify({ processed: results.length, remaining: count ?? 0, results }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
