// Auto-progression: analisa o progresso mensal de cada usuário e ajusta o plano de treino via IA.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface PlanChange {
  recommendation: string;
  intensity_delta: "increase" | "maintain" | "deload";
  volume_delta: "increase" | "maintain" | "decrease";
  notes: string;
}

async function analyzeUser(supabase: ReturnType<typeof createClient>, userId: string) {
  const since = new Date(Date.now() - 30 * 86400000).toISOString();

  const [{ data: history }, { data: weights }, { data: profile }, { data: plan }] = await Promise.all([
    supabase.from("workout_history").select("*").eq("user_id", userId).gte("workout_date", since),
    supabase.from("weight_logs").select("*").eq("user_id", userId).gte("logged_at", since).order("logged_at"),
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("workout_plans").select("*").eq("user_id", userId).eq("is_active", true).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (!profile || !plan) {
    console.log(`[auto-prog] skip ${userId} profile=${!!profile} plan=${!!plan}`);
    return { skipped: true };
  }

  const workoutsCompleted = history?.length ?? 0;
  const avgCompletion =
    workoutsCompleted > 0
      ? history!.reduce((s, h) => s + (h.completed_exercises / Math.max(1, h.total_exercises)), 0) / workoutsCompleted
      : 0;

  // Weight progression per exercise
  const byExercise: Record<string, number[]> = {};
  weights?.forEach((w) => {
    byExercise[w.exercise_name] ??= [];
    byExercise[w.exercise_name].push(Number(w.weight));
  });
  const progressions = Object.entries(byExercise).map(([name, arr]) => ({
    name,
    start: arr[0],
    end: arr[arr.length - 1],
    delta: arr[arr.length - 1] - arr[0],
  }));

  const prompt = `Analise os 30 dias do aluno e recomende ajuste no treino.
Perfil: nível ${profile.level}, objetivo ${profile.goal}, ${profile.days_per_week}x/sem.
Treinos completados: ${workoutsCompleted}.
Taxa média de conclusão: ${(avgCompletion * 100).toFixed(0)}%.
Progressão de cargas: ${JSON.stringify(progressions).slice(0, 1500)}.
Modo avançado: ${profile.advanced_mode ? "sim" : "não"}.
Método atual: ${profile.training_method ?? "padrão"}.

Decida: aumentar carga/volume, manter, ou deload. Retorne JSON via tool.`;

  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: "Você é coach de musculação especialista em progressão." },
        { role: "user", content: prompt },
      ],
      tools: [{
        type: "function",
        function: {
          name: "progression_decision",
          parameters: {
            type: "object",
            properties: {
              recommendation: { type: "string" },
              intensity_delta: { type: "string", enum: ["increase", "maintain", "deload"] },
              volume_delta: { type: "string", enum: ["increase", "maintain", "decrease"] },
              notes: { type: "string" },
            },
            required: ["recommendation", "intensity_delta", "volume_delta", "notes"],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "progression_decision" } },
    }),
  });

  if (!aiRes.ok) throw new Error(`AI ${aiRes.status}`);
  const aiData = await aiRes.json();
  const args = aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  const decision: PlanChange = args ? JSON.parse(args) : {
    recommendation: "Manter", intensity_delta: "maintain", volume_delta: "maintain", notes: "Sem dados suficientes",
  };

  // Apply: bump sets/reps in plan_data
  const planData = plan.plan_data as { days?: Array<{ exercises: Array<{ sets: number; reps: string }> }> };
  if (planData?.days && (decision.intensity_delta === "increase" || decision.volume_delta === "increase")) {
    planData.days.forEach((d) => d.exercises.forEach((ex) => {
      if (decision.volume_delta === "increase" && ex.sets < 5) ex.sets += 1;
    }));
    await supabase.from("workout_plans").update({ plan_data: planData, updated_at: new Date().toISOString() }).eq("id", plan.id);
  } else if (decision.intensity_delta === "deload" && planData?.days) {
    planData.days.forEach((d) => d.exercises.forEach((ex) => {
      if (ex.sets > 2) ex.sets -= 1;
    }));
    await supabase.from("workout_plans").update({ plan_data: planData, updated_at: new Date().toISOString() }).eq("id", plan.id);
  }

  await supabase.from("progression_log").insert({
    user_id: userId,
    period_start: since.slice(0, 10),
    period_end: new Date().toISOString().slice(0, 10),
    workouts_completed: workoutsCompleted,
    avg_completion_rate: avgCompletion,
    weight_progression: progressions,
    recommendation: decision.recommendation,
    applied: true,
    plan_changes: decision as unknown as Record<string, unknown>,
  });

  return { decision, workoutsCompleted };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const body = await req.json().catch(() => ({}));
    let userIds: string[] = body.userId ? [body.userId] : [];
    if (!userIds.length) {
      const { data } = await supabase.from("workout_plans").select("user_id").eq("is_active", true);
      userIds = [...new Set((data ?? []).map((r) => r.user_id))];
    }
    const results = await Promise.allSettled(userIds.map((id) => analyzeUser(supabase, id)));
    const ok = results.filter((r) => r.status === "fulfilled").length;
    return new Response(JSON.stringify({ processed: userIds.length, ok }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "err" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
