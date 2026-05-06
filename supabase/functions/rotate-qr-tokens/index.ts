// ============================================================
// FYDLY — Edge Function : rotate-qr-tokens
// Rotation quotidienne des tokens QR à 00h00 UTC
// Déclencher via pg_cron, Supabase Scheduled Functions, ou cron externe
// ============================================================
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getCorsHeaders(origin: string | null): Record<string, string> {
  const appUrl = Deno.env.get("APP_URL") ?? "https://fydly.vercel.app";
  const allowed = [appUrl, "http://localhost:5173", "http://localhost:4173"];
  const allowedOrigin = origin && allowed.includes(origin) ? origin : appUrl;
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("Origin"));

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // C-3 fix : refus explicite si CRON_SECRET absent ou header incorrect
    const authHeader = req.headers.get("authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Client avec service_role pour bypasser RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // 1. Désactiver tous les tokens actifs de la veille
    const { error: deactivateError } = await supabase
      .from("qr_tokens")
      .update({ is_active: false })
      .eq("is_active", true)
      .lt("valid_date", new Date().toISOString().split("T")[0]);

    if (deactivateError) throw deactivateError;

    // 2. Récupérer tous les commerçants actifs (trial ou active)
    const { data: merchants, error: merchantsError } = await supabase
      .from("merchants")
      .select("id, name")
      .in("subscription_status", ["trial", "active"]);

    if (merchantsError) throw merchantsError;
    if (!merchants || merchants.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "Aucun commerçant actif", tokens_created: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Générer un nouveau token UUID v4 pour chaque commerçant
    const today = new Date().toISOString().split("T")[0];
    const tokenInserts = merchants.map((merchant: { id: string; name: string }) => ({
      merchant_id: merchant.id,
      token: crypto.randomUUID(),
      valid_date: today,
      is_active: true,
    }));

    const { error: insertError, data: insertedTokens } = await supabase
      .from("qr_tokens")
      .insert(tokenInserts)
      .select();

    if (insertError) throw insertError;

    console.log(`[rotate-qr-tokens] ${insertedTokens?.length} tokens générés pour ${today}`);

    return new Response(
      JSON.stringify({
        success: true,
        date: today,
        tokens_created: insertedTokens?.length ?? 0,
        merchants_processed: merchants.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[rotate-qr-tokens] Erreur:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erreur interne." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
