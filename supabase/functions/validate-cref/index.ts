import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// CREF format: XXXXXX-G/UF (6 digits, dash, G or P, slash, state code)
function isValidCrefFormat(cref: string): boolean {
  const pattern = /^\d{6}-[GP]\/[A-Z]{2}$/;
  return pattern.test(cref.toUpperCase());
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cref, userId } = await req.json();

    if (!cref || !userId) {
      return new Response(
        JSON.stringify({ valid: false, error: "CREF e userId são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const crefUpper = cref.toUpperCase().trim();

    if (!isValidCrefFormat(crefUpper)) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "Formato de CREF inválido. Use o formato: 000000-G/UF (ex: 012345-G/SP)" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For now, validate format only. In production, integrate with CONFEF API.
    // Store the validated CREF in user metadata
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { cref: crefUpper, role: "personal" },
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
