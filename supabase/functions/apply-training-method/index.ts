// Regenera o plano de treino do usuário aplicando o método avançado escolhido
// (ou voltando ao padrão quando desativado), usando IA + perfil + progresso recente.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ALLOWED_ORIGINS = new Set([
  "https://dynamic-exercise-pal.lovable.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://dynamic-exercise-pal.lovable.app";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}


const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const INJURY_KEYWORDS: Record<string, string[]> = {
  ombro: ["Desenvolvimento", "Arnold", "Militar", "Elevação Frontal", "Elevação Lateral", "Remada Alta", "Mergulho", "Flexão Diamante", "Face Pull", "Y-Raise", "Crucifixo Inverso"],
  joelho: ["Agachamento", "Leg Press", "Extensora", "Hack", "Avanço", "Passada", "Búlgaro", "Sissy", "Panturrilha no Leg Press"],
  lombar: ["Levantamento Terra", "Remada Curvada", "Stiff", "Good Morning", "Agachamento Livre", "Agachamento Frontal", "Agachamento Sumô", "Avanço", "Passada", "Agachamento Búlgaro"],
  punho: ["Supino Reto com Barra", "Supino Declinado", "Supino Inclinado com Halteres", "Supino Reto com Halteres", "Flexão de Braço", "Flexão Diamante", "Rosca Direta com Barra", "Rosca Inversa", "Tríceps Testa", "Mergulho"],
  cotovelo: ["Rosca Direta", "Rosca Alternada", "Rosca Martelo", "Rosca Scott", "Rosca Concentrada", "Rosca no Cabo", "Rosca Inversa", "Rosca 21", "Rosca Spider", "Rosca Inclinada", "Tríceps Pulley", "Tríceps Testa", "Tríceps Francês", "Tríceps Corda", "Tríceps Coice", "Mergulho", "Supino Fechado", "JM Press"],
  quadril: ["Agachamento", "Leg Press", "Avanço", "Passada", "Búlgaro", "Stiff", "Good Morning", "Elevação Pélvica", "Abdução de Quadril", "Glúteo no Cabo", "Extensão de Quadril", "Nordic Curl"],
  tornozelo: ["Agachamento", "Leg Press", "Avanço", "Passada", "Búlgaro", "Sissy", "Panturrilha", "Mountain Climber"],
};

function exerciseBlocked(name: string, injuries: unknown[]): boolean {
  return injuries.some((injury) =>
    typeof injury === "string" && (INJURY_KEYWORDS[injury] ?? []).some((keyword) => name.includes(keyword))
  );
}

function estimateMinutes(exercise: any): number {
  const rest = Number(String(exercise.rest ?? "").match(/(\d+)/)?.[1] ?? 60);
  const sets = Math.min(Math.max(Number(exercise.sets) || 1, 1), 6);
  const compound = ["Supino", "Agachamento", "Leg Press", "Remada", "Puxada", "Barra Fixa", "Desenvolvimento", "Terra", "Stiff", "Hip Thrust", "Elevação Pélvica"].some((k) => String(exercise.name).includes(k));
  return sets * (compound ? 0.85 : 0.65) + Math.max(sets - 1, 0) * rest / 60 + (compound ? 1 : 0.75);
}

function sanitizePlan(planData: any, profile: any) {
  const targetDays = Number(profile.days_per_week) || 1;
  const budget = (Number(profile.hours_per_session) || 1) * 60;
  const injuries = Array.isArray(profile.injuries) ? profile.injuries : [];
  const days = Array.isArray(planData?.days) ? planData.days.slice(0, targetDays) : [];
  if (days.length !== targetDays) throw new Error("A IA retornou uma quantidade de dias diferente do perfil.");

  const sanitizedDays = days.map((day: any) => {
    const source = Array.isArray(day?.exercises) ? day.exercises : [];
    const unique = new Set<string>();
    const exercises = source
      .filter((ex: any) => typeof ex?.name === "string" && ex.name.trim())
      .filter((ex: any) => !exerciseBlocked(ex.name, injuries))
      .map((ex: any) => ({
        name: String(ex.name).trim().slice(0, 120),
        sets: Math.min(Math.max(Math.round(Number(ex.sets) || 1), 1), 6),
        reps: String(ex.reps ?? "8-12").slice(0, 30),
        rest: String(ex.rest ?? "60s").slice(0, 20),
        muscle: String(ex.muscle ?? "Geral").slice(0, 60),
        ...(ex.tip ? { tip: String(ex.tip).slice(0, 240) } : {}),
      }))
      .filter((ex: any) => {
        if (unique.has(ex.name)) return false;
        unique.add(ex.name);
        return true;
      })
      .slice(0, 8);

    const fitted: any[] = [];
    let minutes = 0;
    for (const ex of exercises) {
      const cost = estimateMinutes(ex);
      if (fitted.length === 0 || minutes + cost <= budget) {
        fitted.push(ex);
        minutes += cost;
      }
    }
    if (fitted.length === 0) throw new Error("Uma sessão ficou sem exercícios compatíveis com as restrições.");
    return { day: String(day.day ?? ""), focus: String(day.focus ?? "").slice(0, 120), exercises: fitted };
  });

  return {
    ...planData,
    daysPerWeek: targetDays,
    days: sanitizedDays,
    description: String(planData.description ?? "").slice(0, 1000),
    title: String(planData.title ?? "Plano FitForge").slice(0, 160),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });
  try {
    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!jwt) return json({ error: "unauthenticated" }, 401, req);

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: u } = await authClient.auth.getUser(jwt);
    const userId = u?.user?.id;
    if (!userId) return json({ error: "invalid session" }, 401, req);

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

    if (!profile) return json({ error: "missing profile" }, 400, req);

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
Restrições físicas: ${(profile.injuries ?? []).join(", ") || "nenhuma"}

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
      if (aiRes.status === 429) return json({ error: "Limite de requisições. Tente em instantes." }, 429, req);
      if (aiRes.status === 402) return json({ error: "Créditos de IA esgotados." }, 402, req);
      return json({ error: "Falha ao gerar plano" }, 502, req);
    }

    const aiData = await aiRes.json();
    const args = aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return json({ error: "Resposta inválida da IA" }, 502, req);
    let planData = JSON.parse(args);
    try {
      planData = sanitizePlan(planData, profile);
    } catch (e) {
      console.error("Plano rejeitado após validação:", e);
      return json({ error: e instanceof Error ? e.message : "Plano incompatível com o perfil." }, 502, req);
    }

    // Replace the active plan in one transaction; a failed insert cannot leave no active plan.
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { error: syncErr } = await userClient.rpc("sync_active_workout_plan", {
      p_title: planData.title,
      p_description: planData.description ?? null,
      p_days_per_week: planData.daysPerWeek ?? planData.days.length,
      p_plan_data: planData,
    });
    if (syncErr) {
      console.error("atomic workout plan sync failed", syncErr);
      return json({ error: "Falha ao salvar plano" }, 500, req);
    }

    return json({ ok: true, plan: planData, method: advanced ? methodSlug || null : null }, 200, req);
  } catch (e) {
    console.error("apply-training-method error:", e);
    return json({ error: "Erro interno do servidor" }, 500, req);
  }
});

async function safeJson(req: Request) {
  try { return await req.clone().json(); } catch { return {}; }
}
function json(b: unknown, status = 200, req?: Request) {
  return new Response(JSON.stringify(b), { status, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
}
