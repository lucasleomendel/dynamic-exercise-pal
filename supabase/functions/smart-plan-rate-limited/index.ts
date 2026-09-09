import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Input validation schema
interface SmartPlanRequest {
  focus?: string;
  targetUserId?: string;
}

function validateSmartPlanRequest(body: unknown): { valid: boolean; error?: string; data?: SmartPlanRequest } {
  if (typeof body !== "object" || body === null) {
    return { valid: false, error: "Request body must be JSON object" };
  }
  const req = body as Record<string, any>;

  // Optional focus
  if (req.focus !== undefined && typeof req.focus !== "string") {
    return { valid: false, error: "Field 'focus' must be string" };
  }

  if (typeof req.focus === "string" && req.focus.length > 400) {
    return { valid: false, error: "Field 'focus' max 400 characters" };
  }

  // Optional targetUserId (for admin)
  if (req.targetUserId !== undefined && typeof req.targetUserId !== "string") {
    return { valid: false, error: "Field 'targetUserId' must be string" };
  }

  return { valid: true, data: { focus: req.focus, targetUserId: req.targetUserId } };
}

// Rate limiter: Max 2 plans per user per day
const planLimitStore = new Map<string, { count: number; resetAt: number }>();
const PLAN_LIMIT_PER_DAY = 2;
const PLAN_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

function checkPlanRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const bucket = planLimitStore.get(userId);

  if (!bucket || now > bucket.resetAt) {
    planLimitStore.set(userId, { count: 1, resetAt: now + PLAN_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (bucket.count >= PLAN_LIMIT_PER_DAY) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  bucket.count++;
  return { allowed: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // 1. Authentication
    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!jwt) return json({ error: "unauthenticated" }, 401);

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: u } = await authClient.auth.getUser(jwt);
    const callerId = u?.user?.id;
    if (!callerId) return json({ error: "invalid session" }, 401);

    // 2. Input validation
    const body = await req.json().catch(() => ({}));
    const validation = validateSmartPlanRequest(body);
    if (!validation.valid) {
      return json({ error: validation.error }, 400);
    }

    const { focus: focusRequest, targetUserId: target } = validation.data!;

    // 3. Determine target user (admin override)
    const callerRole = (u?.user?.app_metadata as Record<string, unknown> | undefined)?.role;
    const userId = target && callerRole === "master_admin" ? target : callerId;

    // 4. Rate limit (per user, per day)
    const rateLimit = checkPlanRateLimit(userId);
    if (!rateLimit.allowed) {
      const retryAfterSec = rateLimit.retryAfter || 3600;
      return json(
        { error: `Limite de gerações atingido. Tente em ${retryAfterSec}s.` },
        429
      );
    }

    // 5. Fetch user data
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
    const since = new Date(Date.now() - 60 * 86400000).toISOString();

    const [
      { data: profile },
      { data: history },
      { data: weights },
      { data: method },
      { data: library },
    ] = await Promise.all([
      sb.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      sb
        .from("workout_history")
        .select("workout_date,completed_exercises,total_exercises,day_focus")
        .eq("user_id", userId)
        .gte("workout_date", since)
        .order("workout_date", { ascending: false })
        .limit(60),
      sb
        .from("weight_logs")
        .select("exercise_name,muscle,weight,logged_at")
        .eq("user_id", userId)
        .gte("logged_at", since)
        .order("logged_at", { ascending: true })
        .limit(300),
      sb.from("training_methods").select("*").eq("active", true),
      sb
        .from("exercise_library")
        .select("name,muscle_group,equipment,difficulty")
        .eq("active", true)
        .limit(600),
    ]);

    if (!profile) {
      return json({ error: "Complete seu perfil antes de gerar o treino." }, 400);
    }

    // 6. Calculate metrics
    const sessions = history ?? [];
    const adherence = sessions.length
      ? Math.round(
          (sessions.reduce(
            (a, s) => a + s.completed_exercises / Math.max(1, s.total_exercises),
            0
          ) /
            sessions.length) *
            100
        )
      : null;

    const byEx = new Map<string, { muscle: string | null; first: number; last: number; n: number }>();
    for (const w of weights ?? []) {
      const cur = byEx.get(w.exercise_name);
      const v = Number(w.weight);
      if (!cur)
        byEx.set(w.exercise_name, { muscle: w.muscle, first: v, last: v, n: 1 });
      else {
        cur.last = v;
        cur.n += 1;
      }
    }

    const loadTrend = [...byEx.entries()].map(([n, v]) => ({
      exercicio: n,
      de: v.first,
      para: v.last,
      delta: +(v.last - v.first).toFixed(1),
      registros: v.n,
    }));
    const stagnant = loadTrend
      .filter((t) => t.registros >= 3 && t.delta <= 0)
      .map((t) => t.exercicio);

    // 7. Build prompt
    const focusCount: Record<string, number> = {};
    for (const s of sessions)
      if (s.day_focus) focusCount[s.day_focus] = (focusCount[s.day_focus] ?? 0) + 1;

    const libraryByMuscle: Record<string, string[]> = {};
    for (const e of library ?? []) {
      (libraryByMuscle[e.muscle_group] ??= []).push(e.name);
    }
    const librarySummary = Object.entries(libraryByMuscle)
      .map(([m, names]) => `${m}: ${names.slice(0, 22).join(", ")}`)
      .join("\n");

    const prompt = `Monte um plano de treino AUTOMÁTICO periodizado.\n\nAluno: ${profile.name || "aluno"} | ${profile.age || "—"}a | ${profile.weight || "—"}kg\nObjetivo: ${profile.goal || "hipertrofia"} | Nível: ${profile.level || "intermediario"}\nFrequência: ${profile.days_per_week || 4}x/semana\n\nHistórico (60 dias):\nSessões: ${sessions.length} | Adesão: ${adherence || "—"}%\nEstagnados: ${stagnant.slice(0, 5).join(", ") || "nenhum"}\n\nBiblioteca:\n${librarySummary.slice(0, 2000)}`;

    // 8. Call AI
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          {
            role: "system",
            content:
              "Você é um coach de musculação (CSCS). Responda com plano de treino em JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiRes.ok) {
      const status = aiRes.status;
      if (status === 429) return json({ error: "IA rate limited. Tente em 1 minuto." }, 429);
      if (status === 402) return json({ error: "Créditos esgotados." }, 402);
      return json({ error: "Erro ao gerar plano." }, 502);
    }

    const aiData = await aiRes.json();
    const planData = aiData.choices?.[0]?.message?.content;

    if (!planData) {
      return json({ error: "Resposta inválida da IA." }, 502);
    }

    // 9. Save plan
    await sb.from("workout_plans").update({ is_active: false }).eq("user_id", userId);
    const { data: inserted } = await sb
      .from("workout_plans")
      .insert({
        user_id: userId,
        title: "Plano Automático",
        description: focusRequest || "Plano gerado automaticamente",
        days_per_week: profile.days_per_week || 4,
        plan_data: planData,
        is_active: true,
      })
      .select("id")
      .single();

    return json({
      ok: true,
      planId: inserted?.id,
      analysis: {
        sessions: sessions.length,
        adherence,
        stagnant: stagnant.slice(0, 10),
      },
    });
  } catch (e) {
    console.error("smart-plan error:", e);
    return json({ error: "Erro interno do servidor" }, 500);
  }
});
