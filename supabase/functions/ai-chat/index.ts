import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

import { streamChatCompletion, GatewayError, type GeminiChatMessage, type GeminiChatFields } from "npm:@lovable.dev/ai-gateway@0.1.11";
import { safeRepositoryPath } from "../_shared/bot-tools.ts";

// Deno resolves npm specifiers separately from the browser TypeScript project.
declare module "npm:@lovable.dev/ai-gateway@0.1.11" {
  interface GeneratedModelsBySurface {
    "chat-completions": "google/gemini-3.6-flash";
  }
}

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

function getCorsHeaders(_req: Request) { return corsHeaders; }


const SYSTEM_PROMPT = `Você é o **FitForge AI**, assistente sênior em fitness, musculação, nutrição esportiva, composição corporal e performance, e também o **gestor autônomo** do treino do usuário dentro do app.

## Identidade
- Tom: direto, motivador, profissional — sem rodeios.
- Idioma: SEMPRE português brasileiro.
- Baseado em evidências (ACSM, ISSN, NSCA, Schoenfeld, Helms, Israetel). Cite quando relevante.

## Estilo de resposta
- **Concisa por padrão (máx ~180 palavras)**. Aprofunde só se pedirem.
- Use **markdown**: negrito para pontos-chave, listas curtas, headers \`##\` apenas em respostas longas.
- Sempre que prescrever treino: dê **séries × reps · descanso · RPE/RIR · cadência** quando fizer sentido.
- Sempre que prescrever dieta: dê **kcal, macros (P/C/G em g) e timing**.
- Cálculos (IMC, TMB Mifflin-St Jeor, GET, macros, 1RM Epley/Brzycki, volume semanal por grupo) — faça na hora, mostre fórmula em uma linha.

## Base técnica (use ativamente)
- **Volume**: 10-20 séries efetivas/semana por grupo; MEV≈8-10, MAV≈14-18, MRV≈20-25. Frequência 2x/semana por grupo é superior a 1x com volume igualado.
- **Intensidade**: hipertrofia 6-20 reps a 1-3 RIR; força 1-6 reps a 80-95% 1RM; resistência 15-30 reps.
- **Progressão**: sobrecarga progressiva por carga → reps → séries → densidade. Duplo progresso (chegar no topo da faixa de reps antes de subir carga). Deload a cada 4-8 semanas ou quando o desempenho cair 2 sessões seguidas.
- **Métodos avançados** (só para intermediário/avançado, 1-2 exercícios finais da sessão):
  - *Low Volume / HIT*: poucas séries até a falha, alta intensidade, mais recuperação.
  - *High Volume*: mais séries submáximas, ideal em fase de acúmulo.
  - *Myo-reps*: 1 série ativadora 12-20 reps a 0-1 RIR + minisséries de 3-5 reps com 5-10s de pausa.
  - *Drop-set*: falha → reduzir 20-30% da carga → continuar, 1-3 quedas.
  - *Rest-Pause*: falha → 10-20s de pausa → mais reps, 2-3 ciclos.
  - *Cluster sets*: séries fracionadas com 15-30s intra-série, preserva potência.
  - *BFR (oclusão)*: 20-30% 1RM, 30-15-15-15 reps, 30s de descanso, pressão 40-80% AOP, apenas membros. Contraindicado em risco cardiovascular/trombose.
  - *Séries excêntricas / tempo sob tensão*: 3-5s na fase negativa.
- **Recuperação**: 7-9h de sono, 1.6-2.2 g/kg de proteína, superávit 10-20% (ganho) ou déficit 15-25% (perda).

## Gestão autônoma
- Quando o contexto trouxer histórico, adesão e cargas, **analise a tendência antes de responder**: estagnação (sem ganho de carga/reps em ~3 semanas) → mudar estímulo; adesão < 60% → simplificar o plano; queda de desempenho → sugerir deload.
- Ao propor mudança no plano, seja específico: qual exercício, qual variável e por quanto tempo.
- Métodos avançados só podem ser trocados no **Modo Avançado** do app — oriente o usuário a ativá-lo quando fizer sentido.

## Personalização
- Use o PERFIL do usuário (quando fornecido) para ajustar prescrições à idade, sexo, peso, altura, nível, objetivo e disponibilidade.
- Sugira substituições quando o exercício pedido não couber no equipamento/lesão.

## Limites
- Não diagnostique patologias. Em sinais de alerta (dor aguda, tontura, sintomas cardíacos) → encaminhe a médico/fisio.
- Não recomende drogas/anabolizantes; explique riscos se perguntado.

## Fora do escopo
Responda brevemente e redirecione para fitness/saúde.

Emojis com moderação (💪 🏋️ 🥗 📊) — só quando agregam.`;

function fn(name: string, description: string, properties: Record<string, unknown>, required: string[]) {
  return { type: "function" as const, function: { name, description, parameters: { type: "object", properties, required } } };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  try {
    const authHeader = req.headers.get("Authorization");
    const jwt = authHeader?.replace("Bearer ", "");
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Não autenticado" }),
        { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const { data: userData, error: authError } = await supabaseAuth.auth.getUser(jwt);
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }),
        { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.messages)) {
      return new Response(JSON.stringify({ error: "Campo 'messages' (array) é obrigatório" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    const { messages, profile } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY ausente");
      return new Response(JSON.stringify({ error: "Serviço de IA não configurado." }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    const sanitizedMessages: GeminiChatMessage[] = messages
      .filter((m: any) => (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string")
      .slice(-12)
      .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));

    let contextPrompt = SYSTEM_PROMPT;
    if (profile && typeof profile === "object") {
      const p = profile as Record<string, any>;
      const h = Number(p.height) || 0;
      const w = Number(p.weight) || 0;
      const age = Number(p.age) || 0;
      const bmi = w && h ? (w / ((h / 100) ** 2)).toFixed(1) : null;
      // Mifflin-St Jeor
      let tmb: number | null = null;
      if (w && h && age) {
        tmb = p.sex === "female"
          ? Math.round(10 * w + 6.25 * h - 5 * age - 161)
          : Math.round(10 * w + 6.25 * h - 5 * age + 5);
      }
      const activityFactor = ({ sedentary: 1.2, light: 1.375, moderate: 1.55, intense: 1.725 } as any)[p.activity] || 1.4;
      const get = tmb ? Math.round(tmb * activityFactor) : null;

      contextPrompt += `\n\n## PERFIL DO USUÁRIO (use para personalizar tudo)
- Nome: ${p.name ?? "—"} | Idade: ${age || "—"} | Sexo: ${p.sex ?? "—"}
- Peso: ${w || "—"}kg | Altura: ${h || "—"}cm${bmi ? ` | IMC: ${bmi}` : ""}
- Objetivo: ${p.goal ?? "—"} | Nível: ${p.level ?? "—"}
- Frequência: ${p.daysPerWeek ?? "—"}x/sem · ${p.hoursPerSession ?? "—"}h/sessão
- Equipamento: ${p.equipment ?? "—"} | Restrições: ${p.restrictions ?? "nenhuma"}
${tmb ? `- TMB: ${tmb} kcal | GET estimado: ${get} kcal` : ""}`;
    }

    const latestText = sanitizedMessages.at(-1)?.content;
    const needsTrainingContext = typeof latestText === "string" && /trein|carga|exerc|lesao|progres|fadiga|desempenho|estagna|adesao/i.test(latestText);

    // Contexto real de treino do usuário (RLS aplicada via JWT) — permite gestão autônoma.
    if (needsTrainingContext) try {
      const db = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: `Bearer ${jwt}` } } },
      );
      const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const [hist, loads, plan] = await Promise.all([
        db.from("workout_history")
          .select("workout_date,completed_exercises,total_exercises,day_focus")
          .eq("user_id", userData.user.id).gte("workout_date", since).order("workout_date", { ascending: false }).limit(30),
        db.from("weight_logs")
          .select("exercise_name,weight,logged_at")
          .eq("user_id", userData.user.id).gte("logged_at", since).order("logged_at", { ascending: false }).limit(40),
        db.from("workout_plans")
          .select("title,days_per_week,updated_at")
          .eq("user_id", userData.user.id).eq("is_active", true).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      const sessions = hist.data ?? [];
      const adherence = sessions.length
        ? Math.round(
            (sessions.reduce((a: number, s: any) => a + (s.completed_exercises / Math.max(s.total_exercises, 1)), 0) /
              sessions.length) * 100,
          )
        : null;

      const byExercise = new Map<string, { first: number; last: number }>();
      for (const l of (loads.data ?? []).slice().reverse() as any[]) {
        const cur = byExercise.get(l.exercise_name);
        if (!cur) byExercise.set(l.exercise_name, { first: Number(l.weight), last: Number(l.weight) });
        else cur.last = Number(l.weight);
      }
      const trend = [...byExercise.entries()].slice(0, 8)
        .map(([n, v]) => `${n}: ${v.first}→${v.last}kg`).join(" | ");

      if (sessions.length || trend || plan.data) {
        contextPrompt += `\n\n## CONTEXTO DE TREINO (últimos 30 dias — use para análise e decisões)
- Plano ativo: ${plan.data?.title ?? "—"} (${plan.data?.days_per_week ?? "—"}x/sem, atualizado em ${plan.data?.updated_at?.slice(0, 10) ?? "—"})
- Treinos concluídos: ${sessions.length} | Adesão média: ${adherence !== null ? adherence + "%" : "—"}
- Método ativo: ${(profile as any)?.training_method ?? "padrão"} | Modo avançado: ${(profile as any)?.advanced_mode ? "ativo" : "inativo"}
- Evolução de cargas: ${trend || "sem registros"}
Se houver estagnação, baixa adesão ou queda de desempenho, aponte isso proativamente e proponha o ajuste concreto.`;
      }
    } catch (ctxErr) {
      console.error("contexto de treino indisponível:", ctxErr);
    }

    const db = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: `Bearer ${jwt}` } } },
    );
    const user = userData.user;
    const { data: isAdminData } = await db.rpc("is_master_admin", { uid: user.id });
    const isAdmin = isAdminData === true;

    contextPrompt += `\n\n## FERRAMENTAS (agente)
Você pode chamar ferramentas. Use-as quando agregarem dados reais:
- buscar_exercicios: catálogo do app (use para sugerir substituições existentes).
- ver_treino_atual / modificar_treino: lê e altera o plano ativo do usuário (substituir exercício, mudar séries/reps). Só altere quando o usuário pedir claramente.
- pesquisar_estudos: busca artigos científicos reais no PubMed. Cite título e link.
- pesquisar_web: busca resumos na Wikipédia (conceitos, definições).
${isAdmin ? "- [ADMIN] metricas_app, status_rotinas, auditoria_recente, github_repo: o usuário é o Master Admin — pode consultar dados gerais do app e o repositório lucasleomendel/dynamic-exercise-pal." : ""}
Nunca invente dados: se a ferramenta não retornar nada, diga isso.`;

    const tools: NonNullable<GeminiChatFields["tools"]> = [
      fn("buscar_exercicios", "Busca exercícios no catálogo do app por nome ou grupo muscular.", { termo: { type: "string" } }, ["termo"]),
      fn("ver_treino_atual", "Retorna o plano de treino ativo do usuário.", {}, []),
      fn("modificar_treino", "Altera um exercício no plano ativo do usuário: substitui por outro e/ou muda séries e repetições.", {
        exercicio_atual: { type: "string", description: "Nome (ou parte) do exercício no plano" },
        novo_nome: { type: "string", description: "Novo exercício (vazio para manter)" },
        series: { type: "number", description: "Novas séries (0 para manter)" },
        repeticoes: { type: "string", description: "Nova faixa de reps (vazio para manter)" },
      }, ["exercicio_atual"]),
      fn("pesquisar_estudos", "Pesquisa estudos científicos no PubMed (use termos em inglês).", { consulta: { type: "string" } }, ["consulta"]),
      fn("pesquisar_web", "Pesquisa resumos na Wikipédia em português.", { consulta: { type: "string" } }, ["consulta"]),
    ];
    if (isAdmin) {
      tools.push(
        fn("metricas_app", "Totais do app: perfis, planos ativos, exercícios, treinos nos últimos 7 dias.", {}, []),
        fn("status_rotinas", "Últimas execuções das rotinas automáticas e da varredura da biblioteca.", {}, []),
        fn("auditoria_recente", "Últimos registros do log de auditoria.", { limite: { type: "number" } }, []),
        fn("github_repo", "Consulta o repositório no GitHub: commits recentes, lista de arquivos de uma pasta ou conteúdo de um arquivo.", {
          acao: { type: "string", enum: ["commits", "listar", "arquivo"] },
          caminho: { type: "string", description: "Pasta ou arquivo (ex: src/lib)" },
        }, ["acao"]),
      );
    }

    const used = new Set<string>();
    const exec = async (name: string, args: any): Promise<unknown> => {
      used.add(name);
      const adminOnly = ["metricas_app", "status_rotinas", "auditoria_recente", "github_repo"];
      if (adminOnly.includes(name) && !isAdmin) return { erro: "Permissão negada" };
      switch (name) {
        case "buscar_exercicios": {
          const t = String(args.termo ?? "").slice(0, 60).replace(/[%,()]/g, "");
          const { data } = await db.from("exercise_library").select("name,muscle_group,difficulty")
            .or(`name.ilike.%${t}%,muscle_group.ilike.%${t}%`).limit(15);
          return data ?? [];
        }
        case "ver_treino_atual": {
          const { data } = await db.from("workout_plans").select("id,title,plan_data")
            .eq("user_id", user.id).eq("is_active", true).order("updated_at", { ascending: false }).limit(1).maybeSingle();
          if (!data) return { erro: "Nenhum plano ativo" };
          const pd: any = data.plan_data;
          return { titulo: data.title, dias: (pd?.days ?? []).map((d: any) => ({ dia: d.day, foco: d.focus, exercicios: (d.exercises ?? []).map((e: any) => `${e.name} ${e.sets}x${e.reps}`) })) };
        }
        case "modificar_treino": {
          const { data } = await db.from("workout_plans").select("id,title,plan_data")
            .eq("user_id", user.id).eq("is_active", true).order("updated_at", { ascending: false }).limit(1).maybeSingle();
          if (!data) return { erro: "Nenhum plano ativo" };
          const pd: any = structuredClone(data.plan_data);
          const alvo = String(args.exercicio_atual ?? "").toLowerCase().trim();
          if (!alvo) return { erro: "Exercício não informado" };
          let changed = 0;
          for (const d of pd?.days ?? []) for (const e of d.exercises ?? []) {
            if (String(e.name).toLowerCase().includes(alvo)) {
              if (args.novo_nome) e.name = String(args.novo_nome).slice(0, 120);
              const s = Math.round(Number(args.series) || 0);
              if (s > 0) e.sets = Math.min(Math.max(s, 1), 6);
              if (args.repeticoes) e.reps = String(args.repeticoes).slice(0, 30);
              changed++;
            }
          }
          if (!changed) return { erro: `Exercício "${args.exercicio_atual}" não encontrado no plano` };
          const { error } = await db.from("workout_plans").update({ plan_data: pd, updated_at: new Date().toISOString() }).eq("id", data.id);
          if (error) return { erro: error.message };
          await db.from("audit_log").insert({ actor_id: user.id, actor_email: user.email, action: "update", entity: "workout_plan", entity_id: data.id, entity_label: data.title, details: { via: "agente_chat", ...args } });
          return { ok: true, alterados: changed };
        }
        case "pesquisar_estudos": {
          const q = encodeURIComponent(String(args.consulta ?? "").slice(0, 200));
          const s = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=5&sort=relevance&term=${q}`).then(r => r.json());
          const ids: string[] = s?.esearchresult?.idlist ?? [];
          if (!ids.length) return [];
          const sum = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`).then(r => r.json());
          return ids.map(id => ({ titulo: sum?.result?.[id]?.title, ano: sum?.result?.[id]?.pubdate, revista: sum?.result?.[id]?.source, link: `https://pubmed.ncbi.nlm.nih.gov/${id}/` }));
        }
        case "pesquisar_web": {
          const q = encodeURIComponent(String(args.consulta ?? "").slice(0, 200));
          const r = await fetch(`https://pt.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=3&srsearch=${q}`).then(r => r.json());
          const hits = r?.query?.search ?? [];
          const out = [];
          for (const h of hits) {
            const p = await fetch(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(h.title)}`).then(r => r.ok ? r.json() : null).catch(() => null);
            out.push({ titulo: h.title, resumo: p?.extract?.slice(0, 600), link: p?.content_urls?.desktop?.page });
          }
          return out;
        }
        case "metricas_app": {
          const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
          const c = async (q: any) => (await q).count ?? 0;
          return {
            perfis: await c(db.from("profiles").select("*", { count: "exact", head: true })),
            planos_ativos: await c(db.from("workout_plans").select("*", { count: "exact", head: true }).eq("is_active", true)),
            exercicios: await c(db.from("exercise_library").select("*", { count: "exact", head: true })),
            treinos_7_dias: await c(db.from("workout_history").select("*", { count: "exact", head: true }).gte("workout_date", since)),
          };
        }
        case "status_rotinas": {
          const [j, l] = await Promise.all([
            db.from("job_runs").select("job_name,status,attempt,error_message,started_at").order("started_at", { ascending: false }).limit(10),
            db.from("library_updates").select("status,exercises_added,notes,ran_at").order("ran_at", { ascending: false }).limit(5),
          ]);
          return { rotinas: j.data ?? [], varredura: l.data ?? [] };
        }
        case "auditoria_recente": {
          const n = Math.min(Math.max(Number(args.limite) || 10, 1), 30);
          const { data } = await db.from("audit_log").select("created_at,actor_email,action,entity,entity_label").order("created_at", { ascending: false }).limit(n);
          return data ?? [];
        }
        case "github_repo": {
          const ghKey = Deno.env.get("GITHUB_API_KEY");
          if (!ghKey) return { erro: "Conexão com GitHub indisponível" };
          const base = "https://connector-gateway.lovable.dev/github/repos/lucasleomendel/dynamic-exercise-pal";
          const path = String(args.caminho ?? "").replace(/^\/+|\.\./g, "").slice(0, 200);
          if (!safeRepositoryPath(path)) return { erro: "Caminho não permitido" };
          const h: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "fitforge-agent" };
          if (ghKey) { h.Authorization = `Bearer ${LOVABLE_API_KEY}`; h["X-Connection-Api-Key"] = ghKey; }
          if (args.acao === "commits") {
            const r = await fetch(`${base}/commits?per_page=10`, { headers: h });
            if (!r.ok) return { erro: `GitHub ${r.status}: ${(await r.text()).slice(0, 300)}` };
            return (await r.json()).map((c: any) => ({ data: c.commit?.author?.date, msg: String(c.commit?.message ?? "").split("\n")[0], sha: c.sha?.slice(0, 7) }));
          }
          const r = await fetch(`${base}/contents/${path}`, { headers: h });
          if (!r.ok) return { erro: `GitHub ${r.status}: ${(await r.text()).slice(0, 300)}` };
          const d = await r.json();
          if (Array.isArray(d)) return d.map((f: any) => `${f.type === "dir" ? "📁" : "📄"} ${f.path}`);
          const txt = d.content ? new TextDecoder().decode(Uint8Array.from(atob(d.content.replace(/\n/g, "")), c => c.charCodeAt(0))) : "";
          return { arquivo: d.path, conteudo: txt.slice(0, 6000), truncado: txt.length > 6000 };
        }
      }
      return { erro: "Ferramenta desconhecida" };
    };

    const convo: GeminiChatMessage[] = [{ role: "system", content: contextPrompt }, ...sanitizedMessages];
    const LABELS: Record<string, string> = {
      buscar_exercicios: "catálogo", ver_treino_atual: "seu treino", modificar_treino: "treino alterado",
      pesquisar_estudos: "PubMed", pesquisar_web: "web", metricas_app: "métricas",
      status_rotinas: "rotinas", auditoria_recente: "auditoria", github_repo: "GitHub",
    };
    const cancellation = new AbortController();
    req.signal.addEventListener("abort", () => cancellation.abort(), { once: true });
    const enc = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(ctrl) {
        const send = (body: unknown) => ctrl.enqueue(enc.encode(`data: ${JSON.stringify(body)}\n\n`));
        const delta = (content: string) => send({ choices: [{ delta: { content } }] });
        let wrote = false;
        try {
          // Emit tokens immediately; don't wait for an entire generated answer.
          for (let step = 0; step < 6; step++) {
            const output = await streamChatCompletion({
              model: "google/gemini-3.6-flash", messages: convo, tools, temperature: 0.7,
            }, { signal: cancellation.signal });
            const pending = new Map<number, { id: string; type: "function"; function: { name: string; arguments: string } }>();
            let content = "";
            let prefixSent = false;
            for await (const event of output) {
              for (const choice of event.choices ?? []) {
                const d = choice.delta;
                for (const call of d?.tool_calls ?? []) {
                  const current = pending.get(call.index) ?? { id: "", type: "function", function: { name: "", arguments: "" } };
                  if (call.id) current.id = call.id;
                  if (call.function?.name) current.function.name += call.function.name;
                  if (call.function?.arguments) current.function.arguments += call.function.arguments;
                  pending.set(call.index, current);
                }
                if (d?.content) {
                  if (!prefixSent && used.size) {
                    delta(`_Consultou: ${[...used].map(u => LABELS[u] ?? u).join(" · ")}_\n\n`);
                    prefixSent = true;
                  }
                  content += d.content;
                  delta(d.content);
                  wrote = true;
                }
              }
            }
            const calls = [...pending.values()];
            if (!calls.length) break;
            convo.push({ role: "assistant", content, tool_calls: calls });
            // Preserve mutation ordering; independent read-only tools run together.
            const executeCall = async (call: typeof calls[number]): Promise<GeminiChatMessage> => {
              let result: unknown;
              try { result = await exec(call.function.name, JSON.parse(call.function.arguments || "{}")); }
              catch (error) { result = { erro: error instanceof Error ? error.message : "Falha na consulta" }; }
              return { role: "tool", tool_call_id: call.id, content: JSON.stringify(result).slice(0, 8000) };
            };
            if (calls.some(c => c.function.name === "modificar_treino")) {
              for (const call of calls) convo.push(await executeCall(call));
            } else {
              convo.push(...await Promise.all(calls.map(executeCall)));
            }
          }
          if (!wrote) delta("Não consegui concluir a tarefa agora. Tente reformular o pedido.");
        } catch (error) {
          if (cancellation.signal.aborted) return;
          const status = error instanceof GatewayError ? error.httpStatus : undefined;
          console.error("ai-chat stream failed", error instanceof GatewayError ? error.toJSON() : String(error));
          send({ error: status === 402 ? "Créditos de IA esgotados." : "Não foi possível concluir a resposta.", status: status ?? 502 });
        } finally {
          if (!cancellation.signal.aborted) {
            ctrl.enqueue(enc.encode("data: [DONE]\n\n"));
            ctrl.close();
          }
        }
      },
      cancel() { cancellation.abort(); },
    });
    return new Response(stream, { headers: { ...getCorsHeaders(req), "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  }
});
