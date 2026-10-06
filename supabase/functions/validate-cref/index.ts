import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const allowedOrigins = new Set([
  "https://dynamic-exercise-pal.lovable.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const allowOrigin = allowedOrigins.has(origin)
    ? origin
    : "https://dynamic-exercise-pal.lovable.app";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(req),
      "Content-Type": "application/json",
    },
  });
}

function isValidCrefFormat(cref: string): boolean {
  return /^\d{6}-[GP]\/[A-Z]{2}$/.test(cref.toUpperCase());
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) });
  }

  if (req.method !== "POST") {
    return json(req, { valid: false, error: "Método não permitido." }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    const jwt = authHeader?.replace(/^Bearer\s+/i, "").trim();

    if (!jwt) {
      return json(req, { valid: false, error: "Não autenticado." }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey);
    const { data: userData, error: authError } = await userClient.auth.getUser(jwt);

    if (authError || !userData?.user) {
      return json(req, { valid: false, error: "Sessão inválida." }, 401);
    }

    const user = userData.user;
    const { cref } = await req.json().catch(() => ({}));

    if (typeof cref !== "string" || !cref.trim()) {
      return json(req, { valid: false, error: "CREF é obrigatório." }, 400);
    }

    const crefUpper = cref.toUpperCase().trim();

    if (!isValidCrefFormat(crefUpper)) {
      return json(req, {
        valid: false,
        error: "Formato de CREF inválido. Use o formato: 000000-G/UF (ex: 012345-G/SP).",
      });
    }

    // A validação de formato não é prova de registro profissional.
    // Somente um usuário já aprovado pode receber/retirar acesso de Personal.
    const appMetadata = (user.app_metadata ?? {}) as Record<string, unknown>;
    const approvedCref = typeof appMetadata.cref === "string"
      ? appMetadata.cref.toUpperCase().trim()
      : "";
    const approvedRole = appMetadata.role === "personal";

    if (approvedRole && approvedCref === crefUpper) {
      return json(req, { valid: true, cref: crefUpper, approved: true });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { error: requestError } = await admin
      .from("personal_trainer_requests")
      .upsert({
        user_id: user.id,
        cref: crefUpper,
        status: "pending",
        reviewed_by: null,
        reviewed_at: null,
        rejection_reason: null,
      }, { onConflict: "user_id" });

    if (requestError) {
      console.error("Error creating personal trainer request:", requestError);
      return json(req, {
        valid: false,
        pending: false,
        error: "Não foi possível registrar a solicitação de CREF.",
      }, 500);
    }

    return json(req, {
      valid: false,
      pending: true,
      cref: crefUpper,
      error: "CREF recebido para análise. O acesso de Personal será liberado após aprovação.",
    });
  } catch (e) {
    console.error("validate-cref error:", e);
    return json(req, { valid: false, error: "Erro interno." }, 500);
  }
});
