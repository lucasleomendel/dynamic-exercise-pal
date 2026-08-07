// Regenera o plano de treino do usuário aplicando o método avançado escolhido
// (ou voltando ao padrão quando desativado), usando IA + perfil + progresso recente.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!jwt) return json({ error: "unauthenticated" }, 401);

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: u } = await authClient.auth.getUser(jwt);
    const userId = u?.user?.id;
    if (!userId) return json({ error: "invalid session" }, 401);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const [{ data: profile }, { data: plan }, { data: method }, { data: history }, { data: weights }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("workout_plans").select("*").eq("user_id", userId).eq("is_active", true)
        .order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("training_methods").select("*").eq("slug", String((await safeJson(req)).method ?? "")).maybeSingle(),
      supabase.from("workout_history").select("*").eq("user_id", userId).gte("workout_date", since),
      supabase.from("weight_logs").select("exercise_name,weight,logged_at").eq("user_id", userId).gte("logged_at", since).order("logged_at"),
    ]);

    if (!profile) return json({ error: "missing profile" }, 400);

    const advanced = !!profile.advanced_mode;
    const methodSlug = profile.training_method || "";
    const methodInfo = method && method.slug === methodSlug ? method : null;

    const completed = history?.length ?? 0;
    const completionRate = completed > 0
      ? history!.reduce((s: number, h: any) => s + (h.completed_exercises / Math.max(1, h.total_exercises)), 0) / completed
      : 0;

    const byEx: Record<string, number[]> = {};
    weights?.forEach((w: any) => { (byEx[w.exercise_name] ??= []).push(Number(w.weight)); });
    const progress = Object.entries(byEx).map(([n, a]) => ({ name: n, delta: a[a.length - 1] - a[0] }));

    const methodGuide = advanced && methodInfo
      ? `MÉTODO OBRIGATÓRIO: ${methodInfo.name} — ${methodInfo.short_description}.
Aplique a técnica em TODOS os exercícios principais, ajustando séries/repetições/descanso e adicionando dica de execução do método no campo "tip".`
      : `MODO PADRÃO: hipertrofia clássica, séries de 3-4, reps 8-12, descanso 60-90s.`;

    const prompt = `Gere um plano de treino COMPLETO e atualizado conforme tendências de mercado (2025-2026) para:
Perfil: ${profile.name ?? "aluno"}, ${profile.age}a, ${profile.sex}, ${profile.weight}kg/${profile.height}cm
Objetivo: ${profile.goal} | Nível: ${profile.level}
Frequência: ${profile.days_per_week}x/sem, ~${profile.hours_per_session}h/sessão
Músculos preferidos: ${(profile.selected_muscles ?? []).join(", ") || "todos"}
Split de pernas: ${profile.split_legs ? "sim" : "não"}

PROGRESSO RECENTE (30d): ${completed} treinos, ${(completionRate * 100).toFixed(0)}% conclusão.
Cargas: ${JSON.stringify(progress).slice(0, 800)}

${methodGuide}

Use exercícios consagrados + variações modernas. Cada dia deve ter 5-8 exercícios coerentes com o split.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um coach de musculação sênior. Responda apenas via tool call." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "build_plan",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                daysPerWeek: { type: "number" },
                days: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      day: { type: "string" },
                      focus: { type: "string" },
                      exercises: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            sets: { type: "number" },
                            reps: { type: "string" },
                            rest: { type: "string" },
                            muscle: { type: "string" },
                            tip: { type: "string" },
                          },
                          required: ["name", "sets", "reps", "rest", "muscle"],
                        },
                      },
                    },
                    required: ["day", "focus", "exercises"],
                  },
                },
              },
              required: ["title", "description", "daysPerWeek", "days"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "build_plan" } },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error", aiRes.status, t);
      if (aiRes.status === 429) return json({ error: "Limite de requisições. Tente em instantes." }, 429);
      if (aiRes.status === 402) return json({ error: "Créditos de IA esgotados." }, 402);
      return json({ error: "Falha ao gerar plano" }, 502);
    }

    const aiData = await aiRes.json();
    const args = aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return json({ error: "Resposta inválida da IA" }, 502);
    const planData = JSON.parse(args);

    // Desativa antigos e insere novo
    await supabase.from("workout_plans").update({ is_active: false }).eq("user_id", userId).eq("is_active", true);
    const { data: inserted, error: insErr } = await supabase.from("workout_plans").insert({
      user_id: userId,
      title: planData.title,
      description: planData.description,
      days_per_week: planData.daysPerWeek,
      plan_data: planData,
      is_active: true,
    }).select().maybeSingle();
    if (insErr) {
      console.error(insErr);
      return json({ error: "Falha ao salvar plano" }, 500);
    }

    return json({ ok: true, plan: planData, method: advanced ? methodSlug || null : null });
  } catch (e) {
    console.error("apply-training-method error:", e);
    return json({ error: "Erro interno do servidor" }, 500);
  }
});

async function safeJson(req: Request) {
  try { return await req.clone().json(); } catch { return {}; }
}
function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
