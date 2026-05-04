import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function isValidCrefFormat(cref: string): boolean {
  return /^\d{6}-[GP]\/[A-Z]{2}$/.test(cref.toUpperCase());
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller JWT
    const authHeader = req.headers.get("Authorization");
    const jwt = authHeader?.replace("Bearer ", "");
    if (!jwt) {
      return new Response(
        JSON.stringify({ valid: false, error: "Não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userClient = createClient(supabaseUrl, anonKey);
    const { data: userData, error: authError } = await userClient.auth.getUser(jwt);
    if (authError || !userData?.user) {
      return new Response(
        JSON.stringify({ valid: false, error: "Sessão inválida" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const userId = userData.user.id;

    const { cref } = await req.json().catch(() => ({}));
    if (!cref || typeof cref !== "string") {
      return new Response(
        JSON.stringify({ valid: false, error: "CREF é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const crefUpper = cref.toUpperCase().trim();
    if (!isValidCrefFormat(crefUpper)) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: "Formato de CREF inválido. Use o formato: 000000-G/UF (ex: 012345-G/SP)",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const admin = createClient(supabaseUrl, serviceKey);
    // Write to app_metadata (admin-only) so users cannot self-promote
    const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
      app_metadata: { cref: crefUpper, role: "personal" },
    });

    if (updateError) {
      console.error("Error updating user:", updateError);
      return new Response(
        JSON.stringify({ valid: false, error: "Erro ao salvar CREF" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ valid: true, cref: crefUpper }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("validate-cref error:", e);
    return new Response(
      JSON.stringify({ valid: false, error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
