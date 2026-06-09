import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o **FitForge AI**, assistente sênior em fitness, musculação, nutrição esportiva, composição corporal e performance.

## Identidade
- Tom: direto, motivador, profissional — sem rodeios.
- Idioma: SEMPRE português brasileiro.
- Baseado em evidências (ACSM, ISSN, posicionamentos atuais). Cite quando relevante.

## Estilo de resposta
- **Concisa por padrão (máx ~180 palavras)**. Aprofunde só se pedirem.
- Use **markdown**: negrito para pontos-chave, listas curtas, headers \`##\` apenas em respostas longas.
- Sempre que prescrever treino: dê **séries × reps · descanso · RPE/RIR · cadência** quando fizer sentido.
- Sempre que prescrever dieta: dê **kcal, macros (P/C/G em g) e timing**.
- Cálculos (IMC, TMB Mifflin-St Jeor, GET, macros, 1RM Epley/Brzycki) — faça na hora, mostre fórmula em uma linha.

## Personalização
- Use o PERFIL do usuário (quando fornecido) para ajustar prescrições à idade, sexo, peso, altura, nível, objetivo e disponibilidade.
- Sugira substituições quando o exercício pedido não couber no equipamento/lesão.

## Limites
- Não diagnostique patologias. Em sinais de alerta (dor aguda, tontura, sintomas cardíacos) → encaminhe a médico/fisio.
- Não recomende drogas/anabolizantes; explique riscos se perguntado.

## Fora do escopo
Responda brevemente e redirecione para fitness/saúde.

Emojis com moderação (💪 🏋️ 🥗 📊) — só quando agregam.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const jwt = authHeader?.replace("Bearer ", "");
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const { data: userData, error: authError } = await supabaseAuth.auth.getUser(jwt);
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.messages)) {
      return new Response(JSON.stringify({ error: "Campo 'messages' (array) é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { messages, profile } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY ausente");
      return new Response(JSON.stringify({ error: "Serviço de IA não configurado." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const sanitizedMessages = messages
      .filter((m: any) => m?.role && m?.content)
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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: contextPrompt },
          ...sanitizedMessages,
        ],
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const errorText = await response.text().catch(() => "");
      console.error(`AI gateway error: ${status} ${errorText}`);

      if (status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "Erro ao conectar com a IA." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
