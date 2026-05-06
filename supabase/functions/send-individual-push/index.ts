// ============================================================
// FYDLY — Edge Function : send-individual-push
// verify_jwt:true — on parse le JWT directement, pas de getUser() réseau.
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

function getUserIdFromJwt(authHeader: string): string | null {
  try {
    const token = authHeader.replace("Bearer ", "");
    const [, payloadB64] = token.split(".");
    const payload = JSON.parse(atob(payloadB64));
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("Origin"));

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const oneSignalApiKey = Deno.env.get("ONESIGNAL_API_KEY");
  const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID");

  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Non authentifié" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // verify_jwt:true a déjà validé la signature — on lit juste le sub
  const userId = getUserIdFromJwt(authHeader);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Token invalide" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { customer_id, message, type = "system" } = await req.json();

    if (!customer_id || !message) {
      return new Response(
        JSON.stringify({ error: "Paramètres manquants (customer_id, message)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select("onesignal_player_id")
      .eq("id", customer_id)
      .single();

    if (!customer?.onesignal_player_id) {
      return new Response(
        JSON.stringify({ success: true, sent: false, reason: "Client sans player_id" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!oneSignalApiKey || !oneSignalAppId) {
      return new Response(
        JSON.stringify({ success: true, sent: false, reason: "OneSignal non configuré" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const oneSignalResponse = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${oneSignalApiKey}` },
      body: JSON.stringify({
        app_id: oneSignalAppId,
        include_subscription_ids: [customer.onesignal_player_id],
        contents: { fr: message, en: message },
        headings: { fr: "Fydly", en: "Fydly" },
        data: { type },
      }),
    });

    const oneSignalData = await oneSignalResponse.json();

    return new Response(
      JSON.stringify({ success: true, sent: oneSignalResponse.ok, onesignal_id: oneSignalData.id ?? null }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[send-individual-push] Erreur:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erreur interne." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
