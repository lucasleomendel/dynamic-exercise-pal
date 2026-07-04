// Refresh exercise library and training methods using Lovable AI with web grounding.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const MUSCLES = ["peito", "costas", "quadriceps", "posterior", "gluteos", "ombros", "biceps", "triceps", "abdomen", "panturrilha"];

interface AIExercise {
  name: string;
  muscle_group: string;
  secondary_muscles?: string[];
  equipment?: string;
  difficulty?: string;
  default_sets?: number;
  default_reps?: string;
  default_rest?: string;
  technique_tip?: string;
  description?: string;
  steps?: string[];
  image_url?: string;
  video_url?: string;
}


async function fetchExercisesForMuscle(muscle: string): Promise<AIExercise[]> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: "Você é um especialista em musculação. Retorne exercícios validados cientificamente. Para video_url use APENAS URLs reais e verificadas do YouTube (canais reconhecidos como Jeff Nippard, ATHLEAN-X, Renaissance Periodization, Leandro Twin). Para image_url use URLs de Unsplash ou Wikimedia Commons — se não tiver certeza, omita o campo (é melhor omitir do que inventar)." },
        { role: "user", content: `Liste 10-15 exercícios eficazes para ${muscle}, incluindo variações modernas e clássicas. Para cada um retorne: nome em português, músculos secundários, equipamento, dificuldade (iniciante/intermediario/avancado), séries, reps, descanso, dica técnica curta, descrição completa (2-3 frases), 6 passos de execução detalhados, e opcionalmente image_url e video_url reais.` },
      ],
      tools: [{
        type: "function",
        function: {
          name: "list_exercises",
          parameters: {
            type: "object",
            properties: {
              exercises: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    muscle_group: { type: "string" },
                    secondary_muscles: { type: "array", items: { type: "string" } },
                    equipment: { type: "string" },
                    difficulty: { type: "string" },
                    default_sets: { type: "number" },
                    default_reps: { type: "string" },
                    default_rest: { type: "string" },
                    technique_tip: { type: "string" },
                    description: { type: "string" },
                    steps: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 8 },
                    image_url: { type: "string" },
                    video_url: { type: "string" },
                  },
                  required: ["name", "muscle_group", "description", "steps"],
                },
              },
            },
            required: ["exercises"],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "list_exercises" } },
    }),
  });


  if (!res.ok) {
    console.error(`AI failed for ${muscle}: ${res.status}`);
    return [];
  }
  const data = await res.json();
  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) return [];
  try {
    const parsed = JSON.parse(args);
    return parsed.exercises ?? [];
  } catch {
    return [];
  }
}

async function getRunnerSecret(admin: ReturnType<typeof createClient>): Promise<string | null> {
  try {
    const { data } = await admin.rpc("get_job_runner_secret");
    return data ? String(data) : null;
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Somente service-role ou runner-secret podem invocar (função admin/cron).
    const auth = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
    const runnerSecret = await getRunnerSecret(supabase);
    if (auth !== SERVICE_ROLE && (!runnerSecret || auth !== runnerSecret)) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let added = 0, updated = 0;

    for (const muscle of MUSCLES) {
      const exercises = await fetchExercisesForMuscle(muscle);
      for (const ex of exercises) {
        const payload = {
          name: ex.name,
          muscle_group: muscle,
          secondary_muscles: ex.secondary_muscles ?? null,
          equipment: ex.equipment ?? null,
          difficulty: ex.difficulty ?? null,
          default_sets: ex.default_sets ?? 3,
          default_reps: ex.default_reps ?? "10-12",
          default_rest: ex.default_rest ?? "60s",
          technique_tip: ex.technique_tip ?? null,
          source: "ai-refresh",
          last_verified_at: new Date().toISOString(),
          active: true,
        };
        const { data: existing } = await supabase
          .from("exercise_library")
          .select("id")
          .eq("name", ex.name)
          .eq("muscle_group", muscle)
          .maybeSingle();
        if (existing) {
          await supabase.from("exercise_library").update(payload).eq("id", existing.id);
          updated++;
        } else {
          await supabase.from("exercise_library").insert(payload);
          added++;
        }
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    await supabase.from("library_updates").insert({
      exercises_added: added,
      exercises_updated: updated,
      status: "success",
      notes: `Refreshed ${MUSCLES.length} muscle groups`,
    });

    return new Response(JSON.stringify({ added, updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("refresh-library error:", e);
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    await supabase.from("library_updates").insert({
      status: "error",
      notes: "internal error",
    });
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
