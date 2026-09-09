import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Input validation schema (minimal, using runtime checks instead of zod to keep bundle small)
interface ChatRequest {
  messages?: Array<{ role: string; content: string }>;
  profile?: Record<string, any>;
}

function validateChatRequest(body: unknown): { valid: boolean; error?: string; data?: ChatRequest } {
  if (typeof body !== "object" || body === null) {
    return { valid: false, error: "Request body must be JSON object" };
  }
  const req = body as Record<string, any>;

  if (!Array.isArray(req.messages)) {
    return { valid: false, error: "Field 'messages' (array) is required" };
  }

  if (req.messages.length === 0 || req.messages.length > 50) {
    return { valid: false, error: "Messages array must have 1-50 items" };
  }

  // Validate message structure
  for (const msg of req.messages) {
    if (typeof msg !== "object" || !msg.role || !msg.content) {
      return { valid: false, error: "Each message must have 'role' and 'content'" };
    }
    if (typeof msg.content !== "string" || msg.content.length > 4000) {
      return { valid: false, error: "Message content must be string <= 4000 chars" };
    }
  }

  return { valid: true, data: req as ChatRequest };
}

// Rate limiter: Track requests per user per minute
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_PER_MINUTE = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const bucket = rateLimitStore.get(userId);

  if (!bucket || now > bucket.resetAt) {
    rateLimitStore.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (bucket.count >= RATE_LIMIT_PER_MINUTE) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  bucket.count++;
  return { allowed: true };
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...headers },
  });
}

const SYSTEM_PROMPT = `Você é o **FitForge AI**, assistente sênior em fitness, musculação, nutrição esportiva e performance.

Estilo: direto, motivador, baseado em evidências.
Idioma: português brasileiro.

Responda de forma concisa (max ~180 palavras) a menos que peçam aprofundamento.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // 1. Authentication
    const authHeader = req.headers.get("Authorization");
    const jwt = authHeader?.replace("Bearer ", "");
    if (!jwt) {
      return json({ error: "Não autenticado" }, 401);
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const { data: userData, error: authError } = await supabaseAuth.auth.getUser(jwt);
    if (authError || !userData?.user) {
      return json({ error: "Sessão inválida" }, 401);
    }

    const userId = userData.user.id;

    // 2. Rate limiting
    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      const retryAfterSec = rateLimit.retryAfter || 60;
      return json(
        { error: "Muitas requisições. Aguarde alguns segundos." },
        429,
        { "Retry-After": String(retryAfterSec) }
      );
    }

    // 3. Input validation
    const body = await req.json().catch(() => null);
    const validation = validateChatRequest(body);
    if (!validation.valid) {
      return json({ error: validation.error }, 400);
    }

    const { messages, profile } = validation.data!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY missing");
      return json({ error: "Serviço de IA não configurado." }, 500);
    }

    // 4. Sanitize messages
    const sanitizedMessages = messages
      .slice(-12) // Keep last 12 messages
      .map((m) => ({
        role: m.role,
        content: String(m.content).slice(0, 4000),
      }));

    // 5. Add context from profile
    let contextPrompt = SYSTEM_PROMPT;
    if (profile && typeof profile === "object") {
      const p = profile as Record<string, any>;
      const h = Number(p.height) || 0;
      const w = Number(p.weight) || 0;
      const age = Number(p.age) || 0;
      const bmi = w && h ? (w / ((h / 100) ** 2)).toFixed(1) : null;
      const tmb = w && h && age
        ? Math.round(
            p.sex === "female"
              ? 10 * w + 6.25 * h - 5 * age - 161
              : 10 * w + 6.25 * h - 5 * age + 5
          )
        : null;

      if (p.name || age || w || bmi || tmb) {
        contextPrompt += `\n\n## USUÁRIO\nNome: ${p.name || "—"} | Idade: ${age || "—"}\nPeso: ${w || "—"}kg | Altura: ${h || "—"}cm${bmi ? ` | IMC: ${bmi}` : ""}\n${tmb ? `TMB: ${tmb}kcal` : ""}`;
      }
    }

    // 6. Call AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          { role: "system", content: contextPrompt },
          ...sanitizedMessages,
        ],
        temperature: 0.7,
        stream: true,
      }),
    });

    // 7. Handle AI response
    if (!response.ok) {
      const status = response.status;
      const errorText = await response.text().catch(() => "");
      console.error(`AI gateway error: ${status} ${errorText}`);

      if (status === 429) {
        return json({ error: "IA indisponível (rate limit). Tente em 1 minuto." }, 429);
      }
      if (status === 402) {
        return json({ error: "Créditos de IA esgotados." }, 402);
      }
      return json({ error: "Erro ao conectar com a IA." }, 502);
    }

    // 8. Stream response
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return json({ error: "Erro interno do servidor" }, 500);
  }
});
