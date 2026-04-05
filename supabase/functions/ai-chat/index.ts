import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o FitForge AI, um assistente especialista em fitness, musculação, nutrição esportiva, composição corporal e saúde.

Suas características:
- Responda SEMPRE em português brasileiro
- Seja objetivo, prático e baseado em evidências científicas atualizadas
- Use linguagem acessível mas tecnicamente precisa
- Forneça dicas de execução, séries, repetições e descanso quando relevante
- Pode recomendar substituições de exercícios
- Conhece periodização, hipertrofia, força, emagrecimento e performance
- Quando não souber algo com certeza, seja honesto e sugira consultar um profissional
- Use emojis moderadamente para tornar a conversa mais amigável (💪🏋️‍♂️🥗)
- Mantenha respostas concisas (máx 200 palavras) exceto quando o usuário pedir detalhes
- Pode fazer cálculos de IMC, TMB, macros quando solicitado
- Quando o usuário fornecer dados pessoais (peso, altura, idade, objetivo), use essas informações para personalizar as respostas

Se o usuário perguntar algo fora do escopo fitness/saúde, responda brevemente mas redirecione para o tema principal.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);

    if (!body || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({ error: "Campo 'messages' (array) é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not found in environment");
      return new Response(
        JSON.stringify({ error: "Serviço de IA não configurado. Contate o suporte." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize messages - only keep role and content
    const sanitizedMessages = messages
      .filter((m: any) => m?.role && m?.content)
      .slice(-20)
      .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...sanitizedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const errorText = await response.text().catch(() => "");
      console.error(`AI gateway error: ${status} ${errorText}`);

      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Aguarde alguns segundos e tente novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Contate o administrador." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Erro ao conectar com a IA. Tente novamente." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
