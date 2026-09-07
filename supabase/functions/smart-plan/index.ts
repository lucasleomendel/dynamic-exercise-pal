// Gera um plano de treino automático combinando grupos musculares, intensidade e progressão
// com base no histórico real do aluno (treinos, cargas, adesão) + biblioteca de exercícios.
// Salva como plano ativo em workout_plans e devolve o JSON para o app.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const PLAN_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    daysPerWeek: { type: "number" },
    progressionNotes: { type: "string", description: "Como progredir nas próximas 4 semanas" },
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
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!jwt) return json({ error: "unauthenticated" }, 401);

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: u } = await authClient.auth.getUser(jwt);
    const callerId = u?.user?.id;
    if (!callerId) return json({ error: "invalid session" }, 401);

    const body = await req.json().catch(() => ({}));
    const focusRequest = typeof body?.focus === "string" ? body.focus.slice(0, 400) : "";

    // O administrador geral pode gerar o treino em nome de um aluno.
    const callerRole = (u?.user?.app_metadata as Record<string, unknown> | undefined)?.role;
    const target = typeof body?.targetUserId === "string" ? body.targetUserId : "";
    const userId = target && callerRole === "master_admin" ? target : callerId;

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
    const since = new Date(Date.now() - 60 * 86400000).toISOString();


    const [{ data: profile }, { data: history }, { data: weights }, { data: method }, { data: library }] =
      await Promise.all([
        sb.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        sb.from("workout_history")
          .select("workout_date,completed_exercises,total_exercises,day_focus")
          .eq("user_id", userId).gte("workout_date", since).order("workout_date", { ascending: false }).limit(60),
        sb.from("weight_logs")
          .select("exercise_name,muscle,weight,logged_at")
          .eq("user_id", userId).gte("logged_at", since).order("logged_at", { ascending: true }).limit(300),
        sb.from("training_methods").select("*").eq("active", true),
        sb.from("exercise_library")
          .select("name,muscle_group,equipment,difficulty")
          .eq("active", true).limit(600),
      ]);

    if (!profile) return json({ error: "Complete seu perfil antes de gerar o treino." }, 400);

    const sessions = history ?? [];
    const adherence = sessions.length
      ? Math.round(
        (sessions.reduce((a, s) => a + s.completed_exercises / Math.max(1, s.total_exercises), 0) /
          sessions.length) * 100,
      )
      : null;

    // Evolução de carga por exercício (primeira → última) para dosar intensidade/progressão.
    const byEx = new Map<string, { muscle: string | null; first: number; last: number; n: number }>();
    for (const w of weights ?? []) {
      const cur = byEx.get(w.exercise_name);
      const v = Number(w.weight);
      if (!cur) byEx.set(w.exercise_name, { muscle: w.muscle, first: v, last: v, n: 1 });
      else { cur.last = v; cur.n += 1; }
    }
    const loadTrend = [...byEx.entries()].map(([n, v]) => ({
      exercicio: n,
      de: v.first,
      para: v.last,
      delta: +(v.last - v.first).toFixed(1),
      registros: v.n,
    }));
    const stagnant = loadTrend.filter((t) => t.registros >= 3 && t.delta <= 0).map((t) => t.exercicio);

    // Volume por foco (quais grupos vêm sendo treinados / negligenciados)
    const focusCount: Record<string, number> = {};
    for (const s of sessions) if (s.day_focus) focusCount[s.day_focus] = (focusCount[s.day_focus] ?? 0) + 1;

    const activeMethod = (method ?? []).find((m) => m.slug === profile.training_method);
    const advanced = !!profile.advanced_mode;

    const libraryByMuscle: Record<string, string[]> = {};
    for (const e of library ?? []) {
      (libraryByMuscle[e.muscle_group] ??= []).push(e.name);
    }
    const librarySummary = Object.entries(libraryByMuscle)
      .map(([m, names]) => `${m}: ${names.slice(0, 22).join(", ")}`)
      .join("\n");

    const prompt = `Monte um plano de treino AUTOMÁTICO e periodizado, combinando grupos musculares, intensidade e progressão.

## Aluno
Nome: ${profile.name ?? "aluno"} | ${profile.age ?? "—"}a | ${profile.sex ?? "—"} | ${profile.weight ?? "—"}kg / ${profile.height ?? "—"}cm
Objetivo: ${profile.goal ?? "hipertrofia"} | Nível: ${profile.level ?? "intermediario"}
Frequência: ${profile.days_per_week ?? 4}x/semana · ~${profile.hours_per_session ?? 1}h por sessão
Músculos priorizados: ${(profile.selected_muscles ?? []).join(", ") || "todos"} | Split de pernas: ${profile.split_legs ? "sim" : "não"}
${advanced && activeMethod ? `Modo avançado ATIVO — aplicar método "${activeMethod.name}": ${activeMethod.short_description}` : "Modo padrão — hipertrofia clássica com progressão dupla."}

## Histórico (60 dias)
Sessões concluídas: ${sessions.length} | Adesão média: ${adherence !== null ? adherence + "%" : "sem dados"}
Distribuição por foco: ${JSON.stringify(focusCount)}
Evolução de cargas: ${JSON.stringify(loadTrend.slice(0, 25))}
Exercícios estagnados (sem ganho): ${stagnant.slice(0, 12).join(", ") || "nenhum"}

## Pedido extra do aluno
${focusRequest || "nenhum"}

## Regras
- Distribua os grupos musculares com frequência 2x/semana quando a frequência permitir; 10-20 séries semanais por grupo.
- Ajuste a intensidade ao histórico: adesão < 60% → simplifique (menos exercícios, sessões mais curtas). Estagnação → troque estímulo (variação, faixa de reps, método).
- Descreva a progressão das próximas 4 semanas em "progressionNotes" (carga, reps, deload).
- Cada dia: 5-8 exercícios coerentes com o foco, com séries, faixa de reps, descanso e dica curta de execução/RIR.
- Prefira exercícios existentes na biblioteca abaixo (use o nome exato quando possível).

## Biblioteca disponível
${librarySummary.slice(0, 4000)}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          { role: "system", content: "Você é um coach de musculação sênior (CSCS). Responda somente via tool call, em português brasileiro." },
          { role: "user", content: prompt },
        ],
        tools: [{ type: "function", function: { name: "build_plan", parameters: PLAN_SCHEMA } }],
        tool_choice: { type: "function", function: { name: "build_plan" } },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text().catch(() => "");
      console.error("AI error", aiRes.status, t);
      if (aiRes.status === 429) return json({ error: "Muitas requisições à IA. Tente em alguns segundos." }, 429);
      if (aiRes.status === 402) return json({ error: "Créditos de IA esgotados." }, 402);
      if (aiRes.status === 403) return json({ error: "IA indisponível para esta conta." }, 403);
      return json({ error: "Falha ao gerar o plano." }, 502);
    }

    const aiData = await aiRes.json();
    const args = aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return json({ error: "Resposta inválida da IA." }, 502);

    let planData: any;
    try { planData = JSON.parse(args); } catch { return json({ error: "Resposta inválida da IA." }, 502); }
    if (!Array.isArray(planData?.days) || planData.days.length === 0) {
      return json({ error: "A IA não retornou dias de treino." }, 502);
    }

    // Mantém o histórico: planos anteriores ficam arquivados (is_active = false).
    await sb.from("workout_plans").update({ is_active: false }).eq("user_id", userId).eq("is_active", true);
    const { data: inserted, error: insErr } = await sb.from("workout_plans").insert({
      user_id: userId,
      title: planData.title,
      description: planData.description,
      days_per_week: planData.daysPerWeek ?? planData.days.length,
      plan_data: planData,
      is_active: true,
    }).select("id,created_at").single();
    if (insErr || !inserted) {
      console.error(insErr);
      return json({ error: "Falha ao salvar o plano." }, 500);
    }

    // Registra a progressão que originou este plano (histórico do aluno).
    const periodEnd = new Date();
    const periodStart = new Date(Date.now() - 60 * 86400000);
    const { error: progErr } = await sb.from("progression_log").insert({
      user_id: userId,
      analyzed_at: periodEnd.toISOString(),
      period_start: periodStart.toISOString().slice(0, 10),
      period_end: periodEnd.toISOString().slice(0, 10),
      workouts_completed: sessions.length,
      avg_completion_rate: adherence,
      weight_progression: loadTrend.slice(0, 40),
      recommendation: planData.progressionNotes ?? planData.description ?? null,
      applied: true,
      plan_changes: {
        plan_id: inserted.id,
        title: planData.title,
        days_per_week: planData.daysPerWeek ?? planData.days.length,
        exercises: planData.days.reduce((a: number, d: any) => a + (d.exercises?.length ?? 0), 0),
        stagnant: stagnant.slice(0, 12),
        method: advanced ? (activeMethod?.name ?? null) : null,
        source: "smart-plan",
      },
    });
    if (progErr) console.error("progression_log insert failed", progErr);

    return json({
      ok: true,
      planId: inserted.id,
      plan: planData,
      analysis: {
        sessions: sessions.length,
        adherence,
        stagnant: stagnant.slice(0, 10),
        method: advanced ? (activeMethod?.name ?? null) : null,
      },
    });

  } catch (e) {
    console.error("smart-plan error:", e);
    return json({ error: "Erro interno do servidor" }, 500);
  }
});
