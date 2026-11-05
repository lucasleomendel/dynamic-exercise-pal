import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { routeBotQuery, canUseBotTool, safeRepositoryPath } from "../_shared/bot-tools.ts";

const schema = z.object({ text: z.string().trim().min(1).max(4000) });
const labels: Record<string, string> = {
  ver_treino_atual: "Seu treino · workout_plans", historico_aluno: "Seu histórico · workout_history, weight_logs, progression_log",
  perfil_aluno: "Seu perfil · profiles", metricas_app: "Métricas · profiles, workout_plans, exercise_library, workout_history",
  status_rotinas: "Rotinas · job_runs, library_updates", auditoria_recente: "Auditoria · audit_log", github_repo: "GitHub · lucasleomendel/dynamic-exercise-pal",
};
function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ error: "Método não permitido" }, 405);
  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return reply({ error: "Faça login para consultar seus dados." }, 401);
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !key) return reply({ error: "Consultas indisponíveis." }, 503);
    const db = createClient(url, key, { global: { headers: { Authorization: authorization } } });
    const { data: auth, error: authError } = await db.auth.getUser(authorization.slice(7));
    if (authError || !auth.user) return reply({ error: "Sessão inválida. Entre novamente." }, 401);
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return reply({ error: "Informe uma pergunta de até 4000 caracteres." }, 400);
    const query = routeBotQuery(parsed.data.text);
    if (!query) return reply({ handled: false });
    const { data: admin } = await db.rpc("is_master_admin", { uid: auth.user.id });
    if (!canUseBotTool(query.tool, admin === true)) return reply({ error: "Esta consulta é exclusiva do administrador." }, 403);
    const read = async (request: PromiseLike<{ data: unknown; error: { message: string } | null }>) => {
      const result = await request;
      if (result.error) throw new Error(result.error.message);
      return result.data;
    };
    let data: unknown;
    let content = "";
    if (query.tool === "github_repo") {
      const ghKey = Deno.env.get("GITHUB_API_KEY");
      const gatewayKey = Deno.env.get("LOVABLE_API_KEY");
      if (!ghKey || !gatewayKey) return reply({ error: "Conexão com o GitHub indisponível." }, 503);
      const path = query.path ?? "";
      if (!safeRepositoryPath(path)) return reply({ error: "Caminho de arquivo não permitido." }, 400);
      if (query.action === "arquivo" && !path) return reply({ handled: true, content: "Informe o arquivo, por exemplo: leia arquivo src/pages/Index.tsx." });
      const endpoint = query.action === "commits" ? "commits?per_page=5" : `contents/${path.split("/").map(encodeURIComponent).join("/")}`;
      const response = await fetch(`https://connector-gateway.lovable.dev/github/repos/lucasleomendel/dynamic-exercise-pal/${endpoint}`, {
        headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${gatewayKey}`, "X-Connection-Api-Key": ghKey },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        const details = await response.text();
        console.error(`GitHub failed [${response.status}]: ${details}`);
        return reply({ error: "Não foi possível consultar o GitHub.", status: response.status, details }, response.status);
      }
      const result = await response.json();
      if (query.action === "commits") {
        content = "**Commits recentes**\n\n" + result.map((c: { sha: string; html_url: string; commit: { message: string; author: { date: string } } }) =>
          `- [${c.sha.slice(0, 7)}](${c.html_url}) · ${c.commit.author.date}\n  ${c.commit.message.split("\n")[0]}`).join("\n");
      } else if (Array.isArray(result)) {
        content = "**Arquivos**\n\n" + result.filter(f => safeRepositoryPath(f.path)).slice(0, 100).map(f => `- ${f.type === "dir" ? "Pasta" : "Arquivo"}: ${f.path}`).join("\n");
      } else {
        const text = result.content ? new TextDecoder().decode(Uint8Array.from(atob(result.content.replace(/\n/g, "")), c => c.charCodeAt(0))) : "";
        content = `**${result.path}**\n\n\`\`\`\n${text.slice(0, 12000)}\n\`\`\`${text.length > 12000 ? "\n_Conteúdo limitado aos primeiros 12000 caracteres._" : ""}`;
      }
    } else if (query.tool === "ver_treino_atual") {
      const { data: plan, error } = await db.from("workout_plans").select("title,plan_data,updated_at").eq("user_id", auth.user.id).eq("is_active", true).order("updated_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw new Error(error.message);
      const planSchema = z.object({ days: z.array(z.object({ day: z.string(), focus: z.string(), exercises: z.array(z.object({ name: z.string(), sets: z.number(), reps: z.string() })) })) });
      const parsedPlan = planSchema.safeParse(plan?.plan_data);
      content = !plan ? "Nenhum plano ativo encontrado." : !parsedPlan.success ? "Seu plano está salvo, mas não foi possível ler os exercícios." : `**${plan.title}**\n\n` + parsedPlan.data.days.map(day => `**${day.day} · ${day.focus}**\n${day.exercises.map(e => `- ${e.name} — ${e.sets} × ${e.reps}`).join("\n")}`).join("\n\n");
    } else if (query.tool === "perfil_aluno") {
      data = await read(db.from("profiles").select("name,level,goal,weight,height,days_per_week").eq("id", auth.user.id).maybeSingle());
    } else if (query.tool === "historico_aluno") {
      const [sessions, loads, progression] = await Promise.all([
        db.from("workout_history").select("workout_date,day_focus,completed_exercises,total_exercises").eq("user_id", auth.user.id).order("workout_date", { ascending: false }).limit(10),
        db.from("weight_logs").select("exercise_name,weight,logged_at").eq("user_id", auth.user.id).order("logged_at", { ascending: false }).limit(10),
        db.from("progression_log").select("created_at,analysis,plan_changes").eq("user_id", auth.user.id).order("created_at", { ascending: false }).limit(5),
      ]);
      for (const result of [sessions, loads, progression]) if (result.error) throw new Error(result.error.message);
      content = "**Seu histórico**\n\n**Sessões recentes**\n" + ((sessions.data ?? []).map(s => `- ${s.workout_date.slice(0, 10)} · ${s.day_focus} · ${s.completed_exercises}/${s.total_exercises} exercícios`).join("\n") || "Nenhuma sessão registrada.")
        + "\n\n**Cargas recentes**\n" + ((loads.data ?? []).map(l => `- ${l.exercise_name} · ${l.weight} kg · ${l.logged_at.slice(0, 10)}`).join("\n") || "Nenhuma carga registrada.")
        + "\n\n**Progressão**\n" + ((progression.data ?? []).map(p => `- ${p.created_at.slice(0, 10)} · ${JSON.stringify(p.plan_changes ?? p.analysis)}`).join("\n") || "Nenhuma análise registrada.");
    } else if (query.tool === "metricas_app") {
      const count = async (request: PromiseLike<{ count: number | null; error: { message: string } | null }>) => {
        const result = await request;
        if (result.error) throw new Error(result.error.message);
        return result.count ?? 0;
      };
      const [profiles, plans, exercises, sessions] = await Promise.all([
        count(db.from("profiles").select("id", { count: "exact", head: true })),
        count(db.from("workout_plans").select("id", { count: "exact", head: true }).eq("is_active", true)),
        count(db.from("exercise_library").select("id", { count: "exact", head: true })),
        count(db.from("workout_history").select("id", { count: "exact", head: true }).gte("workout_date", new Date(Date.now() - 7 * 86400000).toISOString())),
      ]);
      content = `**Métricas do app**\n\n- Perfis: ${profiles}\n- Planos ativos: ${plans}\n- Exercícios: ${exercises}\n- Sessões nos últimos 7 dias: ${sessions}`;
    } else if (query.tool === "status_rotinas") {
      data = { rotinas: await read(db.from("job_runs").select("job_name,status,started_at,error_message").order("started_at", { ascending: false }).limit(5)), varredura: await read(db.from("library_updates").select("status,exercises_added,ran_at").order("ran_at", { ascending: false }).limit(5)) };
    } else {
      data = await read(db.from("audit_log").select("created_at,action,entity,entity_label").order("created_at", { ascending: false }).limit(10));
    }
    if (!content) content = data == null || (Array.isArray(data) && !data.length) ? "Nenhum registro encontrado nesta consulta." : `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
    return reply({ handled: true, content: `_Consultou: ${labels[query.tool]} · ${new Date().toISOString()}_\n\n${content}\n\n_Modo bot: consulta real, sem consumir créditos de IA._` });
  } catch (error) {
    console.error("bot-query:", error);
    return reply({ error: "Não foi possível concluir a consulta. Tente novamente." }, 502);
  }
});